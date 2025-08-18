import { CheckProblemResponse, SubmissionMessage, ProblemData } from './models';
import { getProblemFetchInterceptorScript } from './intercept-scripts';
import popupHTML from './static/popup.html';
import popupCSS from './static/popup.css';

import { getRepeatDate } from './utils';

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
  popupContainer.innerHTML = popupHTML;
  const intervalButtonsContainer =
    popupContainer.querySelector('#lre-anki-btns');

  if (intervalButtonsContainer) {
    [1, 3, 7, 14, 30].forEach((interval: number) => {
      const button = document.createElement('button');
      button.textContent = `${interval} Day${interval > 1 ? 's' : ''}`;
      intervalButtonsContainer.appendChild(button);
    });
    const button = document.createElement('button');
    button.textContent = 'NEVER';
    intervalButtonsContainer.appendChild(button);
  }

  return popupContainer;
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

function processSubmissionAccepted(data: SubmissionMessage): void {
  const messageId: string = data.submissionId;
  if (processedMessageIds.has(messageId)) {
    return;
  }

  processedMessageIds.add(messageId);
  processingSubmission = true;
  console.log('Submission Accepted!!! Message id:', messageId);

  const urlMatch: RegExpMatchArray | null =
    data.url.match(/problems\/([^\/]+)/);
  const linkMatch: RegExpMatchArray | null = data.url.match(
    /(https:\/\/leetcode\.com\/problems\/[^\/]+)/
  );

  if (urlMatch && linkMatch) {
    currentProblemData.titleSlug = urlMatch[1];
    currentProblemData.link = linkMatch[1];

    const style = document.createElement('style');
    const popupElement = createPopupElement();

    style.textContent = popupCSS;
    document.body.appendChild(style);
    document.body.appendChild(popupElement);

    setupButtonEventListeners(popupElement);
    processingSubmission = false;
  }
}

window.addEventListener('message', function (event: MessageEvent): void {
  const data = event.data as SubmissionMessage;

  if (data.type === 'submissionAccepted' && !processingSubmission) {
    processSubmissionAccepted(data);
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
