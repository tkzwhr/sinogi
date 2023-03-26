import { extractGames } from '@/helpers/go-game.helper';
import { storeBook, storeProblem } from '@/services/store';
import { tauriAvailable } from '@/utils/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Event, listen } from '@tauri-apps/api/event';
import { readTextFile } from '@tauri-apps/api/fs';
import { createEvent } from 'react-event-hook';

export const navigatePageEvent = createEvent('navigate_page')<string>();
export const updateProgressEvent = createEvent('update_progress')<
  number | null
>();
export const refreshBooksEvent = createEvent('refresh_books')();

export async function listenBackendEvents() {
  if (!tauriAvailable()) return;

  const navigatePage = listen('page', (event: Event<string>) =>
    navigatePageEvent.emitNavigatePage(event.payload),
  );
  const importBook = listen('import_book', importSGF);

  return Promise.all([navigatePage, importBook]);
}

export async function importSGF() {
  if (!tauriAvailable()) {
    await progress(async (increment) => {
      for (let i = 0; i < 40; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        increment();
      }
    }, 40);
    return;
  }

  const selectedFile = (await open({
    filters: [
      {
        name: 'SGFファイル',
        extensions: ['sgf'],
      },
    ],
  })) as string | undefined;
  if (!selectedFile) return;

  const sgfText = await readTextFile(selectedFile);

  const rawProblems = extractGames(sgfText);
  if (rawProblems.length === 0) return;

  const bookName = selectedFile.split(/([\\/])/g).pop()!;
  const bookId = await storeBook(bookName);

  await progress(async (increment) => {
    for (const rp of rawProblems) {
      await storeProblem(bookId, rp);
      increment();
    }
  }, rawProblems.length);
}

async function progress(exec: (increment: () => void) => void, total: number) {
  // initialize

  updateProgressEvent.emitUpdateProgress(0);

  // progress

  let count = 0;

  await exec(() => {
    count += 1;
    updateProgressEvent.emitUpdateProgress((count / total) * 100);
  });

  // finalize

  updateProgressEvent.emitUpdateProgress(100);
  setTimeout(() => {
    updateProgressEvent.emitUpdateProgress(null);
    refreshBooksEvent.emitRefreshBooks();
  }, 1000);
}
