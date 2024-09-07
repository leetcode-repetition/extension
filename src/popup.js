const ANKI_INTERVALS = [1, 3, 7, 14, 30];
let lastProcessedSubmissionNumber = null;

const createPopupHTML = () => `
  <div id="lre-overlay">
    <div id="lre-popup">
      <p>Great Job! When would you like to repeat this problem?</p><br>
      <div id="lre-anki-btns">
        ${ANKI_INTERVALS.map(interval => `<button>${interval} Day${interval > 1 ? 's' : ''}</button>`).join('')}
        <button>NEVER</button>
      </div>
    </div>
  </div>
`;

const getProblemURL = () => {
  const match = window.location.href.match(/(https:\/\/leetcode\.com\/problems\/[^/]+)/);
  return match ? `${match[1]}/description` : null;
};

const getProblemNameFromURL = () => {
  const match = window.location.href.match(/problems\/([^/]+)/);
  return match ? match[1] : null;
};

const getSubmissionNumberFromURL = () => {
  const match = window.location.href.match(/\/submissions\/(\d+)\//);
  return match ? match[1] : null;
};

function handleButtonClick(button) {
  console.log(`Button clicked: ${button.innerText}`);
  browser.storage.local.get('LRE_USERNAME').then((result) => {
    browser.runtime.sendMessage({ action: 'completeProblem', data: {
      username: result.LRE_USERNAME,
      problemLink: getProblemURL(),
      problemName: getProblemNameFromURL(),
      repeatIn: button.innerText,
      time: new Date().getTime()
    }});
  });
}


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
    `
  };

  Object.entries(styles).forEach(([id, style]) => {
    document.getElementById(id).style.cssText = style;
  });

  document.querySelectorAll('#lre-anki-btns button').forEach(button => {
    button.style.cssText = `
      height: 30px; 
      width: 80px;
      border: 2px solid #000;
      border-radius: 10px;
      background-color: #23222b;
    `;
    button.addEventListener('mouseover', () => button.style.backgroundColor = '#ff8c00');
    button.addEventListener('mouseout', () => button.style.backgroundColor = '#23222b');
    button.addEventListener('click', () => {
      document.getElementById('lre-overlay').style.display = 'none';
      handleButtonClick(button);
    });
  });
};

function checkForAcceptedMessage () {
  const currentSubmissionNumber = getSubmissionNumberFromURL();
  if (!currentSubmissionNumber || currentSubmissionNumber === lastProcessedSubmissionNumber) return;

  const resultElement = document.querySelector('span[data-e2e-locator="submission-result"]');
  if (resultElement && resultElement.textContent.includes('Accepted')) {
    lastProcessedSubmissionNumber = currentSubmissionNumber;
    console.log('Submission Accepted!', lastProcessedSubmissionNumber);

    const popupContainer = document.createElement('div');
    popupContainer.innerHTML = createPopupHTML();
    document.body.appendChild(popupContainer);
    applyStyles();
  }
};

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      checkForAcceptedMessage();
    }
  });
});
observer.observe(document.body, { childList: true, subtree: true });
console.log("Checking for acceptance...");

// change how i check for submission