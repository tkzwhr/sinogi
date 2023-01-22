import { Book } from '@/types';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import { Button, Menu, Popconfirm } from 'antd';
import { useMemo } from 'react';

type Props = {
  items: Book[];
  selectedBook: Book['bookId'] | undefined;
  onSelectBook: (bookId: Book['bookId']) => void;
  onDeleteBook: (bookId: Book['bookId']) => void;
};

export default function BookList(props: Props) {
  const data = useMemo(
    () =>
      props.items.map((b) => ({
        key: b.bookId,
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>{b.name}</div>
            <Popconfirm
              title={`${b.name}を削除します`}
              description="本当に削除してもよろしいですか？この操作は取り消せません。"
              cancelText="キャンセル"
              okText="削除する"
              okType="danger"
              onConfirm={() => props.onDeleteBook(b.bookId)}
            >
              <Button
                shape="circle"
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </div>
        ),
      })),
    [props.items],
  );

  return (
    <Menu
      style={{ width: 360 }}
      defaultSelectedKeys={
        props.selectedBook ? [props.selectedBook] : undefined
      }
      items={data}
      onClick={(e) => props.onSelectBook(e.key)}
    />
  );
}
