import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
import { TimetableHomePage } from "../features/timetable-home/TimetableHomePage.js";
import { AdminRoute } from "../features/timetable-admin/AdminRoute.js";

/** The application's route table, exported so tests can mount it in memory. */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <TimetableHomePage />,
  },
  {
    path: "/admin",
    element: <AdminRoute />,
  },
];

const router = createBrowserRouter(routes);

export function Router() {
  return <RouterProvider router={router} />;
}
