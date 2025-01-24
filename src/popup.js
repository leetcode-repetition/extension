let currentProblemData = {};
let processingSubmission = false;
const processedMessageIds = new Set();

const createPopupHTML = () => `
  <div id="lre-overlay">
    <div id="lre-popup">
      <p>Great Job! When would you like to repeat this problem?</p><br>
      <div id="lre-anki-btns">
        ${[1, 3, 7, 14, 30].map((interval) => `<button>${interval} Day${interval > 1 ? 's' : ''}</button>`).join('')}
        <button>NEVER</button>
      </div>
    </div>
  </div>
`;

function applyStyles() {
  const styles = {
    'lre-overlay': `
      position: fixed; 
      inset: 0; 
      background: rgba(0, 0, 0, 0.6);
      display: flex; 
      justify-content: center; 
      align-items: center;
      z-index: 9998;
    `,
    'lre-popup': `
      z-index: 9999;
      background: #1c1c1c; 
      padding: 20px; 
      border: 2px solid #000;
      border-radius: 10px; 
      width: 600px; 
      text-align: center; 
      color: white;
    `,
    'lre-anki-btns': `
      display: flex;
      justify-content: center;
      gap: 20px;
    `,
  };

  Object.entries(styles).forEach(([id, style]) => {
    document.getElementById(id).style.cssText = style;
  });

  document.querySelectorAll('#lre-anki-btns button').forEach((button) => {
    button.style.cssText = `
      height: 30px; 
      width: 80px;
      border: 2px solid #000;
      border-radius: 10px;
      background-color: #23222b;
    `;
    button.addEventListener(
      'mouseover',
      () => (button.style.backgroundColor = '#ff8c00')
    );
    button.addEventListener(
      'mouseout',
      () => (button.style.backgroundColor = '#23222b')
    );
    button.addEventListener(
      'click',
      () => {
        document.getElementById('lre-overlay').remove();
        handleButtonClick(button);
      },
      { once: true }
    );
  });
}

function getRepeatDate(dateString, daysLater) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + parseInt(daysLater, 10));
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
}

function handleButtonClick(button) {
  console.log(`Button clicked: ${button.innerText}`);
  if (button.innerText === 'NEVER') {
    browser.runtime.sendMessage({
      action: 'deleteRow',
      titleSlug: currentProblemData.titleSlug,
    });
    return;
  }

  const lastCompletionDate = new Date().toLocaleString().split(',')[0];
  currentProblemData.lastCompletionDate = lastCompletionDate;
  currentProblemData.repeatDate = getRepeatDate(
    lastCompletionDate,
    button.innerText.split(' ')[0]
  );

  browser.runtime.sendMessage({
    action: 'problemCompleted',
    data: currentProblemData,
  });
}

(function () {
  if (window.__leetcodeRepetitionInjected) {
    return;
  }
  window.__leetcodeRepetitionInjected = true;

  const script = document.createElement('script');
  script.textContent = `
    (${function () {
      if (window.__leetcodeFetchIntercepted) {
        return;
      }
      window.__leetcodeFetchIntercepted = true;

      const originalFetch = window.fetch;
      const processedSubmissions = new Set();

      function interceptFetch(url, init) {
        const submissionMatch = url.match(
          /\/submissions\/detail\/(\d+)\/check\//
        );
        if (submissionMatch) {
          const submissionId = submissionMatch[1];

          if (processedSubmissions.has(submissionId)) {
            return originalFetch(url, init);
          }

          console.log('Fetching original request: ', submissionMatch);
          return originalFetch(url, init).then(async (response) => {
            const clonedResponse = response.clone();
            const responseData = await clonedResponse.json();

            if (
              responseData.state === 'SUCCESS' &&
              responseData.status_msg === 'Accepted'
            ) {
              console.log('Processing successful submission');
              processedSubmissions.add(submissionId);
              window.postMessage(
                {
                  type: 'submissionAccepted',
                  data: responseData,
                  url: window.location.href,
                  submissionId: submissionId,
                },
                '*'
              );
            }
            return response;
          });
        }
        return originalFetch(url, init);
      }

      window.fetch = interceptFetch;
    }})();
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();

window.addEventListener('message', function (event) {
  if (event.data.type === 'submissionAccepted' && !processingSubmission) {
    const messageId = event.data.submissionId;
    if (processedMessageIds.has(messageId)) {
      return;
    }
    processedMessageIds.add(messageId);
    processingSubmission = true;

    console.log('Submission Accepted!!! Message id: ', messageId);

    currentProblemData.titleSlug =
      event.data.url.match(/problems\/([^\/]+)/)[1];
    currentProblemData.link = event.data.url.match(
      /(https:\/\/leetcode\.com\/problems\/[^\/]+)/
    )[1];

    if (browser && browser.runtime && browser.runtime.id) {
      browser.runtime
        .sendMessage({
          action: 'checkIfProblemCompletedInLastDay',
          titleSlug: currentProblemData.titleSlug,
        })
        .then((response) => {
          console.log('Recieved checkIfProblemCompletedInLastDay response.');
          if (!response.isCompleted) {
            console.log('Problem is newly completed!!!');
            const popupContainer = document.createElement('div');
            popupContainer.innerHTML = createPopupHTML();
            document.body.appendChild(popupContainer);
            applyStyles();
          }
          processingSubmission = false;
        })
        .catch(() => {
          processingSubmission = false;
        });
    } else {
      console.log('ERROR: Unable to make necessary connection...');
      processingSubmission = false;
    }
  }
});
