import { navigatePageEvent, updateProgressEvent } from '@/services/event';
import { tauriAvailable } from '@/utils/tauri';
import {
  ActionButton,
  Content,
  Dialog,
  DialogContainer,
  Item,
  Menu,
  MenuTrigger,
  ProgressBar,
  View,
} from '@adobe/react-spectrum';
import React, { Key, useState } from 'react';
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

export default function PageFoundationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<number | null>(null);

  navigatePageEvent.useNavigatePageListener((path: string) =>
    navigate(path, { replace: true }),
  );
  updateProgressEvent.useUpdateProgressListener(setProgress);

  const transition = (key: Key) => {
    navigate(key.toString(), { replace: true });
  };

  return (
    <>
      <View padding="size-200">{children}</View>
      {progress !== null && (
        <DialogContainer onDismiss={() => setProgress(null)}>
          <Dialog>
            <Content>
              <ProgressBar label="処理中..." value={progress} width="100%" />
            </Content>
          </Dialog>
        </DialogContainer>
      )}
      {!tauriAvailable() && (
        <View position="fixed" right="4px" bottom="4px">
          <MenuTrigger>
            <ActionButton>
              {PAGES.find((p) => p.path === location.pathname)?.title ?? '-'}
            </ActionButton>
            <Menu onAction={transition} items={PAGES}>
              {(item: PageMetadata) => (
                <Item key={item.path}>{item.title}</Item>
              )}
            </Menu>
          </MenuTrigger>
        </View>
      )}
    </>
  );
}
