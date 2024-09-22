let username = null;

function updateUsernameElement() {
  if (username) {
    document.getElementById('username').textContent = username;
  } else {
    document.getElementById('username').textContent = 'Login Needed!';
  }
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
  const difficulty = document.createElement('p');
  const repeatDate = document.createElement('p');
  const latestCompletedDate = document.createElement('p');
  const completedCount = document.createElement('p');
  const deleteBtn = document.createElement('button');
  const img = document.createElement('img');

  problemDiv.className = 'problem';
  problemDataDiv.className = 'data';
  deleteBtn.className = 'delete-btn';
  img.src = './static/trash.svg';

  link.href = row.link;
  link.textContent = row.titleSlug;
  difficulty.textContent = row.difficulty;
  repeatDate.textContent = row.repeatDate;
  latestCompletedDate.textContent = row.latestCompletedDate;
  completedCount.textContent = row.completedCount;

  problemDataDiv.appendChild(link);
  problemDataDiv.appendChild(difficulty);
  problemDataDiv.appendChild(repeatDate);
  problemDataDiv.appendChild(latestCompletedDate);
  problemDataDiv.appendChild(completedCount);
  deleteBtn.appendChild(img);

  problemDiv.appendChild(problemDataDiv);
  problemDiv.appendChild(deleteBtn);

  return problemDiv;
}

function createTableElement(data) {
  console.log('Creating table element');
  const element = document.getElementById('problem-table');

  if (data.table && data.table.length > 0) {
    const table = document.createDocumentFragment();
    data.table.forEach((row) => table.appendChild(createRowElement(row)));
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

async function getProblemTable() {
  console.log('Getting problem table');
  try {
    const response = await postMessagePromise({
      action: 'sendToAPI',
      data: {
        endpoint: `get-table?username=${username}`,
        method: 'GET',
        data: undefined,
      },
    });
    console.log(response);
    createTableElement(response);
  } catch (error) {
    console.error('Error getting problem table:', error);
    return;
  }
}

async function deleteRow(event) {
  console.log('Delete button pressed');
  const problemRow = event.target.closest('.delete-btn').closest('.problem');
  const problemTitleSlug = problemRow.querySelector('a').textContent;

  try {
    await postMessagePromise({
      action: 'sendToAPI',
      data: {
        endpoint: `delete-row?username=${username}&problemTitleSlug=${problemTitleSlug}`,
        method: 'DELETE',
        data: undefined,
      },
    });
    deleteRowElement(problemRow);
  } catch (error) {
    console.error('Error deleting row:', error);
    return;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded event fired');
  if (!username) {
    username = await new Promise((resolve) => {
      browser.runtime.sendMessage({ action: 'getUsername' }, resolve);
    });
    updateUsernameElement();
    if (username) {
      await getProblemTable();
    }
  }
});
