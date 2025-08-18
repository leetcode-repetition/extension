interface ProblemData {
  titleSlug: string;
  link: string;
  lastCompletionDate: string;
  repeatDate: string;
}

export interface SubmissionAcceptedMessage {
  type: string;
  data: {
    state: string;
    status_msg: string;
  };
  url: string;
  submissionId: string;
}

export interface LeetCodeSubmissionResponse {
  // fields we need
  state: string;
  status_msg: string;

  // common fields
  status_code: number;
  lang: string;
  run_success: boolean;
  status_runtime: string;
  memory: number;
  display_runtime: string;
  question_id: string;
  elapsed_time: number;
  compare_result: string;
  code_output: string;
  std_output: string;
  last_testcase: string;
  expected_output: string;
  task_finish_time: number;
  task_name: string;
  finished: boolean;
  total_correct: number;
  total_testcases: number;
  runtime_percentile: number;
  status_memory: string;
  memory_percentile: number;
  pretty_lang: string;
  submission_id: string;
}
