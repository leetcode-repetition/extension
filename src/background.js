let username = null;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'USERNAME') {
        username = message.variable;
    }
});

browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'extension') {
        port.postMessage({ type: 'USERNAME', variable: username });
    }
});