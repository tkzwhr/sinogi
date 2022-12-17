import {
  BookProblem,
  BookProblemSummary,
  BookWithProblems,
  DateSummary,
  SolveSettings,
} from '@/types';
import { subDays } from 'date-fns';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, 300);
  });
}

export async function fetchBooks(): Promise<{ items: BookWithProblems[] }> {
  return delay({
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
  return delay({
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

export async function fetchBookProblemSGF(
  id: BookProblem['problemId'],
): Promise<string> {
  if (id !== 'book1_problem1')
    return Promise.reject({ message: '問題が見つかりません' });
  const sgfText =
    '(;GM[1]FF[4]CA[UTF-8]SZ[19]GN[かんたんな詰碁１]GC[黒先白死]AB[br][dr][cq][cp][ds][do][eo][fo][gp][hp][hq][ir][is]AW[er][es][gr][hr][hs][gq][ep][fp][dp]C[10級](;B[fs]TE[1];W[fr];B[eq]LB[dq:a]TR[fs][gs]C[白はaに入れないため△の1眼しかない。])(;B[eq];W[fq]LB[dq:A][fs:B]C[AとBが見合い。]))';
  return delay(sgfText);
}

export async function fetchTodaySummary(): Promise<DateSummary> {
  return Promise.resolve({
    date: new Date(),
    numberOfAnswers: 2,
    numberOfCorrectAnswers: 2,
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
  return delay({
    items: data.map(([numberOfCorrectAnswers, numberOfAnswers], i) => ({
      date: subDays(new Date(), Math.floor(Math.sqrt(i * i * i))),
      numberOfAnswers,
      numberOfCorrectAnswers,
    })),
  });
}

export async function fetchSolveSettings(): Promise<SolveSettings> {
  return delay({
    scope: 'all',
    selectedBooks: ['book2'],
    quota: 20,
    allottedTime: 5,
  });
}

export async function storeSolveSettings(
  solveSettings: SolveSettings,
): Promise<void> {
  console.debug(solveSettings);
  return Promise.resolve();
}

export async function openProblemView(problemId: BookProblem['problemId']) {
  window.open(`/problems/${problemId}`, 'problem', 'height=600,width=840');
}
