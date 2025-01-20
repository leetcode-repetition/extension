export class User {
  constructor(username, completedProblems = new Map()) {
    this.username = username;
    this.completedProblems =
      completedProblems instanceof Map
        ? completedProblems
        : new Map(
            completedProblems.map(({ key, problem }) => [
              key,
              new LeetCodeProblem(
                problem.link,
                problem.titleSlug,
                new Date(problem.repeatDate),
                new Date(problem.lastCompletionDate)
              ),
            ])
          );
  }
}

export class LeetCodeProblem {
  constructor(link, titleSlug, repeatDate, lastCompletionDate) {
    this.link = link;
    this.titleSlug = titleSlug;
    this.repeatDate = repeatDate;
    this.lastCompletionDate = lastCompletionDate;
  }
}

export function convertUserToUserMap(user) {
  return {
    username: user.username,
    completedProblems: Array.from(user.completedProblems.entries()).map(
      ([key, problem]) => ({
        key,
        problem: {
          link: problem.link,
          titleSlug: problem.titleSlug,
          repeatDate: problem.repeatDate.toISOString(),
          lastCompletionDate: problem.lastCompletionDate.toISOString(),
        },
      })
    ),
  };
}
