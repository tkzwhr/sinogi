import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { darkTheme, Provider } from '@adobe/react-spectrum';
import SolvePage from '@/pages/SolvePage';
import BooksPage from '@/pages/BooksPage';
import FootprintsPage from '@/pages/FootprintsPage';
import ViewerPage from '@/pages/ViewerPage';

import './index.styl';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SolvePage />,
  },
  {
    path: '/footprints',
    element: <FootprintsPage />,
  },
  {
    path: '/books',
    element: <BooksPage />,
  },
  {
    path: '/problems/:problemId',
    element: <ViewerPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider theme={darkTheme}>
    <div className="inner-spectrum">
      <RouterProvider router={router} />
    </div>
  </Provider>,
);
