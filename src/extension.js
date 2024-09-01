function handleButtonClick(action) {
    console.log(`${action} button pressed`);
    // TODO: Send to REST API
}

function setupButton(id, action) {
    const button = document.getElementById(id);
    if (button) {
        button.onclick = () => handleButtonClick(action);
    } else {
        console.log(`${action} button not found.`);
    }
}

function updateUsernameElement(username) {
    if (username) {
        document.getElementById('username').textContent = username;
    } else {
        document.getElementById('username').textContent = 'Login Needed!';
    }
}

function requestUsername() {
    browser.runtime.sendMessage({ action: "getUsername" }, (response) => {
        if (response && response.action === 'sendUsername') {
            updateUsernameElement(response.data);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    requestUsername();
    setupButton('refresh-btn', 'Refresh leetcode username');
    setupButton('delete-btn', 'Delete problem');
});
