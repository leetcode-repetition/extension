function setUsernameElement(username) {
  if (username) {
    document.getElementById('username').textContent = username;
  } else {
    document.getElementById('username').textContent = 'Login Needed!';
  }
}

function setupRefreshButton() {
  console.log('Setting up refresh button');
  const refreshButton = document.getElementById('refresh-btn');
  refreshButton.onclick = () => {
    console.log('Refresh button clicked');
    callGetUserInfo(true);
  };
}

function setupDeleteButtons() {
  console.log('Setting up delete buttons');
  const buttons = document.querySelectorAll('.delete-btn');
  console.log(`Setting up ${buttons.length} delete button(s)`);
  buttons.forEach((button) => {
    button.onclick = (e) => deleteRow(e);
  });
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
  link.style.maxWidth = '150px';
  link.style.display = 'inline-block';

  problemDataDiv.appendChild(link);
  problemDataDiv.appendChild(repeatDate);
  problemDataDiv.appendChild(lastCompletionDate);
  deleteBtn.appendChild(img);

  problemDiv.appendChild(problemDataDiv);
  problemDiv.appendChild(deleteBtn);

  return problemDiv;
}

function createTable(problems) {
  console.log('Creating table element');
  const element = document.getElementById('problem-table');
  console.log(problems);
  setupRefreshButton();

  if (problems && problems.length > 0) {
    const table = document.createDocumentFragment();
    problems.forEach((row) => table.appendChild(createRowElement(row)));
    element.innerHTML = '';
    element.appendChild(table);
    setupDeleteButtons();
  } else {
    element.innerHTML =
      '<p>No problems found. Complete problems to populate the table!</p>';
  }
}

function deleteRowElement(element) {
  console.log('Deleting row element');
  element.remove();
  const table = document.getElementById('problem-table');
  if (table.children.length === 0) {
    table.innerHTML =
      '<p>No problems found. Complete problems to populate the table!</p>';
  }
}

function deleteRow(event) {
  console.log('Delete button pressed');
  const problemRow = event.target.closest('.delete-btn').closest('.problem');
  const problemTitleSlug = problemRow.querySelector('a').textContent;

  browser.runtime
    .sendMessage({
      action: 'deleteRow',
      titleSlug: problemTitleSlug,
    })
    .then(() => {
      deleteRowElement(problemRow);
    })
    .catch((error) => {
      console.error('Error deleting row:', error);
    });
}

function callGetUserInfo(shouldRefresh) {
  console.log('Calling getUserInfo');
  browser.runtime
    .sendMessage({ action: 'getUserInfo', shouldRefresh: shouldRefresh })
    .then((response) => {
      console.log('Received response:', response);
      if (!response) {
        return;
      }
      setUsernameElement(response.username);
      createTable(response.problems);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded event fired');
  callGetUserInfo(false);
});

window.addEventListener('unload', () => {
  document.getElementById('problem-table').innerHTML =
    '<p>No problems found. Complete problems to populate the table!</p>';
});
