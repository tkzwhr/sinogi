import PageContainer from '@/components/PageContainer';
import { Flex, ActionGroup, Item } from '@adobe/react-spectrum';
import BookList from '@/components/book-list/BookList';
import BookProblems from '@/components/book-problems/BookProblems';
import { useState } from 'react';
import { Book } from '@/types';
import { fetchBooks, fetchBookProblemSummaries, openProblemView } from '@/api';
import { useAsync } from 'react-use';
import { ErrorPage } from '@/pages/ErrorPage';

export default function BooksPage() {
  const [selectedBook, setSelectedBook] = useState<
    Book['bookId'] | undefined
  >();

  const books = useAsync(fetchBooks);
  const bookProblemSummaries = useAsync(fetchBookProblemSummaries);

  const action = () => {
    console.log('import');
  };

  const confirmDeleteBook = (bookId: Book['bookId']) => {
    console.log(`delete: ${bookId}`);
  };

  if (books.loading || bookProblemSummaries.loading) return <></>;
  if (books.error) return <ErrorPage error={books.error.message} />;
  if (bookProblemSummaries.error)
    return <ErrorPage error={bookProblemSummaries.error.message} />;

  const book = books.value?.items.find((i) => i.bookId === selectedBook);
  const bookProblemSummary = bookProblemSummaries.value?.items.find(
    (i) => i.bookId === selectedBook,
  );

  return (
    <PageContainer>
      <h2>問題管理</h2>
      <Flex gap="size-200">
        <Flex direction="column" gap="size-200">
          <BookList
            items={books.value!.items}
            selectedBook={selectedBook}
            onSelectBook={setSelectedBook}
            onDeleteBook={confirmDeleteBook}
          />
          <ActionGroup
            onAction={action}
            defaultSelectedKeys="all"
            selectionMode="multiple"
            disallowEmptySelection
            isEmphasized
          >
            <Item key="import">SFGファイルからインポート</Item>
          </ActionGroup>
        </Flex>
        {book && (
          <BookProblems
            items={book.problems}
            solveSummary={bookProblemSummary?.problemSummaries ?? []}
            onClickShowProblem={openProblemView}
          />
        )}
      </Flex>
    </PageContainer>
  );
}
