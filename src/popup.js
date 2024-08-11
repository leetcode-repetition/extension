console.log("popup.js script loaded");

window.onload = (e) => {
    console.log("Window fully loaded");
};

// window.onload = (e) => {
//     console.log("DOM fully loaded and parsed");

//     const refreshButton = document.getElementById('refresh-btn');
//     const deleteButton = document.getElementById('delete-btn');

//     if (refreshButton) {
//         refreshButton.onclick = function() {
//             console.log("Refresh leetcode username pressed");
//             //send to REST API
//         };
//     } else {
//         console.log("Refresh button not found.");
//     }

//     if (deleteButton) {
//         deleteButton.onclick = function() {
//             console.log("Delete problem button pressed");
//             //send to REST API
//         };
//     } else {
//         console.log("Delete button not found.");
//     }

//     function getCookieValue(name) {
//         const cookies = document.cookie.split(';');
//         for (let cookie of cookies) {
//             cookie = cookie.trim();
//             if (cookie.includes(name)) {
//                 const value = cookie.split("=")[1];
//                 return value;
//             }
//         }
//         return null;
//     }

//     function setLeetCodeUsername() {
//         const username = getCookieValue('gr_last_sent_cs1');
//         console.log(`Fetched username from cookie: ${username}`);
//         const headerP = document.querySelector("#header p");
//         if (headerP) {
//             headerP.innerText = username ? username : "Login Needed!";
//             console.log(`Updated header text to: ${headerP.innerText}`);
//         } else {
//             console.log("Header <p> tag not found.");
//         }
//     }

//     setLeetCodeUsername();
// };