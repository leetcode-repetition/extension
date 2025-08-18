export interface CurrentUser {
  username: string;
  userId: string;
  apiKey: string;
  apiKeyCreationTime: number;
  completedProblems: Record<string, ProblemData>;
}

export interface ProblemData {
  link: string;
  titleSlug: string;
  repeatDate: string;
  lastCompletionDate: string;
}

export interface APIResponse {
  [key: string]: any;
}

export interface MessageResponse {
  username: string;
  userId: string;
  success: boolean;
}

export interface GetUserInfoResponse {
  username: string | null;
  completedProblems: ProblemData[];
  disableButtons: boolean;
  apiKeyCreationTime: number;
}

export interface LoginResult {
  apiKey: string | null;
  username: string | null;
  userId: string | null;
  apiKeyCreationTime: number;
}

export interface Message {
  action: string;
  [key: string]: any;
}
