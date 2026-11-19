import { Suspense, lazy } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useParams } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import RequireRole from "./components/layout/RequireRole";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CompaniesDirectory from "./pages/CompaniesDirectory";
import Employers from "./pages/Employers";
import CompanyPage from "./pages/CompanyPage";
import MyJobs from "./pages/MyJobs";
import { About, Privacy, Terms } from "./pages/Legal";

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Companies = lazy(() => import("./pages/admin/Companies"));
const CompanySetup = lazy(() => import("./pages/admin/CompanySetup"));
const PostJob = lazy(() => import("./pages/admin/PostJob"));
const Applicants = lazy(() => import("./pages/admin/Applicants"));

const LegacyJobRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/jobs/${id}`} replace />;
};

const recruiter = (element) => (
  <RequireRole role="recruiter">
    <Suspense fallback={<div className="min-h-[60vh]" />}>{element}</Suspense>
  </RequireRole>
);

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/jobs", element: <Jobs /> },
      { path: "/jobs/:id", element: <JobDetail /> },
      { path: "/companies", element: <CompaniesDirectory /> },
      { path: "/companies/:id", element: <CompanyPage /> },
      { path: "/employers", element: <Employers /> },
      { path: "/for-recruiters", element: <Navigate to="/employers" replace /> },
      { path: "/my-jobs", element: <RequireRole role="student"><MyJobs /></RequireRole> },
      { path: "/about", element: <About /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/terms", element: <Terms /> },
      { path: "/browse", element: <Navigate to="/jobs" replace /> },
      { path: "/description/:id", element: <LegacyJobRedirect /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/profile", element: <RequireRole role="student"><Profile /></RequireRole> },
      { path: "/admin", element: <Navigate to="/admin/jobs" replace /> },
      { path: "/admin/jobs", element: recruiter(<Dashboard />) },
      { path: "/admin/jobs/create", element: recruiter(<PostJob />) },
      { path: "/admin/jobs/:id/applicants", element: recruiter(<Applicants />) },
      { path: "/admin/companies", element: recruiter(<Companies />) },
      { path: "/admin/companies/create", element: <Navigate to="/admin/companies" replace /> },
      { path: "/admin/companies/:id", element: recruiter(<CompanySetup />) },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
