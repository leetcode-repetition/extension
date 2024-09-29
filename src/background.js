let user = null;

class User {
  constructor(username) {
    this.username = username;
    this.sessionId = this.generateSessionId();
    this.completedProblems = new Map();
  }

  generateSessionId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

class LeetCodeProblem {
  constructor(link, titleSlug, difficulty, repeatDate, lastCompletionDate) {
    this.link = link;
    this.titleSlug = titleSlug;
    this.difficulty = difficulty;
    this.repeatDate = repeatDate;
    this.lastCompletionDate = lastCompletionDate;
  }
}

function sendToAPI(endpoint, method, requestData) {
  let url = `http://localhost:8080/${endpoint}`;
  let fetchOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (requestData) {
    fetchOptions.body = JSON.stringify(requestData);
  }

  return fetch(url, fetchOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((responseData) => {
      console.log('Success:', responseData);
      return responseData;
    });
}
function updateUserCompletedProblems(problem) {
  const completedProblem = new LeetCodeProblem(
    problem.link,
    problem.titleSlug,
    problem.difficulty,
    problem.repeatDate,
    problem.lastCompletionDate,
  );
  console.log('Problem Data:', completedProblem);
  console.log('User:', user.username);

  sendToAPI(`insert-row?username=${user.username}`, 'POST', completedProblem)
    .then((response) => {
      console.log('Success:', response);
      user.completedProblems.set(completedProblem.titleSlug, completedProblem);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function initializeUser(username) {
  if (!user && username) {
    user = new User(username);
    console.log('User initialized:', user);
    // sendToAPI(`updateSessionId`, 'POST', {});
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.action === 'initializeUser') {
    initializeUser(message.data);
  } else if (message.action === 'problemCompleted') {
    console.log('Problem completed:', message.data);
    updateUserCompletedProblems(message.data);
  } else if (message.action === 'getUsername') {
    sendResponse(user.username);
  } else if (message.action === 'sendToAPI') {
    console.log('Sending to API:', message);
    sendToAPI(message.data.endpoint, message.data.method, message.data.data)
      .then(result => {
        console.log('API response:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('API error:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

browser.webNavigation.onCompleted.addListener(initializeUser, {
  url: [{ hostContains: 'leetcode.com' }],
});
