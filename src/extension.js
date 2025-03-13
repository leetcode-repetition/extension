function setUsernameElement(username) {
  if (username) {
    document.getElementById('username').textContent = username;
  } else {
    document.getElementById('username').textContent = 'Login Needed!';
  }
}

function setupRefreshButton(disableButtons) {
  console.log('Setting up refresh button');
  const refreshButton = document.getElementById('refresh-btn');
  refreshButton.disabled = disableButtons;
  refreshButton.onclick = () => {
    console.log('Refresh button clicked');
    callGetUserInfo(true);
  };
}

function setupDeleteButtons(disableButtons) {
  console.log('Setting up delete buttons');
  const buttons = document.querySelectorAll('.delete-btn');
  console.log(`Setting up ${buttons.length} delete button(s)`);
  buttons.forEach((button) => {
    button.disabled = disableButtons;
    button.onclick = (e) => {
      deleteProblem(e);
    };
  });
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

  element.onclick = () => {
    deleteAllProblems();
  };
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

function initializeApiKeyTableCountdown(timeLeft) {
  if (timeLeft <= 0) {
    return;
  }

  function updateCountdown() {
    document.getElementById('problem-table-content').innerHTML =
      `<p>Initializing API key!<br>Check again in ${timeLeft} seconds!</p>`;
    timeLeft--;
    if (timeLeft >= 0) {
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
  console.log(problems);
  setupRefreshButton(disableButtons);

  if (problems && problems.length > 0) {
    createDeleteAllButton();

    const table = document.createDocumentFragment();
    problems.forEach((row) => table.appendChild(createRowElement(row)));

    tableElement.innerHTML = '';
    tableElement.appendChild(table);

    setupDeleteButtons(disableButtons);
  } else if (29 - timeSinceApiKeyCreation > 0) {
    initializeApiKeyTableCountdown(29 - timeSinceApiKeyCreation);
  } else {
    initializeEmptyTable();
  }
}

function deleteProblem(event) {
  console.log('Delete button pressed');
  const target =
    event.target.tagName === 'IMG' ? event.target.parentElement : event.target;
  const problemRow = target.closest('.problem');
  const problemTitleSlug = problemRow.querySelector('a').textContent;

  browser.runtime
    .sendMessage({
      action: 'deleteProblem',
      titleSlug: problemTitleSlug,
    })
    .then(() => {
      problemRow.remove();
      if (
        document.getElementById('problem-table-content').children.length === 0
      ) {
        initializeEmptyTable();
      }
    });
}

function deleteAllProblems() {
  console.log('Delete all problems button pressed');
  browser.runtime
    .sendMessage({
      action: 'deleteAllProblems',
    })
    .then(() => {
      initializeEmptyTable();
    });
}

function callGetUserInfo(shouldRefresh) {
  console.log('Calling getUserInfo');
  const currentUser = async () => {
    const { currentUser } = await browser.storage.sync.get('currentUser');
    return currentUser;
  };

  if (!currentUser || shouldRefresh) {
    document.getElementById('problem-table-content').innerHTML = '';
  }

  browser.runtime
    .sendMessage({ action: 'getUserInfo', shouldRefresh: shouldRefresh })
    .then((response) => {
      console.log('Received response:', response);
      setUsernameElement(response.username);
      createTable(
        response.completedProblems,
        response.disableButtons,
        Math.floor((Date.now() - response.apiKeyCreationTime) / 1000)
      );
    });
}

function setAllButtonsDisabled(disableButtons) {
  console.log(`Setting button clickability to ${!disableButtons}`);
  const container = document.getElementById('container');
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = disableButtons;
    button.style.opacity = disableButtons ? '0.5' : '1';
    button.style.cursor = disableButtons ? 'not-allowed' : 'pointer';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded event fired');
  callGetUserInfo(false);
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action === 'disableButtons') {
    setAllButtonsDisabled(message.disableButtons);
    sendResponse({ success: true });
  }
  if (message.action === 'createTable') {
    createTable(
      message.problems,
      message.disableButtons,
      message.timeSinceApiKeyCreation
    );
    sendResponse({ success: true });
  }

  return true;
});

window.addEventListener('unload', () => {
  initializeEmptyTable();
});
