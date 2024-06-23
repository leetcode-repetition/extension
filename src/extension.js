document.body.style.border = "5px solid blue";
let lastProcessedSubmissionNumber = null;

function getSubmissionNumberFromURL() {
    const urlPattern = /\/submissions\/(\d+)\//;
    const match = window.location.href.match(urlPattern);
    return match ? match[1] : null;
}

function checkForAcceptedMessage() {
    const currentSubmissionNumber = getSubmissionNumberFromURL();

    if (currentSubmissionNumber === lastProcessedSubmissionNumber) return;

    const resultElement = document.querySelector('span[data-e2e-locator="submission-result"]');
    if (resultElement && resultElement.textContent.includes('Accepted')) {
        lastProcessedSubmissionNumber = currentSubmissionNumber;
        console.log('Submission Accepted!');
        console.log(lastProcessedSubmissionNumber);
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