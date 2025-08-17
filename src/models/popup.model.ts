interface ProblemData {
  titleSlug: string;
  link: string;
  lastCompletionDate: string;
  repeatDate: string;
}

export interface SubmissionMessage {
  type: string;
  data: {
    state: string;
    status_msg: string;
  };
  url: string;
  submissionId: string;
}

export interface CheckProblemResponse {
  problemCompletedInLastDay: boolean;
}
