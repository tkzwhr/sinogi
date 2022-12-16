import { Book, SolveSettings } from '@/types';
import {
  Content,
  Dialog,
  Form,
  RadioGroup,
  Radio,
  ListView,
  Item,
  NumberField,
  StatusLight,
} from '@adobe/react-spectrum';
import { Key, useState } from 'react';

type Props = SolveSettings & {
  books: Book[];
  closeFn: () => void;
  onClose: (_0: SolveSettings) => void;
};

export default function SolveSettingsModal(props: Props) {
  const [scope, setScope] = useState<string>(props.scope);
  const [selectedBooks, setSelectedBooks] = useState(props.selectedBooks);
  const [quota, setQuota] = useState(props.quota);
  const [allottedTime, setAllottedTime] = useState(props.allottedTime);

  const updateSelectedBooks = (keys: 'all' | Set<Key>) => {
    if (keys === 'all') {
      setSelectedBooks(props.books.map((sb) => sb.bookId));
      return;
    }
    setSelectedBooks(Array.from(keys as Set<string>));
  };

  const emit = () => {
    props.onClose({
      scope: scope as 'all' | 'selectedBooks',
      selectedBooks,
      quota,
      allottedTime,
    });
    props.closeFn();
  };

  return (
    <Dialog onDismiss={emit}>
      <Content>
        <Form width="size-6000">
          <RadioGroup
            label="出題範囲"
            orientation="horizontal"
            value={scope}
            onChange={setScope}
          >
            <Radio value="all">全て</Radio>
            <Radio value="selectedBooks">指定したブック</Radio>
          </RadioGroup>
          <>
            {scope === 'selectedBooks' && (
              <ListView
                selectionMode="multiple"
                aria-label="ブック一覧"
                items={props.books}
                selectedKeys={selectedBooks}
                onSelectionChange={updateSelectedBooks}
              >
                {(item) => <Item key={item.bookId}>{item.name}</Item>}
              </ListView>
            )}
          </>
          <NumberField
            label="1日の目標"
            value={quota}
            onChange={setQuota}
            minValue={0}
            step={1}
          />
          <>
            {quota === 0 && (
              <StatusLight variant="info">
                0の場合は目標を設定しません
              </StatusLight>
            )}
          </>
          <NumberField
            label="制限時間（秒）"
            value={allottedTime}
            onChange={setAllottedTime}
            minValue={0}
            maxValue={999}
            step={1}
          />
          <>
            {allottedTime === 0 && (
              <StatusLight variant="info">
                0の場合は制限時間を設定しません
              </StatusLight>
            )}
          </>
        </Form>
      </Content>
    </Dialog>
  );
}
