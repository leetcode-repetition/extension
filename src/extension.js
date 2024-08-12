// const refreshButton = document.getElementById('refresh-btn');
// const deleteButton = document.getElementById('delete-btn');

// if (refreshButton) {
//     refreshButton.onclick = function() {
//         console.log("Refresh leetcode username pressed");
//         //send to REST API
//     };
// } else {
//     console.log("Refresh button not found.");
// }

// if (deleteButton) {
//     deleteButton.onclick = function() {
//         console.log("Delete problem button pressed");
//         //send to REST API
//     };
// } else {
//     console.log("Delete button not found.");
// }


document.addEventListener('DOMContentLoaded', () => {
    const port = browser.runtime.connect({ name: 'extension' });

    port.onMessage.addListener((message) => {
        if (message.type === 'USERNAME' && message.variable) {
            document.getElementById('username').textContent = message.variable;
        }
    });
});

// function setLeetCodeUsername() {
//     const username = getCookieValue('gr_last_sent_cs1');
//     console.log(`Fetched username from cookie: ${username}`);
//     console.log(`Hello: ${username !== ""}`);
//     console.log(`hola: ${username}`);
//     // const usernameTag = document.getElementById('username');

//     // Send the variable to the popup
//     browser.runtime.sendMessage({ variable: username });
//     // Listen for messages in the popup context
//     console.log("sent message");
//     // popup.js
//     document.addEventListener('DOMContentLoaded', () => {
//         // Listen for messages in the popup context
//         browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//             if (message.variable) {
//                 document.getElementById('username').textContent = message.variable;
//             }
//         });
//     });

//     // usernameTag.innerText = "Login1243";
//     // usernameTag.innerHTML = username !== "" ? username : "Login Needed4564!";
// }



// window.onload = (e) => {
// setLeetCodeUsername();
// };

// if (window.location.href.includes("https://leetcode.com/*")) {
//     const variableFromWebpage = document.querySelector('selector-for-variable').textContent;

//     // Send the variable to the popup
//     chrome.runtime.sendMessage({ variable: variableFromWebpage });
// }

// // Listen for messages in the popup context
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.variable) {
//         // Update the <p> tag in the popup
//         document.querySelector('p').textContent = message.variable;
//     }
// });