export type Book = {
  bookId: string;
  name: string;
};

export type BookProblem = {
  problemId: string;
  title: string;
  desc: string;
};

export type BookWithProblems = Book & {
  problems: BookProblem[];
};

type Summary = {
  numberOfAnswers: number;
  numberOfCorrectAnswers: number;
};

export type ProblemSummary = Summary & {
  problemId: string;
};

export type BookProblemSummary = {
  bookId: Book['bookId'];
  problemSummaries: ProblemSummary[];
};

export type DateSummary = Summary & {
  date: Date;
};

export type SolveSettings = {
  scope: 'all' | 'selectedBooks';
  selectedBooks: Book['bookId'][];
  quota: number;
  allottedTime: number;
};
