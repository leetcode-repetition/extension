function setLeetCodeUsername() {
  const globalData = JSON.parse(localStorage.getItem('GLOBAL_DATA:value'));
  console.log(`Fetched globalData: ${globalData}`);

  if (globalData) {
    const username = globalData.userStatus.username;
    browser.runtime.sendMessage({
      action: 'initializeUser',
      data: username,
    });
  } else {
    console.log('GLOBAL_DATA not found in local storage');
  }
}

setLeetCodeUsername();