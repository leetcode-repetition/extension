async function sendToAPI(endpoint, method, requestData = null) {
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
  await disableButtons(false);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const responseBody = await response.text();
  console.log('Response body:', responseBody);
  return JSON.parse(responseBody);
}

async function sendMessageToExtensionTab(message) {
  try {
    await browser.runtime.sendMessage(message);
  } catch (error) {
    console.log('Extension tab not open!');
  }
}

async function disableButtons(state) {
  await browser.storage.sync.set({
    disableButtons: state,
  });
  await sendMessageToExtensionTab({
    action: 'disableButtons',
    disableButtons: state,
  });
}

async function getUsernameAndUserId() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const response = await browser.tabs.sendMessage(tabs[0].id, {
    action: 'getUsernameAndUserId',
  });
  return { username: response.username, userId: response.userId };
}

async function setUserInfo() {
  const { username, userId } = await getUsernameAndUserId();
  if (!username || !userId) {
    console.log('Username not found - please log in to LeetCode!');
    return false;
  }

  console.log('Received username and userId');
  const apiKeyCreationTime = Date.now();
  try {
    const response = await sendToAPI(`create-key?userId=${userId}`, 'POST');
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
    return false;
  }

  let { currentUser } = await browser.storage.sync.get('currentUser');
  // give API key time to propagate through AWS (~30 seconds)
  await disableButtons(true);
  await sendMessageToExtensionTab({
    action: 'createTable',
    username: username,
    problems: [],
    disableButtons: true,
    timeSinceApiKeyCreation: Math.floor(
      (Date.now() - apiKeyCreationTime) / 1000
    ),
  });
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await disableButtons(false);

  const success = await fetchAndUpdateUserProblems(userId);
  if (!success) {
    return false;
  }

  ({ currentUser } = await browser.storage.sync.get('currentUser'));
  await sendMessageToExtensionTab({
    action: 'cancelCountdown',
  });
  await sendMessageToExtensionTab({
    action: 'createTable',
    username: currentUser.username,
    problems: currentUser.completedProblems,
    disableButtons: false,
    timeSinceApiKeyCreation: 9999999,
  });

  return true;
}

async function addUserCompletedProblem(problem) {
  let { currentUser } = await browser.storage.sync.get('currentUser');
  if (!currentUser) {
    const success = await setUserInfo();
    if (!success) {
      return false;
    }
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
    return true;
  } catch (error) {
    console.error(`Error updating problems! ERROR: ${error}`);
    return false;
  }
}

async function deleteUserCompletedProblem(problemTitleSlug) {
  const { currentUser } = await browser.storage.sync.get('currentUser');
  const endpoint = `delete-row?userId=${currentUser.userId}&problemTitleSlug=${problemTitleSlug}`;

  try {
    const response = await sendToAPI(endpoint, 'DELETE');
    console.log('Row deleted:', response);

    const updatedProblems = { ...currentUser.completedProblems };
    delete updatedProblems[problemTitleSlug];

    await browser.storage.sync.set({
      currentUser: {
        ...currentUser,
        completedProblems: updatedProblems,
      },
    });
    return true;
  } catch (error) {
    console.error(`Error deleting problem! ERROR: ${error}`);
    return false;
  }
}

async function fetchAndUpdateUserProblems(userId) {
  const { currentUser } = await browser.storage.sync.get('currentUser');

  try {
    const tableResponse = await sendToAPI(`get-table?userId=${userId}`, 'GET');
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
    return true;
  } catch (error) {
    console.log(`Error getting problems table! ERROR: ${error}`);
    return false;
  }
}

async function getUserInfo(shouldRefresh) {
  let { currentUser } = await browser.storage.sync.get('currentUser');
  const { disableButtons } = await browser.storage.sync.get('disableButtons');

  if (!currentUser || shouldRefresh) {
    const success = await setUserInfo();
    ({ currentUser } = await browser.storage.sync.get('currentUser'));
    if (!success) {
      console.log('User not initialized');
      return {
        username: null,
        completedProblems: [],
        disableButtons: disableButtons,
        apiKeyCreationTime: -1,
      };
    }
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

  try {
    await sendToAPI(endpoint, 'DELETE');
    await browser.storage.sync.set({
      currentUser: {
        ...currentUser,
        completedProblems: {},
      },
    });
    return true;
  } catch (error) {
    console.error(`Error deleting ALL problems! ERROR: ${error}`);
    return false;
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  console.log('Background received message:', message);

  if (message.action === 'getUserInfo') {
    return getUserInfo(message.shouldRefresh);
  }
  if (message.action === 'problemCompleted') {
    return addUserCompletedProblem(message.data).then((success) => ({
      success,
    }));
  }
  if (message.action === 'deleteProblem') {
    console.log('Deleting problem:', message.titleSlug);
    return deleteUserCompletedProblem(message.titleSlug).then((success) => ({
      success,
    }));
  }
  if (message.action === 'deleteAllProblems') {
    console.log('Deleting ALL problems');
    return deleteAllUserCompletedProblems().then((success) => ({ success }));
  }
  if (message.action === 'checkIfProblemCompletedInLastDay') {
    console.log('Checking if problem is already completed:', message.titleSlug);
    return checkIfProblemCompletedInLastDay(message.titleSlug);
  }

  return Promise.resolve(false);
});
