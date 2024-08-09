const popupHTML = `
<div id="lre-overlay">
    <div id="lre-popup">
        <button id="lre-close-btn">&times;</button>
        <p>Great Job! You completed .problem name. difficulty.</p>
        <p>When would you like to repeat this problem?</p>
        <div id="lre-anki-btns">
            <button>1 Day</button>
            <button>3 Days</button>
            <button>7 Days</button>
            <button>14 Days</button>
            <button>NEVER</button>
        </div>
    </div>
</div>
`;

function addStyling() {
    document.getElementById('lre-overlay').style.cssText = `
        position: fixed; 
        inset: 0; 
        background: rgba(0, 0, 0, 0.4); 
        display: flex; 
        justify-content: center; 
        align-items: center;
    `;
    document.getElementById('lre-popup').style.cssText = `
        background: black; 
        padding: 10px; 
        border-radius: 5px; 
        width: 600px; 
        text-align: center; 
        color: white;
    `;
    document.getElementById('lre-close-btn').style.cssText = `
        float: right; 
        font-size: 30px; 
        cursor: pointer;
    `;
    document.getElementById('lre-anki-btns').style.cssText = `
        display: flex;
        justify-content: center;
        gap: 20px;
    `;
    const buttons = document.querySelectorAll('#lre-anki-btns button');
    buttons.forEach(button => {
        button.style.cssText = `
            height: 30px; 
            width: 80px;
        `;
    });
}


document.body.style.border = "5px solid blue";
let lastProcessedSubmissionNumber = null;

function getSubmissionNumberFromURL() {
    const urlPattern = /\/submissions\/(\d+)\//;
    const match = window.location.href.match(urlPattern);
    return match ? match[1] : null;
}

function checkForAcceptedMessage() {
    const currentSubmissionNumber = getSubmissionNumberFromURL();

    if (!currentSubmissionNumber || currentSubmissionNumber === lastProcessedSubmissionNumber) return;

    const resultElement = document.querySelector('span[data-e2e-locator="submission-result"]');
    if (resultElement && resultElement.textContent.includes('Accepted')) {
        lastProcessedSubmissionNumber = currentSubmissionNumber;
        console.log('Submission Accepted!');
        console.log(lastProcessedSubmissionNumber);

        //remove the popup container once the input is accepted.
        const popupContainer = document.createElement('div');
        popupContainer.innerHTML = popupHTML;
        document.body.appendChild(popupContainer);
        addStyling();

        document.getElementById('lre-close-btn').addEventListener('click', function() {
            document.getElementById('lre-overlay').style.display = 'none';
        });
    }
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            checkForAcceptedMessage();
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });
console.log("Checking for acceptance...")