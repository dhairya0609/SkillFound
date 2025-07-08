import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/ui/Home";
import Login from "./components/ui/auth/Login";
import Signup from "./components/ui/auth/Signup";
import Jobs from "./components/ui/Jobs";
import Browse from "./components/ui/Browse"
import Profile from "./components/ui/Profile"
import JobDescription from "./components/ui/JobDescription";
import Companies from "./components/ui/admin/Companies";
import CompanyCreate from "./components/ui/admin/CompanyCreate";
import CompanySetup from "./components/ui/admin/CompanySetup";
import AdminJobs from "./components/ui/admin/AdminJobs";
import PostJob from "./components/ui/admin/PostJob";
import Applicants from "./components/ui/admin/Applicants"
import ProtectedRoute from "./components/ui/admin/ProtectedRoute";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/jobs",
    element: <Jobs />,
  },
  {
    path: "/description/:id",
    element: <JobDescription />,
  },
  {
    path: "/browse",
    element: <Browse />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path:"/admin/companies",
    element: <ProtectedRoute><Companies/></ProtectedRoute>
  },
  {
    path:"/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate/></ProtectedRoute> 
  },
  {
    path:"/admin/companies/:id",
    element:<ProtectedRoute><CompanySetup/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs",
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/create",
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/:id/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute> 
  },
]);

function App() {
  return (
    <div>
      <RouterProvider router = {appRouter} />
    </div>
  );
}

export default App;
