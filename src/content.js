function setLeetCodeUsername() {
  const globalData = JSON.parse(localStorage.getItem("GLOBAL_DATA:value"));
  console.log(`Fetched globalData: ${globalData}`);

  if (globalData) {
    const username = globalData.userStatus.username;
    console.log("Setting LRE_USERNAME to:", username);
    browser.storage.local.set({ LRE_USERNAME: username });
  } else {
    console.log("GLOBAL_DATA not found in local storage");
  }
}

setLeetCodeUsername();
