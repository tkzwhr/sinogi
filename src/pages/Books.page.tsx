import BooksContainer from '@/components/containers/Books.container';
import { ErrorPage } from '@/pages/Error.page';
import { fetchBookProblemSummaries, fetchBooks } from '@/services/api';
import { importSGF, refreshBooksEvent } from '@/services/event';
import FileAddOutlined from '@ant-design/icons/FileAddOutlined';
import { Empty, FloatButton, Spin } from 'antd';
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
  if (loading)
    return (
      <Spin size="large">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Spin>
    );

  return (
    <>
      {books.value!.items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <BooksContainer
          bookWithProblems={books.value!.items}
          bookProblemSummaries={bookProblemSummaries.value!.items}
        />
      )}
      <FloatButton
        icon={<FileAddOutlined />}
        type="primary"
        onClick={importSGF}
      />
    </>
  );
}
