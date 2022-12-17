import { fetchBookProblemSummaries, fetchBooks } from '@/api';
import BooksContainer from '@/components/containers/Books.container';
import PageFoundationContainer from '@/components/containers/PageFoundation.container';
import { ErrorPage } from '@/pages/Error.page';
import { ProgressCircle } from '@adobe/react-spectrum';
import { useAsync } from 'react-use';

export default function BooksPage() {
  const books = useAsync(fetchBooks);

  const bookProblemSummaries = useAsync(fetchBookProblemSummaries);

  if (books.error) return <ErrorPage message={books.error.message} />;

  if (bookProblemSummaries.error)
    return <ErrorPage message={bookProblemSummaries.error.message} />;

  const loading = books.loading || bookProblemSummaries.loading;

  return (
    <PageFoundationContainer>
      <h2>問題管理</h2>
      {loading ? (
        <ProgressCircle aria-label="読み込み中..." size="L" isIndeterminate />
      ) : (
        <BooksContainer
          bookWithProblems={books.value!.items}
          bookProblemSummaries={bookProblemSummaries.value!.items}
        />
      )}
    </PageFoundationContainer>
  );
}
