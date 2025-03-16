const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function disableButtons(state) {
  await browser.storage.sync.set({
    disableButtons: state,
  });
  try {
    await browser.runtime.sendMessage({
      action: 'disableButtons',
      disableButtons: state,
    });
  } catch (error) {
    console.log('Extension tab not open!');
  }
}

async function sendToAPI(endpoint, method, requestData) {
  const { currentUser } = await browser.storage.sync.get('currentUser');
  const url = `https://3d6q6gdc2a.execute-api.us-east-2.amazonaws.com/prod/v1/${endpoint}`;

  let fetchOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': currentUser ? currentUser.apiKey : '',
    },
  };

  if (requestData) {
    fetchOptions.body = JSON.stringify(requestData);
  }
  await disableButtons(true);

  const response = await fetch(url, fetchOptions);
  console.log('AWS Response: ', response);
  console.log('AWS Response status:', response.status);
  console.log('AWS Response headers:', Object.fromEntries(response.headers));

  await disableButtons(false);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseBody = await response.text();
  console.log('Response body:', responseBody);
  return JSON.parse(responseBody);
}

async function addUserCompletedProblem(problem) {
  let { currentUser } = await browser.storage.sync.get('currentUser');
  if (!currentUser) {
    await setUserInfo();
    ({ currentUser } = await browser.storage.sync.get('currentUser'));
  }

  const userId = currentUser.userId;
  const completedProblem = {
    link: problem.link,
    titleSlug: problem.titleSlug,
    repeatDate: problem.repeatDate,
    lastCompletionDate: problem.lastCompletionDate,
  };

  console.log('User:', userId);
  console.log('Problem Data:', completedProblem);

  try {
    const response = await sendToAPI(
      `insert-row?userId=${userId}`,
      'POST',
      completedProblem
    );

    console.log('Successfully inserted row:', response);
    const problems = Object.values(currentUser.completedProblems);
    problems.push(completedProblem);

    const sortedProblems = problems.sort(
      (a, b) => new Date(a.repeatDate) - new Date(b.repeatDate)
    );

    const updatedProblems = {};
    sortedProblems.forEach((p) => {
      updatedProblems[p.titleSlug] = p;
    });

    console.log('Updated problems:', updatedProblems);
    await browser.storage.sync.set({
      currentUser: {
        ...currentUser,
        completedProblems: updatedProblems,
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating problems! ERROR: ${error}`);
    throw error;
  }
}

async function deleteUserCompletedProblem(problemTitleSlug) {
  const { currentUser } = await browser.storage.sync.get('currentUser');
  const endpoint = `delete-row?userId=${currentUser.userId}&problemTitleSlug=${problemTitleSlug}`;

  try {
    const response = await sendToAPI(endpoint, 'DELETE', null);
    console.log('Row deleted:', response);

    const updatedProblems = { ...currentUser.completedProblems };
    delete updatedProblems[problemTitleSlug];

    await browser.storage.sync.set({
      currentUser: {
        ...currentUser,
        completedProblems: updatedProblems,
      },
    });
    return response;
  } catch (error) {
    console.error(`Error deleting row! ERROR: ${error}`);
    return error;
  }
}

async function fetchAndUpdateUserProblems(userId) {
  const { currentUser } = await browser.storage.sync.get('currentUser');

  try {
    const tableResponse = await sendToAPI(
      `get-table?userId=${userId}`,
      'GET',
      null
    );

    const problemsObject = tableResponse.table
      .map(({ link, titleSlug, repeatDate, lastCompletionDate }) => ({
        link,
        titleSlug,
        repeatDate,
        lastCompletionDate,
      }))
      .sort((a, b) => new Date(a.repeatDate) - new Date(b.repeatDate))
      .reduce((acc, problem) => {
        acc[problem.titleSlug] = problem;
        return acc;
      }, {});

    await browser.storage.sync.set({
      currentUser: {
        ...currentUser,
        completedProblems: problemsObject,
      },
    });

    return problemsObject;
  } catch (error) {
    console.log(`Error getting problems table! ERROR: ${error}`);
    return {};
  }
}

async function setUserInfo() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let username = null;
  let userId = null;

  try {
    const response = await browser.tabs.sendMessage(tabs[0].id, {
      action: 'getUsernameAndUserId',
    });
    username = response.username;
    userId = response.userId;

    if (!username || !userId) {
      throw new Error('Username not found - please log in to LeetCode');
    }
    console.log('Received username and userId');
  } catch (error) {
    console.log(`User not signed in! ERROR: ${error}`);
    return;
  }

  try {
    const response = await sendToAPI(
      `create-key?userId=${userId}`,
      'POST',
      null
    );
    console.log('Obtained new API key: ', response.apiKey);
    const apiKeyCreationTime = Date.now();
    await browser.storage.sync.set({
      currentUser: {
        username: username,
        userId: userId,
        apiKey: response.apiKey,
        apiKeyCreationTime: apiKeyCreationTime,
        completedProblems: {},
      },
    });
  } catch (error) {
    console.error(`Error obtaining API key! ERROR: ${error}`);
  }

  // give API key time to propagate
  const { currentUser } = await browser.storage.sync.get('currentUser');
  await disableButtons(true);
  try {
    await browser.runtime.sendMessage({
      action: 'createTable',
      problems: [],
      disableButtons: true,
      timeSinceApiKeyCreation: Math.floor(
        (Date.now() - currentUser.apiKeyCreationTime) / 1000
      ),
    });
  } catch (error) {
    console.log('Extension tab not open!');
  }
  console.log(
    'Waiting a 30 seconds to allow the API key to propagate through AWS'
  );
  await delay(30000);
  await disableButtons(false);

  try {
    const problemsObject = await fetchAndUpdateUserProblems(userId);
    console.log('Table Response:', problemsObject);
    const { currentUser } = await browser.storage.sync.get('currentUser');
    try {
      await browser.runtime.sendMessage({
        action: 'createTable',
        problems: currentUser.completedProblems,
        disableButtons: false,
        timeSinceApiKeyCreation: Math.floor(
          (Date.now() - currentUser.apiKeyCreationTime) / 1000
        ),
      });
    } catch (error) {
      console.log('Extension tab not open!');
    }
  } catch (error) {
    console.error('Error getting problem table:', error);
  }
}

async function getUserInfo(shouldRefresh) {
  const { currentUser } = await browser.storage.sync.get('currentUser');
  const { disableButtons } = await browser.storage.sync.get('disableButtons');

  if (!currentUser || shouldRefresh) {
    await setUserInfo();
    const { currentUser: refreshedUser } =
      await browser.storage.sync.get('currentUser');

    if (refreshedUser) {
      return {
        username: refreshedUser.username,
        completedProblems: Object.values(refreshedUser.completedProblems),
        disableButtons: disableButtons,
        apiKeyCreationTime: currentUser.apiKeyCreationTime,
      };
    }

    console.log('User not initialized');
    return {
      username: null,
      completedProblems: [],
      disableButtons: disableButtons,
      apiKeyCreationTime: currentUser.apiKeyCreationTime,
    };
  }

  return {
    username: currentUser.username,
    completedProblems: Object.values(currentUser.completedProblems),
    disableButtons: disableButtons,
    apiKeyCreationTime: currentUser.apiKeyCreationTime,
  };
}

async function checkIfProblemCompletedInLastDay(titleSlug) {
  const { currentUser } = await browser.storage.sync.get('currentUser');

  if (!currentUser || !currentUser.completedProblems[titleSlug]) {
    return false;
  }

  const problem = currentUser.completedProblems[titleSlug];
  const lastCompletionDate = new Date(problem.lastCompletionDate);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return lastCompletionDate > oneDayAgo;
}

async function deleteAllUserCompletedProblems() {
  const { currentUser } = await browser.storage.sync.get('currentUser');
  const endpoint = `delete-table?userId=${currentUser.userId}`;

  return await sendToAPI(endpoint, 'DELETE', null)
    .then(async (response) => {
      console.log('All Problems Deleted:', response);
      await browser.storage.sync.set({
        currentUser: {
          ...currentUser,
          completedProblems: {},
        },
      });
    })
    .catch((error) => {
      console.error(`Error deleting ALL problems! ERROR: ${error}`);
    });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action === 'getUserInfo') {
    (async () => {
      const userInfo = await getUserInfo(message.shouldRefresh);
      console.log(userInfo);
      sendResponse(userInfo);
    })();
  }
  if (message.action === 'problemCompleted') {
    (async () => {
      console.log('Problem completed:', message.data);
      await addUserCompletedProblem(message.data);
    })();
  }
  if (message.action === 'deleteProblem') {
    console.log('Deleting problem:', message.titleSlug);
    deleteUserCompletedProblem(message.titleSlug).then((result) => {
      sendResponse({ success: true, result });
    });
  }
  if (message.action === 'checkIfProblemCompletedInLastDay') {
    console.log('Checking if problem is already completed:', message.titleSlug);
    checkIfProblemCompletedInLastDay(message.titleSlug).then((isCompleted) => {
      sendResponse({ isCompleted });
    });
  }
  if (message.action === 'deleteAllProblems') {
    console.log('Deleting ALL problems');
    deleteAllUserCompletedProblems().then((result) => {
      sendResponse({ success: true, result });
    });
  }

  return true;
});
