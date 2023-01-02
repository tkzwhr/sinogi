import BooksContainer from '@/components/containers/Books.container';
import PageFoundationContainer from '@/components/containers/PageFoundation.container';
import { ErrorPage } from '@/pages/Error.page';
import { fetchBookProblemSummaries, fetchBooks } from '@/services/api';
import { refreshBooksEvent } from '@/services/event';
import { ProgressCircle } from '@adobe/react-spectrum';
import { useEffect } from 'react';
import { useAsyncFn } from 'react-use';

export default function BooksPage() {
  const [books, invokeFetchBooks] = useAsyncFn(fetchBooks, [], {
    loading: true,
  });

  const [bookProblemSummaries, invokeFetchBookProblemSummaries] = useAsyncFn(
    fetchBookProblemSummaries,
    [],
    { loading: true },
  );

  useEffect(() => {
    invokeFetchBooks().then();
    invokeFetchBookProblemSummaries().then();
  }, []);

  refreshBooksEvent.useRefreshBooksListener(() => {
    invokeFetchBooks().then();
    invokeFetchBookProblemSummaries().then();
  });

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
