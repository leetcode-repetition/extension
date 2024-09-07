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
  constructor(problemLink, problemName, repeatIn, time) {
    this.problemLink = problemLink;
    this.problemName = problemName;
    this.repeatIn = repeatIn;
    this.time = time;
  }
}

function sendToAPI(endpoint, method, data) {
  //change this to the actual endpoint in the future
  let url = `http://localhost:8080/${endpoint}`;
  fetchOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (method !== 'GET') {
    fetchOptions.body = JSON.stringify(data);
  }

  fetch(url, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function updateUserCompletedProblems(problem) {
  currentLeetCodeProblem = new LeetCodeProblem(
    problem.problemLink,
    problem.problemName,
    problem.repeatIn,
    problem.time
  );
  console.log('Problem Data:', currentLeetCodeProblem);
  user.completedProblems.push(currentLeetCodeProblem);
  sendToAPI(`update-row?${user.username}`, 'POST', currentLeetCodeProblem);
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
  } else if (message.action === 'popupButtonClicked') {
    updateUserCompletedProblems(message.data);
  } else if (message.action === 'getUsername') {
    sendResponse(user.username);
  }
});

browser.webNavigation.onCompleted.addListener(initializeUser, {
  url: [{ hostContains: 'leetcode.com' }],
});
