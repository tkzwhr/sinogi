export type Book = {
  bookId: string;
  name: string;
};

export type Problem = {
  problemId: string;
  title: string;
  description?: string;
};

export type SGFText = {
  sgfText: string;
};

export type RawProblem = Omit<Problem, 'problemId'> & SGFText;

export type BookWithProblems = Book & {
  problems: Problem[];
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
