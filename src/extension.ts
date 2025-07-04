interface Message {
  action: string;
  [key: string]: any;
}

interface DisableButtonsMessage extends Message {
  action: 'disableButtons';
  disableButtons: boolean;
}

interface CreateTableMessage extends Message {
  action: 'createTable';
  username: string;
  problems: ProblemData[];
  disableButtons: boolean;
  timeSinceApiKeyCreation: number;
}

interface SetUsernameMessage extends Message {
  action: 'setUsername';
  username: string;
}

interface CancelCountdownMessage extends Message {
  action: 'cancelCountdown';
}

interface ProblemData {
  titleSlug: string;
  link: string;
  lastCompletionDate: string;
  repeatDate: string;
}

interface GetUserInfoResponse {
  username: string | null;
  completedProblems: ProblemData[];
  disableButtons: boolean;
  apiKeyCreationTime: number;
}

interface DeleteResponse {
  success: boolean;
}

function setUsernameElement(username: string | null): boolean {
  const element = document.getElementById('username');
  if (element) {
    element.textContent = username ? username : 'LeetCode Login Needed!';
  }
  return true;
}

function setupRefreshButton(disableButtons: boolean): void {
  console.log('Setting up refresh button');
  const refreshButton = document.getElementById(
    'refresh-btn'
  ) as HTMLButtonElement | null;

  if (refreshButton) {
    refreshButton.disabled = disableButtons;
    refreshButton.onclick = async (): Promise<void> => {
      console.log('Refresh button clicked');
      await callGetUserInfo(true);
    };
  }
}

function setupDeleteButtons(disableButtons: boolean): void {
  console.log('Setting up delete buttons');
  const buttons = document.querySelectorAll('.delete-btn');

  console.log(`Setting up ${buttons.length} delete button(s)`);
  buttons.forEach((button) => {
    const buttonElement = button as HTMLButtonElement;
    buttonElement.disabled = disableButtons;
    buttonElement.onclick = async (e: MouseEvent): Promise<void> => {
      await deleteProblem(e);
    };
  });
}

function setAllButtonsDisabled(disableButtons: boolean): boolean {
  console.log(`Setting button clickability to ${!disableButtons}`);
  const container = document.getElementById('table-container');
  if (!container) return false;

  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = disableButtons;
    button.style.opacity = disableButtons ? '0.5' : '1';
    button.style.cursor = disableButtons ? 'not-allowed' : 'pointer';
  });
  return true;
}

function createRowElement(row: ProblemData): HTMLDivElement {
  console.log('Creating row element:');
  console.log(row);

  const problemDiv = document.createElement('div');
  const problemDataDiv = document.createElement('div');
  const link = document.createElement('a');
  const repeatDate = document.createElement('p');
  const lastCompletionDate = document.createElement('p');
  const deleteBtn = document.createElement('button');
  const img = document.createElement('img');

  problemDiv.className = 'problem';
  problemDataDiv.className = 'data';
  deleteBtn.className = 'delete-btn';
  img.src = './trash.svg';

  link.href = row.link;
  link.textContent = row.titleSlug;
  repeatDate.textContent = row.repeatDate;
  lastCompletionDate.textContent = row.lastCompletionDate;

  link.style.whiteSpace = 'nowrap';
  link.style.overflow = 'hidden';
  link.style.textOverflow = 'ellipsis';
  link.style.display = 'inline-block';

  problemDataDiv.appendChild(link);
  problemDataDiv.appendChild(repeatDate);
  problemDataDiv.appendChild(lastCompletionDate);
  deleteBtn.appendChild(img);

  problemDiv.appendChild(problemDataDiv);
  problemDiv.appendChild(deleteBtn);

  return problemDiv;
}

function createDeleteAllButton(): void {
  console.log('Creating delete all button');
  const element = document.getElementById('delete-all-btn');
  if (!element) return;

  element.style.display = 'flex';
  element.innerHTML = '';

  const text = document.createElement('p');
  const img = document.createElement('img');

  text.textContent = 'Delete All';
  img.src = './trash.svg';

  element.appendChild(text);
  element.appendChild(img);

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.style.marginLeft = '0';
  }

  element.onclick = async (): Promise<void> => {
    await deleteAllProblems();
  };
}

