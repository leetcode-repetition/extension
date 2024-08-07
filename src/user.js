window.leetcodeUsername = window.leetcodeUsername || null;

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


if (!window.leetcodeUsername) {
    window.leetcodeUsername = getCookieValue('gr_last_sent');
    console.log(`Value of gr_last_sent cookie: ${window.globalUsername}`);
}