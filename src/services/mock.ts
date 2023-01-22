import {
  BookProblemSummary,
  BookWithProblems,
  DateSummary,
  SolveSettings,
} from '@/types';
import { subDays } from 'date-fns';

export const bookWithProblems: BookWithProblems[] = [
  {
    bookId: '1',
    name: 'ブック1',
    problems: [
      {
        problemId: '1',
        title: 'ブック1 問題1',
        description: '黒先白死',
      },
      {
        problemId: '2',
        title: 'ブック1 問題2',
        description: '黒先白活',
      },
    ],
  },
  {
    bookId: '2',
    name: 'ブック2',
    problems: [
      {
        problemId: '3',
        title: 'ブック2 問題1',
        description: '黒先セキ活',
      },
      {
        problemId: '4',
        title: 'ブック2 問題2',
        description: '黒先コウ',
      },
      {
        problemId: '5',
        title: 'ブック2 問題3',
        description: '黒先コウ',
      },
    ],
  },
];

export const bookProblemSummaries: BookProblemSummary[] = [
  {
    bookId: '1',
    problemSummaries: [
      {
        problemId: '1',
        numberOfAnswers: 1,
        numberOfCorrectAnswers: 0,
      },
      {
        problemId: '2',
        numberOfAnswers: 1,
        numberOfCorrectAnswers: 1,
      },
    ],
  },
  {
    bookId: '2',
    problemSummaries: [
      {
        problemId: '3',
        numberOfAnswers: 2,
        numberOfCorrectAnswers: 0,
      },
      {
        problemId: '4',
        numberOfAnswers: 2,
        numberOfCorrectAnswers: 1,
      },
      {
        problemId: '5',
        numberOfAnswers: 2,
        numberOfCorrectAnswers: 2,
      },
    ],
  },
];

export const dateSummaries: DateSummary[] = (() => {
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
  return data.map(([numberOfCorrectAnswers, numberOfAnswers], i) => ({
    date: subDays(new Date(), Math.floor(Math.sqrt(i * i * i))),
    numberOfAnswers,
    numberOfCorrectAnswers,
  }));
})();

export const sgfText =
  '(;GM[1]FF[4]CA[UTF-8]SZ[19]GN[かんたんな詰碁１]GC[黒先白死]C[10級]' +
  'AB[er][es][gr][hr][hs][gq][ep][fp][dp]' +
  'AW[br][dr][cq][cp][ds][do][eo][fo][gp][hp][hq][ir][is]' +
  '(;W[fs]TE[1];B[fr];W[eq]LB[dq:a]TR[fs][gs]C[白はaに入れないため△の1眼しかない。])' +
  '(;W[eq];W[fq]LB[dq:A][fs:B]C[AとBが見合い。]))';

export const solveSettings: SolveSettings = {
  scope: 'all',
  selectedBooks: ['2'],
  quota: 20,
  allottedTime: 5,
};

export function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, 300);
  });
}
