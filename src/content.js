async function getLeetCodeUsernameAndUserId() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const csrftoken = cookies['csrftoken'];
  const LEETCODE_SESSION = cookies['LEETCODE_SESSION'];

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrftoken': csrftoken,
        cookie: `csrftoken=${csrftoken}; LEETCODE_SESSION=${LEETCODE_SESSION}`,
      },
      body: JSON.stringify({
        query: `
          query {
            userStatus {
              userId
              username
            }
          }
        `,
      }),
    });

    const data = await response.json();
    return data.data.userStatus;
  } catch (error) {
    console.log(`Error getting user info from leetcode! ERROR: ${error}`);
    return {
      userId: '',
      username: '',
    };
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action === 'getUsernameAndUserId') {
    (async () => {
      sendResponse(await getLeetCodeUsernameAndUserId());
    })();
  }

  return true;
});
