import {
  Book,
  BookProblemSummary,
  BookWithProblems,
  DateSummary,
  Problem,
  RawProblem,
  SGFText,
  SolveSettings,
} from '@/types';
import { format, parseISO } from 'date-fns';
import nestedGroupBy from 'nested-groupby';
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

export async function fetchBookProblemSummaries(): Promise<
  BookProblemSummary[]
> {
  const db = await connectDB();

  const result: any[] = await db.select(`
        SELECT p.book_id, gh.problem_id, gh.is_correct
        FROM game_histories gh
                 INNER JOIN problems p ON gh.problem_id = p.problem_id;
    `);

  const grouped: Record<number, Record<number, any[]>> = nestedGroupBy(result, [
    'book_id',
    'problem_id',
  ]);

  return Object.entries(grouped).map(([k1, v1]) => ({
    bookId: k1,
    problemSummaries: Object.entries(v1).map(([k2, v2]) => ({
      problemId: k2,
      numberOfAnswers: v2.length,
      numberOfCorrectAnswers: v2.reduce(
        (acc, v) => (acc + v.is_correct ? 1 : 0),
        0,
      ),
    })),
  }));
}

export async function fetchDateSummaries(): Promise<DateSummary[]> {
  const db = await connectDB();

  const result: any[] = await db.select(`
        SELECT gh.played_at, gh.is_correct
        FROM game_histories gh;
    `);

  const grouped: Record<string, any[]> = nestedGroupBy(result, ['played_at']);

  return Object.entries(grouped).map(([k, v]) => ({
    date: parseISO(k),
    numberOfAnswers: v.length,
    numberOfCorrectAnswers: v.reduce(
      (acc, v) => (acc + v.is_correct ? 1 : 0),
      0,
    ),
  }));
}

export async function fetchTodayDateSummary(): Promise<DateSummary> {
  const today = new Date();

  const db = await connectDB();

  const result: any[] = await db.select(
    `
            SELECT gh.is_correct
            FROM game_histories gh
            WHERE gh.played_at = $1;
        `,
    [format(today, 'yyyy-MM-dd')],
  );

  return {
    date: today,
    numberOfAnswers: result.length,
    numberOfCorrectAnswers: result.reduce(
      (acc, v) => (acc + v.is_correct ? 1 : 0),
      0,
    ),
  };
}

export async function fetchSolveSettings(): Promise<SolveSettings | null> {
  return await fetchFromKVS('SolveSettings');
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
                    sgf         = $4;
        `,
    [bookId, rawProblem.title, rawProblem.description, rawProblem.sgfText],
  );
}

export async function saveGameHistory(
  problemId: Problem['problemId'],
  isCorrect: boolean,
) {
  const db = await connectDB();

  await db.execute(
    `
            INSERT INTO game_histories (problem_id, is_correct)
            VALUES ($1, $2);
        `,
    [problemId, isCorrect ? 1 : 0],
  );
}

export async function saveSolveSettings(solveSettings: SolveSettings) {
  await storeToKVS('SolveSettings', solveSettings);
}

export async function deleteBook(bookId: Book['bookId']): Promise<void> {
  const db = await connectDB();

  const targetProblems: any[] = await db.select(
    `SELECT p.problem_id
         FROM problems p
         WHERE p.book_id = $1;`,
    [bookId],
  );

  if (targetProblems.length > 0) {
    /* Note: In current sqlx, cannot bind values to `IN` clause.
             Have no choice but to create query manually.
             cf. https://github.com/launchbadge/sqlx/blob/main/FAQ.md#how-can-i-do-a-select--where-foo-in--query
     */
    const targetProblemIdsString = targetProblems
      .map((tp) => tp.problem_id)
      .join(',');
    await db.execute(
      `
                DELETE
                FROM game_histories
                WHERE problem_id IN (${targetProblemIdsString});
            `,
    );
  }

  await db.execute(
    `
            DELETE
            FROM problems
            WHERE book_id = $1;
        `,
    [bookId],
  );

  await db.execute(
    `
            DELETE
            FROM books
            WHERE book_id = $1;
        `,
    [bookId],
  );
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
