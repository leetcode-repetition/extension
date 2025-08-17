function problemFetchInterceptor(): void {
  if ((window as any).__leetcodeFetchIntercepted) {
    return;
  }
  (window as any).__leetcodeFetchIntercepted = true;

  const originalFetch: typeof fetch = window.fetch;
  const processedSubmissions: Set<string> = new Set<string>();

  function interceptFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let url: string = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }

    const submissionMatch: RegExpMatchArray | null = url.match(
      /\/submissions\/detail\/(\d+)\/check\//
    );
    if (submissionMatch) {
      const submissionId: string = submissionMatch[1];

      if (processedSubmissions.has(submissionId)) {
        return originalFetch(input, init);
      }

      console.log('Fetching original request: ', submissionMatch);
      return originalFetch(input, init).then(function (
        response: Response
      ): Promise<Response> {
        const clonedResponse: Response = response.clone();
        return clonedResponse.json().then(function (responseData: {
          state: string;
          status_msg: string;
          [key: string]: any;
        }): Response {
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
              } as {
                type: string;
                data: { state: string; status_msg: string; [key: string]: any };
                url: string;
                submissionId: string;
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

  window.fetch = interceptFetch as typeof window.fetch;
}

export function getProblemFetchInterceptorScript(): string {
  const scriptString: string = problemFetchInterceptor
    .toString()
    .replace('function problemFetchInterceptor()', 'function()');

  return `(${scriptString})();`;
}
