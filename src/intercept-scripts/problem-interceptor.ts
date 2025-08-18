import {
  LeetCodeSubmissionResponse,
  SubmissionAcceptedMessage,
} from '../models';

function problemFetchInterceptor(): void {
  if (window.__leetcodeFetchIntercepted) {
    return;
  }
  window.__leetcodeFetchIntercepted = true;

  const originalFetch: typeof fetch = window.fetch;
  const processedSubmissions: Set<string> = new Set<string>();

  function getUrlFromInput(input: RequestInfo | URL): string {
    return typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : String(input);
  }

  async function interceptFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = getUrlFromInput(input);
    const submissionMatch = url.match(/\/submissions\/detail\/(\d+)\/check\//);

    if (!submissionMatch) {
      return originalFetch(input, init);
    }

    const submissionId = submissionMatch[1];
    if (processedSubmissions.has(submissionId)) {
      return originalFetch(input, init);
    }

    console.log('Intercepting submission request:', submissionId);

    try {
      const response = await originalFetch(input, init);
      const clonedResponse = response.clone();

      try {
        const responseData =
          (await clonedResponse.json()) as LeetCodeSubmissionResponse;

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
            } as SubmissionAcceptedMessage,
            '*'
          );
        }
      } catch (error) {
        console.error('Error processing response:', error);
      }
      return response;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  }

  window.fetch = interceptFetch as typeof window.fetch;
}

export function getProblemFetchInterceptorScript(): string {
  const scriptString = problemFetchInterceptor
    .toString()
    .replace('function problemFetchInterceptor()', 'function()');

  return `(${scriptString})();`;
}
