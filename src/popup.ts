interface ProblemData {
  titleSlug: string;
  link: string;
  lastCompletionDate: string;
  repeatDate: string;
}

interface SubmissionMessage {
  type: string;
  data: {
    state: string;
    status_msg: string;
  };
  url: string;
  submissionId: string;
}

interface CheckProblemResponse {
  problemCompletedInLastDay: boolean;
}

let currentProblemData: ProblemData = {
  titleSlug: '',
  link: '',
  lastCompletionDate: '',
  repeatDate: '',
};
let processingSubmission: boolean = false;
const processedMessageIds: Set<string> = new Set();

const createPopupHTML = (): string => `
  <div id="lre-overlay">
    <div id="lre-popup">
      <p>Great Job! When would you like to repeat this problem?</p><br>
      <div id="lre-anki-btns">
        ${[1, 3, 7, 14, 30].map((interval: number) => `<button>${interval} Day${interval > 1 ? 's' : ''}</button>`).join('')}
        <button>NEVER</button>
      </div>
    </div>
  </div>
`;

function applyStyles(): void {
  const styles: Record<string, string> = {
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

  Object.entries(styles).forEach(([id, style]: [string, string]): void => {
    const element = document.getElementById(id);
    if (element) {
      element.style.cssText = style;
    }
  });

  document
    .querySelectorAll('#lre-anki-btns button')
    .forEach((button: Element): void => {
      const buttonElement = button as HTMLButtonElement;
      buttonElement.style.cssText = `
      height: 30px; 
      width: 80px;
      border: 2px solid #000;
      border-radius: 10px;
      background-color: #23222b;
    `;
      buttonElement.addEventListener('mouseover', (): void => {
        buttonElement.style.backgroundColor = '#ff8c00';
      });
      buttonElement.addEventListener('mouseout', (): void => {
        buttonElement.style.backgroundColor = '#23222b';
      });
      buttonElement.addEventListener(
        'click',
        (): void => {
          const overlay = document.getElementById('lre-overlay');
          if (overlay) {
            overlay.remove();
          }
          handleButtonClick(buttonElement);
        },
        { once: true }
      );
    });
}

function getRepeatDate(dateString: string, daysLater: string): string {
  const date: Date = new Date(dateString);
  date.setDate(date.getDate() + parseInt(daysLater, 10));
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString()}`;
}

function handleButtonClick(button: HTMLButtonElement): void {
  console.log(`Button clicked: ${button.innerText}`);
  if (button.innerText === 'NEVER') {
    browser.runtime.sendMessage({
      action: 'deleteRow',
      titleSlug: currentProblemData.titleSlug,
    });
    return;
  }

  const lastCompletionDate: string = new Date().toLocaleString().split(',')[0];
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

(function (): void {
  if ((window as any).__leetcodeRepetitionInjected) {
    return;
  }
  (window as any).__leetcodeRepetitionInjected = true;

  const script: HTMLScriptElement = document.createElement('script');
  script.textContent = `
    (function() {
      if (window.__leetcodeFetchIntercepted) {
        return;
      }
      window.__leetcodeFetchIntercepted = true;

      const originalFetch = window.fetch;
      const processedSubmissions = new Set();

      // Create a function with native JS that works with the browser's fetch API
      function interceptFetch(input, init) {
        // Get the URL string regardless of input type
        let url = "";
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof Request) {
          url = input.url;
        } else {
          url = String(input);
        }
        
        const submissionMatch = url.match(/\\/submissions\\/detail\\/(\\d+)\\/check\\//);
        if (submissionMatch) {
          const submissionId = submissionMatch[1];

          if (processedSubmissions.has(submissionId)) {
            return originalFetch(input, init);
          }

          console.log('Fetching original request: ', submissionMatch);
          return originalFetch(input, init).then(function(response) {
            const clonedResponse = response.clone();
            return clonedResponse.json().then(function(responseData) {
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
          });
        }
        return originalFetch(input, init);
      }

      window.fetch = interceptFetch;
    })();
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();

window.addEventListener('message', function (event: MessageEvent): void {
  const data = event.data as SubmissionMessage;

  if (data.type === 'submissionAccepted' && !processingSubmission) {
    const messageId: string = data.submissionId;
    if (processedMessageIds.has(messageId)) {
      return;
    }
    processedMessageIds.add(messageId);
    processingSubmission = true;

    console.log('Submission Accepted!!! Message id: ', messageId);

    const urlMatch: RegExpMatchArray | null =
      data.url.match(/problems\/([^\/]+)/);
    const linkMatch: RegExpMatchArray | null = data.url.match(
      /(https:\/\/leetcode\.com\/problems\/[^\/]+)/
    );

    if (urlMatch && linkMatch) {
      currentProblemData.titleSlug = urlMatch[1];
      currentProblemData.link = linkMatch[1];

      if (browser && browser.runtime && browser.runtime.id) {
        browser.runtime
          .sendMessage({
            action: 'checkIfProblemCompletedInLastDay',
            titleSlug: currentProblemData.titleSlug,
          })
          .then((response: CheckProblemResponse): void => {
            console.log('Received checkIfProblemCompletedInLastDay response.');
            if (!response.problemCompletedInLastDay) {
              console.log('Problem is newly completed!!!');
              const popupContainer: HTMLDivElement =
                document.createElement('div');
              popupContainer.innerHTML = createPopupHTML();
              document.body.appendChild(popupContainer);
              applyStyles();
            }
            processingSubmission = false;
          })
          .catch((): void => {
            processingSubmission = false;
          });
      } else {
        console.log('ERROR: Unable to make necessary connection...');
        processingSubmission = false;
      }
    } else {
      console.log('ERROR: Unable to extract problem information from URL');
      processingSubmission = false;
    }
  }
});
