import {
  BookProblem,
  BookProblemSummary,
  BookWithProblems,
  DateSummary,
} from '@/types';
import { subDays } from 'date-fns';

export async function fetchBooks(): Promise<{ items: BookWithProblems[] }> {
  return Promise.resolve({
    items: [
      {
        bookId: 'book1',
        name: 'ブック1',
        problems: [
          {
            problemId: 'book1_problem1',
            title: 'ブック1 問題1',
            desc: '黒先白死',
          },
          {
            problemId: 'book1_problem2',
            title: 'ブック1 問題2',
            desc: '黒先白活',
          },
        ],
      },
      {
        bookId: 'book2',
        name: 'ブック2',
        problems: [
          {
            problemId: 'book2_problem1',
            title: 'ブック2 問題1',
            desc: '黒先セキ活',
          },
          {
            problemId: 'book2_problem2',
            title: 'ブック2 問題2',
            desc: '黒先コウ',
          },
          {
            problemId: 'book2_problem3',
            title: 'ブック2 問題3',
            desc: '黒先コウ',
          },
        ],
      },
    ],
  });
}

export async function fetchBookProblemSummaries(): Promise<{
  items: BookProblemSummary[];
}> {
  return Promise.resolve({
    items: [
      {
        bookId: 'book1',
        problemSummaries: [
          {
            problemId: 'book1_problem1',
            numberOfAnswers: 1,
            numberOfCorrectAnswers: 0,
          },
          {
            problemId: 'book1_problem2',
            numberOfAnswers: 1,
            numberOfCorrectAnswers: 1,
          },
        ],
      },
      {
        bookId: 'book2',
        problemSummaries: [
          {
            problemId: 'book2_problem1',
            numberOfAnswers: 2,
            numberOfCorrectAnswers: 0,
          },
          {
            problemId: 'book2_problem2',
            numberOfAnswers: 2,
            numberOfCorrectAnswers: 1,
          },
          {
            problemId: 'book2_problem3',
            numberOfAnswers: 2,
            numberOfCorrectAnswers: 2,
          },
        ],
      },
    ],
  });
}

export async function fetchDateSummaries(): Promise<{
  items: DateSummary[];
}> {
  const data = [
    [2, 2],
    [3, 3],
    [5, 5],
    [7, 8],
    [11, 13],
    [13, 21],
    [17, 34],
    [19, 55],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6],
    [1, 7],
    [1, 8],
  ];
  return Promise.resolve({
    items: data.map(([numberOfCorrectAnswers, numberOfAnswers], i) => ({
      date: subDays(new Date(), Math.floor(Math.sqrt(i * i * i))),
      numberOfAnswers,
      numberOfCorrectAnswers,
    })),
  });
}

export async function openProblemView(problemId: BookProblem['problemId']) {
  window.open(`/problems/${problemId}`, 'problem', 'height=600,width=840');
}
