const popupHTML = `
<div id="lre-overlay">
    <div id="lre-popup">
        <p>Great Job! When would you like to repeat this problem?</p><br>
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
{/* <button id="lre-close-btn">&times;</button> */}
{/* <div id="lre-custom">
    <input type="number" min="1" max="100" oninput="validateInput(this)">
    <button>Enter</button>
</div>
<script>
    function validateInput(input) {
        if (input.value < 1) input.value = 1;
        if (input.value > 100) input.value = 100;
    }
</script> */}

function addStyling() {
    document.getElementById('lre-overlay').style.cssText = `
        position: fixed; 
        inset: 0; 
        background: rgba(0, 0, 0, 0.6);
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 9998;
    `;
    document.getElementById('lre-popup').style.cssText = `
        z-index: 9999;
        background: #1c1c1c; 
        padding: 20px; 
        border: 2px solid #000;
        border-radius: 10px; 
        width: 600px; 
        text-align: center; 
        color: white;
    `;
    // const closeButton = document.getElementById('lre-close-btn');
    // closeButton.style.cssText = `
    //     float: right; 
    //     font-size: 30px; 
    //     cursor: pointer;
    //     padding: 0;
    //     margin: 0;
    // `;
    // closeButton.addEventListener('mouseover', () => {
    //     closeButton.style.color = 'red';
    // });
    // closeButton.addEventListener('mouseout', () => {
    //     closeButton.style.color = '';
    // });
    // closeButton.addEventListener('click', function() {
    //     document.getElementById('lre-overlay').style.display = 'none';
    // });
    document.getElementById('lre-anki-btns').style.cssText = `
        display: flex;
        justify-content: center;
        gap: 20px;
    `;
    // document.getElementById('lre-custom').style.cssText = `
    //     display: flex;
    //     justify-content: center;
    //     gap: 4px;
    // `;
    const buttons = document.querySelectorAll('#lre-anki-btns button');
    buttons.forEach(button => {
        button.style.cssText = `
            height: 30px; 
            width: 80px;
            border: 2px solid #000;
            border-radius: 10px;
            background-color: #23222b;
        `;
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#ff8c00';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#23222b';
        });
        button.addEventListener('click', () => {
            console.log(`Repeat problem in:  ${button.innerText}`);
            document.getElementById('lre-overlay').style.display = 'none';
        });
    });
}


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