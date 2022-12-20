import {
  Book,
  BookWithProblems,
  Problem,
  RawProblem,
  SGFText,
  SolveSettings,
} from '@/types';
import Database from 'tauri-plugin-sql-api';
import { Store } from 'tauri-plugin-sql-store';

export async function fetchBooks(): Promise<BookWithProblems[]> {
  const db = await connectDB();

  const result: any[] = await db.select(`
        SELECT b.book_id, b.name, p.problem_id, p.title, p.description
        FROM books b
                 INNER JOIN problems p ON b.book_id = p.book_id;
    `);

  const books: Record<string, BookWithProblems> = {};
  for (const r of result) {
    const bookId = r['book_id'].toString();
    if (bookId in books) {
      books[bookId].problems.push({
        problemId: r['problem_id'].toString(),
        title: r['title'],
        description: r['description'],
      });
    } else {
      books[bookId] = {
        bookId,
        name: r['name'],
        problems: [
          {
            problemId: r['problem_id'].toString(),
            title: r['title'],
            description: r['description'],
          },
        ],
      };
    }
  }

  return Object.values(books);
}

export async function fetchProblemSGF(
  problemId: Problem['problemId'],
): Promise<SGFText | undefined> {
  const db = await connectDB();

  const result: any[] = await db.select(
    `
            SELECT sgf
            FROM problems p
            WHERE p.problem_id = $1;
        `,
    [problemId],
  );

  if (result.length === 0) return undefined;

  return {
    sgfText: result[0]['sgf'],
  };
}

export async function storeBook(bookName: Book['name']): Promise<string> {
  const db = await connectDB();

  const result = await db.execute(
    `
            INSERT INTO books (name)
            VALUES ($1)
            ON CONFLICT (name) DO NOTHING;
        `,
    [bookName],
  );

  if (result.rowsAffected === 1) {
    return result.lastInsertId.toString();
  }

  const fetchedResult: any[] = await db.select(
    `
            SELECT book_id
            FROM books
            WHERE name = $1;
        `,
    [bookName],
  );

  return fetchedResult[0]['book_id'].toString();
}

export async function storeProblem(
  bookId: Book['bookId'],
  rawProblem: RawProblem,
) {
  const db = await connectDB();

  await db.execute(
    `
            INSERT INTO problems (book_id, title, description, sgf)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (book_id, title) DO UPDATE
                SET description = $3,
                    sgf = $4;
        `,
    [bookId, rawProblem.title, rawProblem.description, rawProblem.sgfText],
  );
}

export async function fetchSolveSettings(): Promise<SolveSettings | null> {
  return await fetchFromKVS('SolveSettings');
}

export async function saveSolveSettings(solveSettings: SolveSettings) {
  await storeToKVS('SolveSettings', solveSettings);
}

async function connectDB(): Promise<Database> {
  return Database.load('sqlite:sinogi.db');
}

async function fetchFromKVS<T>(key: string): Promise<T | null> {
  const kvs = new Store('sinogi.conf');

  try {
    await kvs.load();
  } catch (e: any) {
    // create a file if not exists
    await kvs.save();
  }

  return kvs.get(key);
}

async function storeToKVS(key: string, value: unknown): Promise<void> {
  const kvs = new Store('sinogi.conf');

  await kvs.set(key, value);

  await kvs.save();
}
