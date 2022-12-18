import { Book, BookWithProblems, Problem, RawProblem, SGFText } from '@/types';
import Database from 'tauri-plugin-sql-api';

export async function fetchBooks(): Promise<BookWithProblems[]> {
  const db = await connect();

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
  const db = await connect();

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
  const db = await connect();

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
  const db = await connect();

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

async function connect(): Promise<Database> {
  return Database.load('sqlite:sinogi.db');
}
