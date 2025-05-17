function setUsernameElement(username) {
  document.getElementById('username').textContent = username
    ? username
    : 'LeetCode Login Needed!';
  return true;
}

function setupRefreshButton(disableButtons) {
  console.log('Setting up refresh button');
  const refreshButton = document.getElementById('refresh-btn');

  refreshButton.disabled = disableButtons;
  refreshButton.onclick = async () => {
    console.log('Refresh button clicked');
    await callGetUserInfo(true);
  };
}

function setupDeleteButtons(disableButtons) {
  console.log('Setting up delete buttons');
  const buttons = document.querySelectorAll('.delete-btn');

  console.log(`Setting up ${buttons.length} delete button(s)`);
  buttons.forEach((button) => {
    button.disabled = disableButtons;
    button.onclick = async (e) => {
      await deleteProblem(e);
    };
  });
}

function setAllButtonsDisabled(disableButtons) {
  console.log(`Setting button clickability to ${!disableButtons}`);
  const container = document.getElementById('table-container');
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = disableButtons;
    button.style.opacity = disableButtons ? '0.5' : '1';
    button.style.cursor = disableButtons ? 'not-allowed' : 'pointer';
  });
  return true;
}

function createRowElement(row) {
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

function createDeleteAllButton() {
  console.log('Creating delete all button');
  const element = document.getElementById('delete-all-btn');

  element.style.display = 'flex';
  element.innerHTML = '';

  const text = document.createElement('p');
  const img = document.createElement('img');

  element.id = 'delete-all-btn';
  text.textContent = 'Delete All';
  img.src = './trash.svg';

  element.appendChild(text);
  element.appendChild(img);

  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.style.marginLeft = '0';

  element.onclick = async () => {
    await deleteAllProblems();
  };
}

function initializeApiKeyTableCountdown(timeLeft) {
  if (timeLeft <= 0) {
    return;
  }
  document.getElementById('delete-all-btn').style.display = 'none';
  document.getElementById('refresh-btn').style.marginLeft = 'auto';

  window.countdownActive = true;
  function updateCountdown() {
    if (!window.countdownActive) {
      return;
    }
    document.getElementById('problem-table-content').innerHTML = `<p>
    Initializing your API key...<br>
    Check here again in ${timeLeft} seconds!<br>
  </p>`;
    timeLeft--;
    if (timeLeft >= 0 && window.countdownActive) {
      setTimeout(updateCountdown, 1000);
    }
  }

  updateCountdown();
}

function initializeEmptyTable() {
  document.getElementById('problem-table-content').innerHTML =
    '<p>No problems found. Complete problems to populate the table!</p>';
  document.getElementById('delete-all-btn').style.display = 'none';
  document.getElementById('refresh-btn').style.marginLeft = 'auto';
}

function createTable(problems, disableButtons, timeSinceApiKeyCreation) {
  console.log('Creating table element');
  const tableElement = document.getElementById('problem-table-content');
  setupRefreshButton(disableButtons);

  if (problems && problems.length > 0) {
    createDeleteAllButton();
    const table = document.createDocumentFragment();
    problems.forEach((row) => table.appendChild(createRowElement(row)));

    tableElement.innerHTML = '';
    tableElement.appendChild(table);
    setupDeleteButtons(disableButtons);
  } else if (35 - timeSinceApiKeyCreation > 0 && !window.countdownCancelled) {
    initializeApiKeyTableCountdown(35 - timeSinceApiKeyCreation);
  } else {
    initializeEmptyTable();
  }

  return true;
}

async function deleteProblem(event) {
  console.log('Delete button pressed');
  const target =
    event.target.tagName === 'IMG' ? event.target.parentElement : event.target;
  const problemRow = target.closest('.problem');
  const problemTitleSlug = problemRow.querySelector('a').textContent;

  const response = await browser.runtime.sendMessage({
    action: 'deleteProblem',
    titleSlug: problemTitleSlug,
  });
  if (!response.success) {
    return;
  }

  problemRow.remove();
  if (document.getElementById('problem-table-content').children.length === 0) {
    initializeEmptyTable();
  }
}

async function deleteAllProblems() {
  console.log('Delete all problems button pressed');
  const response = await browser.runtime.sendMessage({
    action: 'deleteAllProblems',
  });
  if (response.success) {
    initializeEmptyTable();
  }
}

async function callGetUserInfo(shouldRefresh) {
  console.log('Calling getUserInfo');
  const { currentUser } = await browser.storage.sync.get('currentUser');

  if (!currentUser || shouldRefresh) {
    document.getElementById('problem-table-content').innerHTML = '';
  }

  const response = await browser.runtime.sendMessage({
    action: 'getUserInfo',
    shouldRefresh: shouldRefresh,
  });
  console.log(response);
  setUsernameElement(response.username);
  createTable(
    response.completedProblems,
    response.disableButtons,
    Math.floor((Date.now() - response.apiKeyCreationTime) / 1000)
  );
}

async function setupGoogleLoginButton() {
  console.log('Setting up Google login button!');
  document.getElementById('login-button').onclick = async () => {
    console.log('Google login button clicked');
    const response = await browser.runtime.sendMessage({
      action: 'initiateGoogleLogin',
    });
    if (response) {
      setupExtension();
    }
  };
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Extension received message:', message);

  if (message.action === 'disableButtons') {
    const success = setAllButtonsDisabled(message.disableButtons);
    sendResponse({ success: success });
  }
  if (message.action === 'createTable') {
    setUsernameElement(message.username);
    const success = createTable(
      message.problems,
      message.disableButtons,
      message.timeSinceApiKeyCreation
    );
    sendResponse({ success: success });
  }
  if (message.action === 'setUsername') {
    const success = setUsernameElement(message.username);
    sendResponse({ success: success });
  }
  if (message.action === 'cancelCountdown') {
    window.countdownActive = false;
    sendResponse({ success: true });
  }

  return true;
});

async function setupExtension() {
  document.getElementById('table-container').style.display = 'flex';
  document.getElementById('login-screen').style.display = 'none';
  await callGetUserInfo(false);
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded event fired');
  const { apiKey } = await browser.storage.sync.get('apiKey');
  // const apiKey = true;
  if (!apiKey) {
    document.getElementById('table-container').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    await setupGoogleLoginButton();
  } else {
    await setupExtension();
  }
});

window.addEventListener('unload', () => {
  initializeEmptyTable();
});
