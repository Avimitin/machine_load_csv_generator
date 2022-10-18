import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";
import './index.css'
import Root, {loader as rootLoader} from "./routes/root";
import ErrorPage from './error';
import Board, {loader as boardLoader} from './routes/board';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/board/:boardId",
        element: <Board />,
        loader: boardLoader,
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
