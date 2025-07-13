declare namespace browser {
  namespace runtime {
    function sendMessage(message: any): Promise<any>;
    const onMessage: {
      addListener: (
        callback: (
          message: any,
          sender: any,
          sendResponse: any
        ) => boolean | void | Promise<any>
      ) => void;
    };
    function connect(connectInfo?: { name: string }): Port;
    const onConnect: {
      addListener: (callback: (port: Port) => void) => void;
    };

    interface Port {
      name: string;
      onMessage: {
        addListener: (callback: (message: any) => void) => void;
      };
      onDisconnect: {
        addListener: (callback: () => void) => void;
      };
      postMessage: (message: any) => void;
      disconnect: () => void;
    }

    const id: string;
  }

  namespace identity {
    function launchWebAuthFlow(details: {
      url: string;
      interactive: boolean;
    }): Promise<string>;

    function getRedirectURL(): string;
  }

  namespace storage {
    const local: {
      get: (keys: string | string[] | object | null) => Promise<any>;
      set: (items: object) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  }

  namespace tabs {
    function query(queryInfo: object): Promise<any[]>;
    function sendMessage(tabId: number, message: any): Promise<any>;
  }

  namespace cookies {
    function get(details: { url: string; name: string }): Promise<{
      name: string;
      value: string;
      domain: string;
      hostOnly: boolean;
      path: string;
      secure: boolean;
      httpOnly: boolean;
      sameSite: string;
      session: boolean;
      expirationDate?: number;
    } | null>;
  }
}
