let user = null;

class User {
  constructor(username) {
    this.username = username;
    this.sessionId = this.generateSessionId();
    this.completedProblems = [];
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
  constructor(link, title, titleSlug, lastCompletion, repeatIn) {
    this.link = link;
    this.title = title;
    this.titleSlug = titleSlug;
    this.difficulty = difficulty;
    this.lastCompletion = lastCompletion;
    this.repeatIn = repeatIn;
  }
}

async function sendToAPI(endpoint, method, requestData) {
  //change this to the actual endpoint in the future
  let url = `http://localhost:8080/${endpoint}`;
  fetchOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (requestData) {
    fetchOptions.body = JSON.stringify(requestData);
  }

  fetch(url, fetchOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((responseData) => {
      console.log('Success:', responseData);
      return responseData;
    })
    .catch((error) => {
      console.error('Error:', error);
      throw error;
    });
}

function updateUserCompletedProblems(problem) {
  console.log("Updating user's completed problems");
  const completedLeetCodeProblem = new LeetCodeProblem(
    problem.link,
    problem.title,
    problem.titleSlug,
    problem.difficulty,
    problem.lastCompletion,
    problem.repeatIn
  );
  console.log('Problem Data:', completedLeetCodeProblem);
  user.completedProblems.push(completedLeetCodeProblem);
  sendToAPI(`update-row?${user.username}`, 'POST', completedLeetCodeProblem);
}

function initializeUser(username) {
  if (!user && username) {
    user = new User(username);
    console.log('User initialized:', user);
    // sendToAPI(`updateSessionId`, 'POST', {}); //this is where we will send the session id to the backend
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.action === 'initializeUser') {
    initializeUser(message.data);
  } else if (message.action === 'problemCompleted') {
    updateUserCompletedProblems(message.data);
  } else if (message.action === 'getUsername') {
    sendResponse(user.username);
  } else if (message.action === 'sendToAPI') {
    sendToAPI(message.data.endpoint, message.data.method, message.data.data)
      .then((result) => {
        sendResponse({ status: 'success', data: result });
      })
      .catch((error) => {
        sendResponse({ status: 'error', message: error.message });
      });
    return true;
  }
});

browser.webNavigation.onCompleted.addListener(initializeUser, {
  url: [{ hostContains: 'leetcode.com' }],
});
