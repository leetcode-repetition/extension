let username = null;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    if (message.action === 'setUsername') {
        console.log("Setting username:", message.data);
        username = message.data;
    } else if (message.action === 'getUsername') {
        console.log("Sending username:", username);
        sendResponse({ action: 'sendUsername', type: 'USERNAME', data: username });
    }
});


