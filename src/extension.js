let username = null;

function createRowElement(row) {
  const problemDiv = document.createElement('div');
  const problemDataDiv = document.createElement('div');
  const link = document.createElement('a');
  const difficulty = document.createElement('p');
  const repeatOn = document.createElement('p');
  const lastSubmission = document.createElement('p');
  const numCompletions = document.createElement('p');
  const deleteBtn = document.createElement('button');
  const img = document.createElement('img');

  problemDiv.className = 'problem';
  problemDataDiv.className = 'data';
  deleteBtn.className = 'delete-btn';
  img.src = './static/trash.svg';

  link.href = row.link;
  link.textContent = row.title;
  difficulty.textContent = row.difficulty;
  repeatOn.textContent = row.repeatOn;
  lastSubmission.textContent = row.lastSubmission;
  numCompletions.textContent = row.numberCompletions;

  problemDataDiv.appendChild(link);
  problemDataDiv.appendChild(difficulty);
  problemDataDiv.appendChild(repeatOn);
  problemDataDiv.appendChild(lastSubmission);
  problemDataDiv.appendChild(numCompletions);
  deleteBtn.appendChild(img);

  problemDiv.appendChild(problemDataDiv);
  problemDiv.appendChild(deleteBtn);
}

function setupDeleteButtons() {
  const buttons = document.querySelectorAll('.delete-btn');
  console.log(`Setting up ${buttons.length} delete button(s)`);
  buttons.forEach((button) => {
    button.onclick = (e) => deleteRow(e);
  });
}

function updateUsernameElement() {
  if (username) {
    document.getElementById('username').textContent = username;
  } else {
    document.getElementById('username').textContent = 'Login Needed!';
  }
}

function deleteRowElement(element) {
  console.log('Deleting row element');
  element.remove();
}

function createTableElement() {
  console.log('Creating table element');
  element = document.getElementById('problem-table');

  const table = document.createDocumentFragment();
  data.table.forEach((row) => table.appendChild(createRowElement(row)));

  element.innerHTML = '';
  element.appendChild(table);

  setupDeleteButtons();
}

function postMessagePromise(message) {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(message, (response) => {
      if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

async function deleteRow(event) {
  console.log('Delete button pressed');
  const problemRow = event.target.closest('.delete-btn').closest('.problem');
  const problemName = problemRow.querySelector('a').textContent;

  try {
    await postMessagePromise({
      action: 'sendToAPI',
      data: {
        endpoint: `delete-row?username=${username}&problemName=${problemName}`,
        method: 'DELETE',
      },
    });
    deleteRowElement(problemRow);
  } catch (error) {
    console.error('Error deleting row:', error);
    return;
  }
}

async function getProblemTable() {
  console.log('Getting problem table');
  try {
    const response = await postMessagePromise({
      action: 'sendToAPI',
      data: {
        endpoint: `get-table?username=${username}`,
        method: 'GET',
      },
    });
    createTableElement();
  } catch (error) {
    console.error('Error getting problem table:', error);
    return;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded event fired');
  if (!username) {
    username = await new Promise(resolve => {
      browser.runtime.sendMessage({ action: 'getUsername' }, resolve);
    });
    updateUsernameElement();
    if (username) {
      await getProblemTable();
    }
  }
});
