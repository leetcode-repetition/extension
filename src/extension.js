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

    link.href = row.problemLink;
    link.textContent = row.problemName;
    difficulty.textContent = row.difficulty;
    repeatOn.textContent = row.repeatOn;
    lastSubmission.textContent = row.lastSubmission;
    numCompletions.textContent = row.numCompletions;

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
    buttons.forEach(button => {
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
    fetch(`http://localhost:8080/${endpoint}`, {
        method: method, // 'POST', 'GET', 'PUT', 'DELETE', etc.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
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
        }
    };
    sendToAPI('delete-row', 'DELETE', data, dataRow);
}

function handleDeleteRowResponse(element) {
    element.remove();
}

function getProblemTable() {
    const table = document.getElementById('problem-table');
    const data = {
        username: username,
    };
    sendToAPI('get-table', 'GET', data, table);
}

function handleGetProblemTableResponse(data, element) {
    for (let row of data["table"]) {
        element.appendChild(createRowElement(row));
    }
    setupDeleteButtons();
}

browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'LRE_USERNAME' in changes) {
        username = changes.LRE_USERNAME.newValue;
        updateUsernameElement(username);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    browser.storage.local.get('LRE_USERNAME').then((result) => {
        console.log('LRE_USERNAME FOUND:', result.LRE_USERNAME);
        username = result.LRE_USERNAME;
        updateUsernameElement();
        // if (username) {
        //     getProblemTable();
        // }
    });
});

