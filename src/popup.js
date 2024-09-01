const ANKI_INTERVALS = [1, 3, 7, 14, 30];

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

const applyStyles = () => {
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
      console.log(`Repeat problem in: ${button.innerText}`);
      document.getElementById('lre-overlay').style.display = 'none';
    });
  });
};

const getSubmissionNumberFromURL = () => {
  const match = window.location.href.match(/\/submissions\/(\d+)\//);
  return match ? match[1] : null;
};

const checkForAcceptedMessage = () => {
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

let lastProcessedSubmissionNumber = null;
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      checkForAcceptedMessage();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
console.log("Checking for acceptance...");
