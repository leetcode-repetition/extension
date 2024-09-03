function sendToAPI(endpoint, method, data) {
    let url = `http://localhost:8080/${endpoint}`;
    fetchOptions = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
    };
    if (method !== 'GET') {
        fetchOptions.body = JSON.stringify(data);
    }

    fetch(url, fetchOptions)
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    if (message.action === 'completeProblem') {
        console.log("Updating database with completed problem for user:", message.data.username);
        sendToAPI(`insert-row?${message.data.username}`, 'POST', message.data);
    }
});


