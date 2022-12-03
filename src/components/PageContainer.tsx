import React, { Key } from 'react';
import {
  View,
  MenuTrigger,
  ActionButton,
  Item,
  Menu,
} from '@adobe/react-spectrum';
import { useLocation, useNavigate } from 'react-router-dom';

type PageMetadata = {
  path: string;
  title: string;
};

const PAGES: PageMetadata[] = [
  { path: '/', title: '詰碁を解く' },
  { path: '/footprints', title: 'あしあとを見る' },
  { path: '/books', title: '問題を管理する' },
];

export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const transition = (key: Key) => {
    navigate(key.toString(), { replace: true });
  };

  return (
    <>
      <View padding="size-200">{children}</View>
      <View position="fixed" right="4px" bottom="4px">
        <MenuTrigger>
          <ActionButton>
            {PAGES.find((p) => p.path === location.pathname)!.title}
          </ActionButton>
          <Menu onAction={transition} items={PAGES}>
            {(item: PageMetadata) => <Item key={item.path}>{item.title}</Item>}
          </Menu>
        </MenuTrigger>
      </View>
    </>
  );
}
