function setLeetCodeUsername() {
  const globalData = JSON.parse(localStorage.getItem('GLOBAL_DATA:value'));

  if (globalData && globalData.userStatus.username) {
    let username = globalData.userStatus.username;
    console.log('Setting username:', username);
    browser.storage.local.set({ username: username });
    return username;
  } else {
    console.log('GLOBAL_DATA not found in local storage');
    return null;
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.action === 'setUsername') {
    sendResponse(setLeetCodeUsername());
  }
});
