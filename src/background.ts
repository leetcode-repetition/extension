import { buildAuthUrl, CLIENT_ID, REDIRECT_URI } from './auth';

interface CurrentUser {
  username: string;
  userId: string;
  apiKey: string;
  apiKeyCreationTime: number;
  completedProblems: Record<string, ProblemData>;
}

interface ProblemData {
  link: string;
  titleSlug: string;
  repeatDate: string;
  lastCompletionDate: string;
}

interface APIResponse {
  [key: string]: any;
}

interface MessageResponse {
  username: string;
  userId: string;
  success: boolean;
}

interface UserNameAndIdResponse {
  username: string;
  userId: string;
}

interface GetUserInfoResponse {
  username: string | null;
  completedProblems: ProblemData[];
  disableButtons: boolean;
  apiKeyCreationTime: number;
}

interface LoginResult {
  apiKey: string | null;
  username: string | null;
  userId: string | null;
  apiKeyCreationTime: number;
}

interface Message {
  action: string;
  [key: string]: any;
}

async function sendToAPI(
  endpoint: string,
  method: string,
  requestData: any = null,
  extraHeaders: Record<string, string> = {}
): Promise<APIResponse> {
  const { currentUser } = await browser.storage.local.get('currentUser');
  const url = `https://3d6q6gdc2a.execute-api.us-east-2.amazonaws.com/prod/v1/${endpoint}`;

  let fetchOptions: RequestInit = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': currentUser ? currentUser.apiKey : '',
      ...extraHeaders,
    },
    ...(endpoint === 'create-key' && {
      credentials: 'include' as RequestCredentials,
    }),
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

async function launchLogin(): Promise<string | null> {
  const authUrl = await buildAuthUrl();
  const redirectTo = await browser.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });
  const code = new URL(redirectTo).searchParams.get('code');
  return code;
}

async function exchangeCodeForApiKey(
  code: string | null
): Promise<LoginResult> {
  if (!code) {
    console.log('No code provided');
    return { apiKey: null, username: null, userId: null, apiKeyCreationTime: 0 };
  }

  const verifier = sessionStorage.getItem('pkce_verifier');
  const LEETCODE_SESSION = await browser.cookies.get({
    url: 'https://leetcode.com',
    name: 'LEETCODE_SESSION',
  });
  const csrftoken = await browser.cookies.get({
    url: 'https://leetcode.com',
    name: 'csrftoken',
  });

  if (!LEETCODE_SESSION?.value || !csrftoken?.value) {
    console.log('LeetCode cookies not found');
    return { apiKey: null, username: null, userId: null, apiKeyCreationTime: 0 };
  }

  console.log(`Leetcode session: ${LEETCODE_SESSION}`);
  console.log(`CSRF token: ${csrftoken}`);

  const extraHeaders: Record<string, string> = {
    'X-Pkce-Verifier': verifier || '',
    'X-Auth-Code': code,
    'X-Csrf-Token': csrftoken.value,
    'X-Leetcode-Session': LEETCODE_SESSION.value,
    'X-Client-ID': CLIENT_ID,
    'X-Token-Endpoint': 'https://oauth2.googleapis.com/token',
  };

  try {
    const response = await sendToAPI(
      'create-key',
      'POST',
      { redirectUri: REDIRECT_URI },
      extraHeaders
    );

    const apiKey = response.apiKey;
    const username = response.username;
    // const userId = response.userId;
    // const newApiKey = response.newApiKey;
    const userId = '123'; // need to make API return userId
    const apiKeyCreationTime = 0;

    if (!apiKey || !username || !userId) {
      console.log('Error creating API key.');
      return { apiKey: null, username: null, userId: null, apiKeyCreationTime: 0 };
    }
    console.log(`Username: ${username}`, `User ID: ${userId}`, `API Key: ${apiKey}`, `Key Creation Time: ${apiKeyCreationTime}`);
    return { apiKey, username, userId, apiKeyCreationTime };
  } catch (error) {
    console.error('Error exchanging code for API key:', error);
    return { apiKey: null, username: null, userId: null, apiKeyCreationTime: 0 };
  }
}

async function sendMessageToExtensionTab(message: any): Promise<void> {
  try {
    await browser.runtime.sendMessage(message);
  } catch (error) {
    console.log('Extension tab not open!');
  }
}

async function disableButtons(state: boolean): Promise<void> {
  await browser.storage.local.set({
    disableButtons: state,
  });
  await sendMessageToExtensionTab({
    action: 'disableButtons',
    disableButtons: state,
  });
}

async function getUsernameAndUserId(): Promise<UserNameAndIdResponse> {
  const { username } = await browser.storage.local.get('username');
  const { userId } = await browser.storage.local.get('userId');
  return { username, userId };
}

