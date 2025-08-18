import { CheckProblemResponse, SubmissionMessage, ProblemData } from './models';
import { getProblemFetchInterceptorScript } from './intercept-scripts';
import popupHTML from './static/popup.html';
import popupCSS from './static/popup.css';

let currentProblemData: ProblemData = {
  titleSlug: '',
  link: '',
  lastCompletionDate: '',
  repeatDate: '',
};
let processingSubmission: boolean = false;
const processedMessageIds: Set<string> = new Set();

function createPopupElement(): HTMLDivElement {
  const popupContainer = document.createElement('div');

  // Use imported HTML content directly
  console.log('Using imported HTML content');
  popupContainer.innerHTML = popupHTML;

  // Add buttons to #interval-buttons
  console.log('Looking for interval-buttons container');
  const intervalButtonsContainer =
    popupContainer.querySelector('#interval-buttons');

  if (intervalButtonsContainer) {
    console.log('Found interval-buttons container, adding buttons');
    [1, 3, 7, 14, 30].forEach((interval: number) => {
      const button = document.createElement('button');
      button.textContent = `${interval} Day${interval > 1 ? 's' : ''}`;
      intervalButtonsContainer.appendChild(button);
    });
  } else {
    console.error('No #interval-buttons container found in HTML');
  }

  return popupContainer;
}

function injectCSS(): void {
  if (document.querySelector('#leetcode-repetition-styles')) {
    return;
  }

  // Create a style element with imported CSS content
  const style = document.createElement('style');
  style.id = 'leetcode-repetition-styles';
  style.textContent = popupCSS;
  document.head.appendChild(style);
  console.log('CSS injected from imported content');
}

function setupButtonEventListeners(container: HTMLElement): void {
  container
    .querySelectorAll('#lre-anki-btns button')
    .forEach((button: Element): void => {
      const buttonElement = button as HTMLButtonElement;
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
          .then(async (response: unknown): Promise<void> => {
            const typedResponse = response as CheckProblemResponse;
            console.log('Received checkIfProblemCompletedInLastDay response.');

            if (!typedResponse.problemCompletedInLastDay) {
              console.log('Problem is newly completed!!!');

              // Inject CSS only if needed
              injectCSS();

              // Create and add the popup
              const popupContainer = createPopupElement();
              console.log(
                'Popup container created, appending to document body'
              );

              // Make sure we're getting the overlay element
              const overlay = popupContainer.querySelector('#lre-overlay');
              if (overlay) {
                console.log('Found #lre-overlay, appending directly');
                document.body.appendChild(overlay);
              } else {
                console.log('No #lre-overlay found, appending container');
                document.body.appendChild(popupContainer);
              }

              console.log(
                'Popup added to DOM, visible:',
                !!document.querySelector('#lre-overlay')
              );

              // Setup event listeners on the element that's actually in the DOM
              const eventTarget = (document.querySelector('#lre-overlay') ||
                popupContainer) as HTMLElement;
              console.log(
                'Setting up event listeners on:',
                eventTarget.id || 'container'
              );
              setupButtonEventListeners(eventTarget);
            }
            processingSubmission = false;
          })
          .catch((error: Error): void => {
            console.error('Error checking problem completion:', error);
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

function injectProblemFetchInterceptor(): void {
  if ((window as any).__leetcodeRepetitionInjected) {
    return;
  }
  (window as any).__leetcodeRepetitionInjected = true;

  const script: HTMLScriptElement = document.createElement('script');
  script.textContent = getProblemFetchInterceptorScript();
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

document.addEventListener('DOMContentLoaded', () => {
  injectProblemFetchInterceptor();
});
