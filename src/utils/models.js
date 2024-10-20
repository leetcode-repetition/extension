export class User {
  constructor(username) {
    this.username = username;
    this.completedProblems = new Map();
  }
}

export class LeetCodeProblem {
  constructor(link, titleSlug, difficulty, repeatDate, lastCompletionDate) {
    this.link = link;
    this.titleSlug = titleSlug;
    this.difficulty = difficulty;
    this.repeatDate = repeatDate;
    this.lastCompletionDate = lastCompletionDate;
  }
}
