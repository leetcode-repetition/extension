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
    console.log(`Hello: ${username !== ""}`);
    console.log(`hola: ${username}`);

    // Send the variable to the background script
    browser.runtime.sendMessage({ type: 'USERNAME', variable: username });
}


setLeetCodeUsername();