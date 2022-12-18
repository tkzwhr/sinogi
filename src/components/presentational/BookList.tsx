import { Book } from '@/types';
import {
  ActionMenu,
  Item,
  ListView,
  Text,
  IllustratedMessage,
  Content,
} from '@adobe/react-spectrum';
import NotFound from '@spectrum-icons/illustrations/NotFound';
import Delete from '@spectrum-icons/workflow/Delete';
import { Key } from 'react';

type Props = {
  items: Book[];
  selectedBook: Book['bookId'] | undefined;
  onSelectBook: (_0: Book['bookId']) => void;

  onDeleteBook: (_0: Book['bookId']) => void;
};

export default function BookList(props: Props) {
  const updateKeys = (keys: 'all' | Set<Key>) => {
    if (keys === 'all' || keys.size !== 1) {
      return;
    }
    props.onSelectBook(Array.from(keys as Set<string>)[0]);
  };

  const deleteBook = (bookId: Book['bookId']) => {
    props.onDeleteBook(bookId);
  };

  const emptyState = () => {
    return (
      <IllustratedMessage>
        <NotFound />
        <Content>ブックが見つかりません</Content>
      </IllustratedMessage>
    );
  };

  return (
    <ListView
      items={props.items}
      width="size-3000"
      minHeight="size-3000"
      aria-label="ブック"
      selectionMode="single"
      selectionStyle="highlight"
      selectedKeys={props.selectedBook ? [props.selectedBook] : []}
      onSelectionChange={updateKeys}
      disallowEmptySelection
      renderEmptyState={emptyState}
    >
      {(item) => (
        <Item key={item.bookId}>
          <Text>{item.name}</Text>
          <ActionMenu onAction={() => deleteBook(item.bookId)}>
            <Item key="delete" textValue="削除">
              <Delete />
              <Text>削除</Text>
            </Item>
          </ActionMenu>
        </Item>
      )}
    </ListView>
  );
}
