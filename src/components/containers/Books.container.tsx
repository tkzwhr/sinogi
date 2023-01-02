import BookList from '@/components/presentational/BookList';
import BookProblems from '@/components/presentational/BookProblems';
import { openProblemView, deleteBook } from '@/services/api';
import { importSGF } from '@/services/event';
import { Book, BookProblemSummary, BookWithProblems } from '@/types';
import { ActionGroup, Flex, Item } from '@adobe/react-spectrum';
import { useState } from 'react';

type Props = {
  bookWithProblems: BookWithProblems[];
  bookProblemSummaries: BookProblemSummary[];
};

export default function BooksContainer(props: Props) {
  const [selectedBook, setSelectedBook] = useState<
    Book['bookId'] | undefined
  >();

  const book = props.bookWithProblems.find((i) => i.bookId === selectedBook);
  const bookProblemSummary =
    props.bookProblemSummaries.find((i) => i.bookId === selectedBook)
      ?.problemSummaries ?? [];

  return (
    <Flex gap="size-200">
      <Flex direction="column" gap="size-200">
        <BookList
          items={props.bookWithProblems}
          selectedBook={selectedBook}
          onSelectBook={setSelectedBook}
          onDeleteBook={deleteBook}
        />
        <ActionGroup
          onAction={importSGF}
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
          solveSummary={bookProblemSummary}
          onClickShowProblem={openProblemView}
        />
      )}
    </Flex>
  );
}