function initializeApiKeyTableCountdown(timeLeft: number): void {
  if (timeLeft <= 0) {
    return;
  }

  const deleteAllBtn = document.getElementById('delete-all-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  if (deleteAllBtn) {
    deleteAllBtn.style.display = 'none';
  }

  if (refreshBtn) {
    refreshBtn.style.marginLeft = 'auto';
  }

  (window as any).countdownActive = true;

  function updateCountdown(): void {
    if (!(window as any).countdownActive) {
      return;
    }

    const tableContent = document.getElementById('problem-table-content');
    if (tableContent) {
      tableContent.innerHTML = `<p>
      Initializing your API key...<br>
      Check here again in ${timeLeft} seconds!<br>
    </p>`;
    }

    timeLeft--;
    if (timeLeft >= 0 && (window as any).countdownActive) {
      setTimeout(updateCountdown, 1000);
    }
  }

  updateCountdown();
}

function initializeEmptyTable(): void {
  const tableContent = document.getElementById('problem-table-content');
  const deleteAllBtn = document.getElementById('delete-all-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  if (tableContent) {
    tableContent.innerHTML =
      '<p>No problems found. Complete problems to populate the table!</p>';
  }

  if (deleteAllBtn) {
    deleteAllBtn.style.display = 'none';
  }

  if (refreshBtn) {
    refreshBtn.style.marginLeft = 'auto';
  }
}

function createTable(
  problems: ProblemData[],
  disableButtons: boolean,
  timeSinceApiKeyCreation: number
): boolean {
  console.log('Creating table element');
  const tableElement = document.getElementById('problem-table-content');
  if (!tableElement) return false;

  setupRefreshButton(disableButtons);

  if (problems && problems.length > 0) {
    createDeleteAllButton();
    const table = document.createDocumentFragment();
    problems.forEach((row) => table.appendChild(createRowElement(row)));

    tableElement.innerHTML = '';
    tableElement.appendChild(table);
    setupDeleteButtons(disableButtons);
  } else if (
    35 - timeSinceApiKeyCreation > 0 &&
    !(window as any).countdownCancelled
  ) {
    initializeApiKeyTableCountdown(35 - timeSinceApiKeyCreation);
  } else {
    initializeEmptyTable();
  }

  return true;
}

async function deleteProblem(event: MouseEvent): Promise<void> {
  console.log('Delete button pressed');
  const target = event.target as HTMLElement;
  const clickedElement =
    target.tagName === 'IMG' ? target.parentElement : target;

  if (!clickedElement) return;

  const problemRow = (clickedElement as HTMLElement).closest('.problem');
  if (!problemRow) return;

  const titleElement = problemRow.querySelector('a');
  if (!titleElement || !titleElement.textContent) return;

  const problemTitleSlug = titleElement.textContent;

  const response = (await browser.runtime.sendMessage({
    action: 'deleteProblem',
    titleSlug: problemTitleSlug,
  })) as DeleteResponse;

  if (!response.success) {
    return;
  }

  problemRow.remove();
  const tableContent = document.getElementById('problem-table-content');
  if (tableContent && tableContent.children.length === 0) {
    initializeEmptyTable();
  }
}

async function deleteAllProblems(): Promise<void> {
  console.log('Delete all problems button pressed');
  const response = (await browser.runtime.sendMessage({
    action: 'deleteAllProblems',
  })) as DeleteResponse;

  if (response.success) {
    initializeEmptyTable();
  }
}

async function callGetUserInfo(shouldRefresh: boolean): Promise<void> {
  console.log('Calling getUserInfo');
  const { currentUser } = await browser.storage.local.get('currentUser');
  const tableContent = document.getElementById('problem-table-content');

  if ((!currentUser || shouldRefresh) && tableContent) {
    tableContent.innerHTML = '';
  }

  const response = (await browser.runtime.sendMessage({
    action: 'getUserInfo',
    shouldRefresh: shouldRefresh,
  })) as GetUserInfoResponse;

  console.log(response);
  setUsernameElement(response.username);
  createTable(
    response.completedProblems,
    response.disableButtons,
    Math.floor((Date.now() - response.apiKeyCreationTime) / 1000)
  );
}

