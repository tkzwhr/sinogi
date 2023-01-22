import BookList from '@/components/presentational/BookList';
import BookProblems from '@/components/presentational/BookProblems';
import { openProblemView, deleteBook } from '@/services/api';
import { Book, BookProblemSummary, BookWithProblems } from '@/types';
import { Col, Row } from 'antd';
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
    <Row gutter={16}>
      <Col flex="360px">
        <BookList
          items={props.bookWithProblems}
          selectedBook={selectedBook}
          onSelectBook={setSelectedBook}
          onDeleteBook={deleteBook}
        />
      </Col>
      <Col flex="auto">
        {book && (
          <BookProblems
            items={book.problems}
            solveSummary={bookProblemSummary}
            onClickShowProblem={openProblemView}
          />
        )}
      </Col>
    </Row>
  );
}
