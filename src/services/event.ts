import { extractProblems } from '@/services/sabaki';
import { storeBook, storeProblem } from '@/services/store';
import { tauriAvailable } from '@/utils/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Event, listen } from '@tauri-apps/api/event';
import { readTextFile } from '@tauri-apps/api/fs';
import { createEvent } from 'react-event-hook';

const NavigatePageEvent = createEvent('navigate_page');
export const navigatePageEvent = NavigatePageEvent<string>();

const UpdateProgressEvent = createEvent('update_progress');
export const updateProgressEvent = UpdateProgressEvent<number | null>();

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
    console.debug('Import SGF');
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

  const rawProblems = extractProblems(sgfText);
  if (rawProblems.length === 0) return;

  updateProgressEvent.emitUpdateProgress(0);

  const bookName = selectedFile.split(/([\\/])/g).pop()!;
  const bookId = await storeBook(bookName);

  for (const rp of rawProblems) {
    const index = rawProblems.indexOf(rp);

    await storeProblem(bookId, rp);

    updateProgressEvent.emitUpdateProgress((index / rawProblems.length) * 100);
  }

  updateProgressEvent.emitUpdateProgress(100);
  setTimeout(() => {
    updateProgressEvent.emitUpdateProgress(null);
  }, 1000);
}
