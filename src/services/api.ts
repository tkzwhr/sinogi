import * as Mock from '@/services/mock';
import * as Store from '@/services/store';
import {
  BookProblemSummary,
  BookWithProblems,
  DateSummary,
  Problem,
  SGFText,
  SolveSettings,
} from '@/types';
import { tauriAvailable } from '@/utils/tauri';
import { invoke } from '@tauri-apps/api/tauri';

export async function fetchBooks(): Promise<{ items: BookWithProblems[] }> {
  if (!tauriAvailable()) return Mock.delay({ items: Mock.bookWithProblems });

  const items = await Store.fetchBooks();
  return { items };
}

export async function fetchBookProblemSummaries(): Promise<{
  items: BookProblemSummary[];
}> {
  if (!tauriAvailable())
    return Mock.delay({ items: Mock.bookProblemSummaries });

  const items = await Store.fetchBookProblemSummaries();
  return { items };
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

  const items = await Store.fetchDateSummaries();
  return { items };
}

export async function fetchTodaySummary(): Promise<DateSummary> {
  if (!tauriAvailable()) return Mock.delay({ ...Mock.dateSummaries[0] });

  return await Store.fetchTodayDateSummary();
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

export async function storeGameHistory(
  problemId: Problem['problemId'],
  isCorrect: boolean,
) {
  if (!tauriAvailable()) {
    console.debug(problemId, isCorrect);
    return Promise.resolve();
  }

  return Store.saveGameHistory(problemId, isCorrect);
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

export async function openProblemView(
  problemId: Problem['problemId'],
  title?: string | undefined,
) {
  if (!tauriAvailable()) {
    window.open(`/problems/${problemId}`, 'problem', 'height=600,width=840');
    return;
  }

  await invoke('open_problem_view', { problemId, title: title ?? problemId });
}