async function setupGoogleLoginButton(): Promise<void> {
  console.log('Setting up Google login button!');
  const loginButton = document.getElementById(
    'login-button'
  ) as HTMLButtonElement | null;

  if (loginButton) {
    loginButton.onclick = async (): Promise<void> => {
      console.log('Google login button clicked');
      const response = await browser.runtime.sendMessage({
        action: 'initiateGoogleLogin',
      });

      if (response) {
        console.log(`valid response!!! api key: ${response}`);
        await setupExtension();
      } else {
        console.log('Google login failed');
      }
    };
  }
}

browser.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse): boolean => {
    console.log('Extension received message:', message);

    if (message.action === 'disableButtons') {
      const msg = message as DisableButtonsMessage;
      const success = setAllButtonsDisabled(msg.disableButtons);
      sendResponse({ success: success });
    }
    if (message.action === 'createTable') {
      const msg = message as CreateTableMessage;
      setUsernameElement(msg.username);
      const success = createTable(
        msg.problems,
        msg.disableButtons,
        msg.timeSinceApiKeyCreation
      );
      sendResponse({ success: success });
    }
    if (message.action === 'setUsername') {
      const msg = message as SetUsernameMessage;
      const success = setUsernameElement(msg.username);
      sendResponse({ success: success });
    }
    if (message.action === 'cancelCountdown') {
      (window as any).countdownActive = false;
      sendResponse({ success: true });
    }

    return true;
  }
);

async function cookiesValid(): Promise<boolean> {
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
    return false;
  }

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrftoken': csrftoken.value,
        cookie: `csrftoken=${csrftoken.value}; LEETCODE_SESSION=${LEETCODE_SESSION.value}`,
      },
      body: JSON.stringify({
        query: `
          query {
            userStatus {
              isSignedIn
            }
          }
        `,
      }),
    });

    const data = await response.json();
    console.log(data?.data?.userStatus?.isSignedIn);
    await browser.storage.local.set({
      csrftoken: csrftoken,
      LEETCODE_SESSION: LEETCODE_SESSION,
    });
    return data?.data?.userStatus?.isSignedIn === true;
  } catch (error) {
    console.log('Cookies Invalid!');
    return false;
  }
}

function handleCookieFlagElements(loggedIn: boolean): void {
  const cookieFlagElements = document.getElementsByClassName('cookie-flag');

  for (let i = 0; i < cookieFlagElements.length; i++) {
    const element = cookieFlagElements[i] as HTMLElement;

    if (element.tagName.toLowerCase() === 'button') {
      (element as HTMLButtonElement).disabled = !loggedIn;
      element.style.opacity = loggedIn ? '1' : '0.5';
      element.style.cursor = loggedIn ? 'pointer' : 'not-allowed';
    } else if (element.tagName.toLowerCase() === 'p') {
      element.style.display = loggedIn ? 'none' : 'block';
    }
  }
}

async function setupExtension(): Promise<void> {
  const loginScreen = document.getElementById('login-screen');
  const tableContainer = document.getElementById('table-container');

  if (loginScreen) {
    loginScreen.style.display = 'none';
  }

  if (tableContainer) {
    tableContainer.style.display = 'flex';
  }

  await callGetUserInfo(true);
}

document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  console.log('DOMContentLoaded event fired');
  const { apiKey } = await browser.storage.local.get('apiKey');

  if (!apiKey) {
    const tableContainer = document.getElementById('table-container');
    const loginScreen = document.getElementById('login-screen');

    if (tableContainer) {
      tableContainer.style.display = 'none';
    }

    if (loginScreen) {
      loginScreen.style.display = 'flex';
    }

    await setupGoogleLoginButton();
    handleCookieFlagElements(await cookiesValid());
  } else {
    await setupExtension();
  }
});

window.addEventListener('unload', (): void => {
  initializeEmptyTable();
});
