let username = null;

function createRowElement(row) {
  const dataRow = document.createElement('div');
  const dataDiv = document.createElement('div');
  const link = document.createElement('a');
  const difficulty = document.createElement('p');
  const repeatOn = document.createElement('p');
  const lastSubmission = document.createElement('p');
  const numCompletions = document.createElement('p');
  const deleteBtn = document.createElement('button');
  const img = document.createElement('img');

  dataRow.className = 'data-row';
  dataDiv.className = 'data';
  deleteBtn.className = 'delete-btn';
  img.src = './static/trash.svg';

  link.href = row.link;
  link.textContent = row.title;
  difficulty.textContent = row.difficulty;
  repeatOn.textContent = row.repeatOn;
  lastSubmission.textContent = row.lastSubmission;
  numCompletions.textContent = row.numberCompletions;

  dataDiv.appendChild(link);
  dataDiv.appendChild(difficulty);
  dataDiv.appendChild(repeatOn);
  dataDiv.appendChild(lastSubmission);
  dataDiv.appendChild(numCompletions);
  deleteBtn.appendChild(img);

  dataRow.appendChild(dataDiv);
  dataRow.appendChild(deleteBtn);
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

function sendToAPI(endpoint, method, data, element) {
  let url = `http://localhost:8080/${endpoint}`;
  fetchOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (method !== 'GET') {
    fetchOptions.body = JSON.stringify(data);
  } else {
    url += `?username=${encodeURIComponent(data.username)}`;
  }

  fetch(url, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
      console.log('Success:', data);
      if (endpoint === 'delete-row') {
        handleDeleteRowResponse(element);
      } else if (endpoint === 'get-table') {
        handleGetProblemTableResponse(data, element);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function deleteRow(event) {
  console.log('Delete button pressed');
  const button = event.target.closest('.delete-btn');
  const dataRow = button.closest('.data-row');
  const data = {
    data: {
      username: username,
      problemName: dataRow.querySelector('a').textContent,
    },
  };
  sendToAPI('delete-row', 'DELETE', data, dataRow);
}

function handleDeleteRowResponse(element) {
  console.log('Deleting row');
  element.remove();
}

function getProblemTable() {
  const table = document.getElementById('problem-table');
  console.log('Getting problem table for user:', username);
  sendToAPI('get-table', 'GET', { username: username }, table);
}

function handleGetProblemTableResponse(data, element) {
  console.log(data.error ? `Error: ${data.error}` : 'Success:', data);
  if (data.error || data.isEmpty) {
    element.innerHTML = data.error
      ? '<p>Error fetching data. Please try refreshing!</p>'
      : '<p>No problems found. Complete some problems to populate the table!</p>';
    return;
  }

  const table = document.createDocumentFragment();
  data.table.forEach((row) => table.appendChild(createRowElement(row)));

  element.innerHTML = '';
  element.appendChild(table);
  setupDeleteButtons();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  if (!username) {
    browser.runtime.sendMessage({ action: 'getUsername' }, (response) => {
      username = response;
      updateUsernameElement();
      if (username) {
        getProblemTable();
      }
    });
  }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.action === 'updateUsername') {
    username = message.data;
    updateUsernameElement();
  } else if (message.action === 'addTable') {
    handleGetProblemTableResponse()
  }
});
