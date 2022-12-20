import * as Mock from '@/services/mock';
import * as Store from '@/services/store';
import {
  Problem,
  BookProblemSummary,
  BookWithProblems,
  DateSummary,
  SolveSettings,
  SGFText,
} from '@/types';
import { tauriAvailable } from '@/utils/tauri';

export async function fetchBooks(): Promise<{ items: BookWithProblems[] }> {
  if (!tauriAvailable()) return Mock.delay({ items: Mock.bookWithProblems });

  const result = await Store.fetchBooks();
  return { items: result };
}

export async function fetchBookProblemSummaries(): Promise<{
  items: BookProblemSummary[];
}> {
  if (!tauriAvailable())
    return Mock.delay({ items: Mock.bookProblemSummaries });

  return Mock.delay({ items: Mock.bookProblemSummaries });
}

export async function fetchProblemSGF(
  id: Problem['problemId'],
): Promise<SGFText | undefined> {
  if (!tauriAvailable()) {
    if (!['1', '2', '3', '4', '5'].includes(id))
      return Promise.reject({ message: '問題が見つかりません' });

    return Mock.delay({ sgfText: Mock.sgfText });
  }

  return Store.fetchProblemSGF(id);
}

export async function fetchDateSummaries(): Promise<{
  items: DateSummary[];
}> {
  if (!tauriAvailable()) return Mock.delay({ items: Mock.dateSummaries });

  return Mock.delay({ items: Mock.dateSummaries });
}

export async function fetchTodaySummary(): Promise<DateSummary> {
  if (!tauriAvailable()) return Mock.delay({ ...Mock.dateSummaries[0] });

  return Mock.delay({ ...Mock.dateSummaries[0] });
}

export async function fetchSolveSettings(): Promise<SolveSettings> {
  if (!tauriAvailable()) return Mock.delay(Mock.solveSettings);

  const settings = await Store.fetchSolveSettings();

  return (
    settings ?? {
      scope: 'all',
      selectedBooks: [],
      quota: 0,
      allottedTime: 0,
    }
  );
}

export async function storeSolveSettings(
  solveSettings: SolveSettings,
): Promise<void> {
  if (!tauriAvailable()) {
    console.debug(solveSettings);
    return Promise.resolve();
  }

  return Store.saveSolveSettings(solveSettings);
}

export async function openProblemView(problemId: Problem['problemId']) {
  if (!tauriAvailable()) {
    window.open(`/problems/${problemId}`, 'problem', 'height=600,width=840');
  }
}
