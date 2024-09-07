const ANKI_INTERVALS = [1, 3, 7, 14, 30];
let currentProblemData = null;

const createPopupHTML = () => `
  <div id="lre-overlay">
    <div id="lre-popup">
      <p>Great Job! When would you like to repeat this problem?</p><br>
      <div id="lre-anki-btns">
        ${ANKI_INTERVALS.map((interval) => `<button>${interval} Day${interval > 1 ? 's' : ''}</button>`).join('')}
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
    button.addEventListener('click', () => {
      document.getElementById('lre-overlay').remove();
      handleButtonClick(button);
    });
  });
}

function handleButtonClick(button) {
  console.log(`Button clicked: ${button.innerText}`);
  currentProblemData['repeatIn'] = button.innerText;
  browser.runtime.sendMessage({
    action: 'popupButtonClicked',
    data: currentProblemData,
  });
}

(function () {
  const script = document.createElement('script');

  script.textContent = `
    (${function () {
      const originalFetch = window.fetch;
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;

      function interceptFetch(url, init) {
        if (url.match(/\/submissions\/detail\/\d+\/check\//)) {
          console.log('Fetch intercepted:', url);

          return originalFetch(url, init).then(async (response) => {
            const clonedResponse = response.clone();
            const responseData = await clonedResponse.json();
            if (
              responseData.state === 'SUCCESS' &&
              responseData.status_msg === 'Accepted'
            ) {
              console.log('Submission accepted:', responseData);
              const popupContainer = document.createElement('div');
              popupContainer.innerHTML = createPopupHTML();
              document.body.appendChild(popupContainer);
              applyStyles();
            }
            return response;
          });
        }
        return originalFetch(url, init);
      }

      function interceptXHROpen() {
        this._url = arguments[1];
        return originalXHROpen.apply(this, arguments);
      }

      function interceptXHRSend() {
        if (this._url.includes('/graphql/') && arguments[0]) {
          const requestBody = JSON.parse(arguments[0]);
          if (requestBody.operationName === 'questionTitle') {
            this.addEventListener('load', function () {
              const reader = new FileReader();
              reader.onloadend = function () {
                const questionData = JSON.parse(reader.result).data.question;
                currentProblemData = {
                  title: questionData.title,
                  titleSlug: questionData.titleSlug,
                  difficulty: questionData.difficulty,
                  time: new Date().getTime(),
                };
                console.log('Problem Data:', currentProblemData);
              };
              reader.readAsText(this.response);
            });
          }
        }
        return originalXHRSend.apply(this, arguments);
      }

      window.fetch = interceptFetch;
      XMLHttpRequest.prototype.open = interceptXHROpen;
      XMLHttpRequest.prototype.send = interceptXHRSend;
    }})();
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      checkForAcceptedMessage();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
console.log('Checking for acceptance...');
