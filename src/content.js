function getCookieValue(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.includes(name)) {
            const value = cookie.split("=")[1];
            return value;
        }
    }
    return null;
}

function setLeetCodeUsername() {
    const username = getCookieValue('gr_last_sent_cs1');
    console.log(`Fetched username from cookie: ${username}`);
    browser.runtime.sendMessage({ action: 'setUsername', type: 'USERNAME', data: username });
}

setLeetCodeUsername();