async function addUserCompletedProblem(problem: ProblemData): Promise<boolean> {
  let { currentUser } = (await browser.storage.local.get('currentUser')) as {
    currentUser: CurrentUser;
  };

  const userId = currentUser.userId;
  if (!userId) {
    console.log('User ID not found');
    return false;
  }

  const completedProblem: ProblemData = {
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
      (a, b) =>
        new Date(a.repeatDate).getTime() - new Date(b.repeatDate).getTime()
    );

    const updatedProblems: Record<string, ProblemData> = {};
    sortedProblems.forEach((p) => {
      updatedProblems[p.titleSlug] = p;
    });

    console.log('Updated problems:', updatedProblems);
    await browser.storage.local.set({
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

async function deleteUserCompletedProblem(
  problemTitleSlug: string
): Promise<boolean> {
  const { currentUser } = (await browser.storage.local.get('currentUser')) as {
    currentUser: CurrentUser;
  };
  if (!currentUser || !currentUser.userId) {
    console.log('User not found or missing userId');
    return false;
  }

  const endpoint = `delete-row?userId=${currentUser.userId}&problemTitleSlug=${problemTitleSlug}`;

  try {
    const response = await sendToAPI(endpoint, 'DELETE');
    console.log('Row deleted:', response);

    const updatedProblems = { ...currentUser.completedProblems };
    delete updatedProblems[problemTitleSlug];

    await browser.storage.local.set({
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

async function fetchAndUpdateUserProblems(currentUser: CurrentUser): Promise<boolean> {
  console.log('Fetching problems for user:', currentUser);
  try {
    const tableResponse = await sendToAPI(`get-table?userId=${currentUser.userId}`, 'GET');
    const problemsObject: Record<string, ProblemData> = tableResponse.table
      .map(
        ({ link, titleSlug, repeatDate, lastCompletionDate }: ProblemData) => ({
          link,
          titleSlug,
          repeatDate,
          lastCompletionDate,
        })
      )
      .sort(
        (a: ProblemData, b: ProblemData) =>
          new Date(a.repeatDate).getTime() - new Date(b.repeatDate).getTime()
      )
      .reduce((acc: Record<string, ProblemData>, problem: ProblemData) => {
        acc[problem.titleSlug] = problem;
        return acc;
      }, {});

    await browser.storage.local.set({
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

async function getUserInfo(
  shouldRefresh: boolean
): Promise<GetUserInfoResponse> {
  let { currentUser } = (await browser.storage.local.get('currentUser')) as {
    currentUser: CurrentUser | undefined;
  };
  const { disableButtons } = (await browser.storage.local.get(
    'disableButtons'
  )) as { disableButtons: boolean };

  if (!currentUser || shouldRefresh) {
    const success = await setUserInfo();
    ({ currentUser } = (await browser.storage.local.get('currentUser')) as {
      currentUser: CurrentUser | undefined;
    });
    if (!success || !currentUser) {
      console.log('User not initialized');
      return {
        username: null,
        completedProblems: [],
        disableButtons: disableButtons || false,
        apiKeyCreationTime: -1,
      };
    }
  }

  return {
    username: currentUser.username,
    completedProblems: Object.values(currentUser.completedProblems),
    disableButtons: disableButtons || false,
    apiKeyCreationTime: currentUser.apiKeyCreationTime,
  };
}

async function checkIfProblemCompletedInLastDay(
  titleSlug: string
): Promise<boolean> {
  const { currentUser } = (await browser.storage.local.get('currentUser')) as {
    currentUser: CurrentUser | undefined;
  };
  if (!currentUser || !currentUser.completedProblems[titleSlug]) {
    return false;
  }

  const problem = currentUser.completedProblems[titleSlug];
  const lastCompletionDate = new Date(problem.lastCompletionDate);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return lastCompletionDate > oneDayAgo;
}

async function deleteAllUserCompletedProblems(): Promise<boolean> {
  const { currentUser } = (await browser.storage.local.get('currentUser')) as {
    currentUser: CurrentUser;
  };
  if (!currentUser || !currentUser.userId) {
    console.log('User not found or missing userId');
    return false;
  }

  const endpoint = `delete-table?userId=${currentUser.userId}`;

  try {
    await sendToAPI(endpoint, 'DELETE');
    await browser.storage.local.set({
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

async function initializeCurrentUser(apiKey: string, username: string, userId: string, apiKeyCreationTime: number) {
  const timeSinceApiKeyCreation = Math.floor((Date.now() - apiKeyCreationTime) / 1000);
  await browser.storage.local.set({
    currentUser: {
      apiKey,
      username,
      userId,
      apiKeyCreationTime,
      completedProblems: {},
    } as CurrentUser,
  });
  let { currentUser } = await browser.storage.local.get('currentUser');

  const success = await fetchAndUpdateUserProblems(currentUser);
  if (!success) {
    return false;
  }
  ({ currentUser } = await browser.storage.local.get('currentUser'));

  await sendMessageToExtensionTab({
    action: 'cancelCountdown',
  });
  await sendMessageToExtensionTab({
    action: 'createTable',
    username: currentUser.username,
    problems: Object.values(currentUser.completedProblems),
    disableButtons: false,
    timeSinceApiKeyCreation: timeSinceApiKeyCreation,
  });

  return true;
}

browser.runtime.onMessage.addListener(
  async (message: Message, sender): Promise<any> => {
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
      console.log(
        'Checking if problem is already completed:',
        message.titleSlug
      );
      return checkIfProblemCompletedInLastDay(message.titleSlug);
    }

    if (message.action === 'initiateGoogleLogin') {
      console.log('Beginning Google oauth2 process!');
      const { apiKey, username, userId, apiKeyCreationTime }= await exchangeCodeForApiKey(await launchLogin());
      console.log(`received response: ${apiKey}, ${username}, ${userId}, ${apiKeyCreationTime}`);
      
      if (apiKey && username && userId) {
        console.log(
          `valid login!!! api key: ${apiKey}, username: ${username}, userId: ${userId}`
        );
        await initializeCurrentUser(apiKey, username, userId, apiKeyCreationTime);
        return true;
      } else {
        console.log('Google login failed');
        return false;
      }
    }

    return Promise.resolve(false);
  });
