// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     console.log("Received message:", message);
//     if (message.action === 'setUsername') {
//         console.log("Setting username:", message.data);
//         browser.storage.local.set({ lreUsername: message.data });
//     } else if (message.action === 'getUsername') {
//         console.log("Sending username:", username);
//         sendResponse({ action: 'returnUsername', type: 'USERNAME', data: username });
//     }
// });


