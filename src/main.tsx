import './main.styl';
import BooksPage from '@/pages/Books.page';
import FootprintsPage from '@/pages/Footprints.page';
import SolvePage from '@/pages/Solve.page';
import ViewerPage from '@/pages/Viewer.page';
import {
  listenBackendEvents,
  navigatePageEvent,
  updateProgressEvent,
} from '@/services/event';
import { tauriAvailable } from '@/utils/tauri';
import { Layout, Typography, Menu, Modal, Progress } from 'antd';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router-dom';

const SHOW_MENU = true;

listenBackendEvents().then(() => console.info('Listen backend events.'));

type PageKey = 'solve' | 'footprints' | 'books' | 'viewer';

const PAGES: { key: PageKey; path: string; name: string }[] = [
  {
    key: 'solve',
    path: '/',
    name: '詰碁を解く',
  },
  {
    key: 'footprints',
    path: '/footprints',
    name: 'あしあとを見る',
  },
  {
    key: 'books',
    path: '/books',
    name: '問題を管理する',
  },
  {
    key: 'viewer',
    path: '/problems/:problemId',
    name: '詰碁の問題を見る',
  },
];

const MENUS = PAGES.filter((p) => p.key !== 'viewer').map((p) => ({
  key: p.path,
  label: p.name,
}));

const PAGE_COMPONENTS = PAGES.map((p) => {
  switch (p.key) {
    case 'solve':
      return {
        path: p.path,
        element: (
          <App>
            <SolvePage />
          </App>
        ),
      };
    case 'footprints':
      return {
        path: p.path,
        element: (
          <App>
            <FootprintsPage />
          </App>
        ),
      };
    case 'books':
      return {
        path: p.path,
        element: (
          <App>
            <BooksPage />
          </App>
        ),
      };
    case 'viewer':
      return {
        path: p.path,
        element: (
          <App>
            <ViewerPage />
          </App>
        ),
      };
  }
});

function App({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<number | null>(null);

  navigatePageEvent.useNavigatePageListener((path: string) =>
    navigate(path, { replace: true }),
  );
  updateProgressEvent.useUpdateProgressListener(setProgress);

  const navigatePage = (a: any) => {
    navigate(a.key, { replace: true });
  };

  const selectedKeys = MENUS.filter((m) => m.key === location.pathname)?.map(
    (m) => m.key,
  );

  return (
    <>
      <Layout className="container">
        {!tauriAvailable() && SHOW_MENU && (
          <Layout.Header className="header">
            <Typography.Title className="title" level={4}>
              Sinogi
            </Typography.Title>
            <Menu
              theme="dark"
              mode="horizontal"
              items={MENUS}
              defaultSelectedKeys={selectedKeys}
              onClick={navigatePage}
            />
          </Layout.Header>
        )}
        <Layout.Content className="content">{children}</Layout.Content>
      </Layout>
      <Modal
        open={progress !== null}
        title="処理中..."
        footer={null}
        closable={false}
        centered
      >
        <Progress percent={progress ?? 0} status="active" />
      </Modal>
    </>
  );
}

const router = createBrowserRouter(PAGE_COMPONENTS);
const rootContainer = document.getElementById('root');
const root = createRoot(rootContainer!);
root.render(<RouterProvider router={router} />);
