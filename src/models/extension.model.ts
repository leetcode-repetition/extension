interface Message {
  action: string;
  [key: string]: any;
}

export interface DisableButtonsMessage extends Message {
  action: 'disableButtons';
  disableButtons: boolean;
}

export interface CreateTableMessage extends Message {
  action: 'createTable';
  username: string;
  problems: ProblemData[];
  disableButtons: boolean;
  timeSinceApiKeyCreation: number;
}

export interface SetUsernameMessage extends Message {
  action: 'setUsername';
  username: string;
}

export interface CancelCountdownMessage extends Message {
  action: 'cancelCountdown';
}

interface ProblemData {
  titleSlug: string;
  link: string;
  lastCompletionDate: string;
  repeatDate: string;
}

interface CurrentUser {
  username: string;
  userId: string;
  apiKey: string;
  apiKeyCreationTime: number;
  completedProblems: Record<string, ProblemData>;
}

export interface DeleteResponse {
  success: boolean;
}
