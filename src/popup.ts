import { SubmissionAcceptedMessage, ProblemData } from './models';
import { getProblemFetchInterceptorScript } from './intercept-scripts';
import popupHTML from './static/popup.html';
import popupCSS from './static/popup.css';
import { getRepeatDate } from './utils';

class LeetCodeRepetitionPopupManager {
  private currentProblemData: ProblemData = {
    titleSlug: '',
    link: '',
    lastCompletionDate: '',
    repeatDate: '',
  };
  private processingSubmission: boolean = false;
  private processedMessageIds: Set<string> = new Set<string>();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    window.addEventListener(
      'message',
      (event: MessageEvent<SubmissionAcceptedMessage>): void => {
        const data: SubmissionAcceptedMessage = event.data;
        if (data.type === 'submissionAccepted' && !this.processingSubmission) {
          this.processSubmissionAccepted(data);
        }
      }
    );

    document.addEventListener('DOMContentLoaded', (): void => {
      this.injectProblemFetchInterceptor();
    });
  }

  private createPopupElement(): HTMLDivElement {
    const popupContainer: HTMLDivElement = document.createElement('div');
    popupContainer.innerHTML = popupHTML;
    const intervalButtonsContainer: HTMLElement | null =
      popupContainer.querySelector('#lre-anki-btns');

    if (intervalButtonsContainer) {
      [1, 3, 7, 14, 30].forEach((interval: number): void => {
        const button: HTMLButtonElement = document.createElement('button');
        button.textContent = `${interval} Day${interval > 1 ? 's' : ''}`;
        intervalButtonsContainer.appendChild(button);
      });
      const button: HTMLButtonElement = document.createElement('button');
      button.textContent = 'NEVER';
      intervalButtonsContainer.appendChild(button);
    }

    return popupContainer;
  }

  private setupButtonEventListeners(container: HTMLElement): void {
    container
      .querySelectorAll<HTMLButtonElement>('#lre-anki-btns button')
      .forEach((button: HTMLButtonElement): void => {
        button.addEventListener(
          'click',
          (): void => {
            const overlay: HTMLElement | null =
              document.getElementById('lre-overlay');
            if (overlay) {
              overlay.remove();
            }
            this.handleButtonClick(button);
          },
          { once: true }
        );
      });
  }

  private handleButtonClick(button: HTMLButtonElement): void {
    console.log(`Button clicked: ${button.innerText}`);
    if (button.innerText === 'NEVER') {
      browser.runtime.sendMessage({
        action: 'deleteRow',
        titleSlug: this.currentProblemData.titleSlug,
      });
      return;
    }

    const lastCompletionDate: string = new Date()
      .toLocaleString()
      .split(',')[0];
    this.currentProblemData.lastCompletionDate = lastCompletionDate;
    this.currentProblemData.repeatDate = getRepeatDate(
      lastCompletionDate,
      button.innerText.split(' ')[0]
    );

    browser.runtime.sendMessage({
      action: 'problemCompleted',
      data: this.currentProblemData,
    });
  }

  private processSubmissionAccepted(data: SubmissionAcceptedMessage): void {
    const messageId: string = data.submissionId;
    if (this.processedMessageIds.has(messageId)) {
      return;
    }

    this.processedMessageIds.add(messageId);
    this.processingSubmission = true;
    console.log('Submission Accepted!!! Message id:', messageId);

    const urlMatch: RegExpMatchArray | null =
      data.url.match(/problems\/([^\/]+)/);
    const linkMatch: RegExpMatchArray | null = data.url.match(
      /(https:\/\/leetcode\.com\/problems\/[^\/]+)/
    );

    if (urlMatch && linkMatch) {
      this.currentProblemData.titleSlug = urlMatch[1];
      this.currentProblemData.link = linkMatch[1];

      const style: HTMLStyleElement = document.createElement('style');
      const popupElement: HTMLDivElement = this.createPopupElement();

      style.textContent = popupCSS;
      document.body.appendChild(style);
      document.body.appendChild(popupElement);

      this.setupButtonEventListeners(popupElement);
      this.processingSubmission = false;
    }
  }

  private injectProblemFetchInterceptor(): void {
    if (window.__leetcodeRepetitionInjected) {
      return;
    }
    window.__leetcodeRepetitionInjected = true;

    const script: HTMLScriptElement = document.createElement('script');
    script.textContent = getProblemFetchInterceptorScript();
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }
}

new LeetCodeRepetitionPopupManager();
