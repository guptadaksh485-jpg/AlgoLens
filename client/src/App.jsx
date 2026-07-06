import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Contests from "./pages/Contests";
import Topics from "./pages/Topics";
import Analyze from "./pages/Analyze";
import Planner from "./pages/Planner";
import Profile from "./pages/Profile";

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  </div>
);

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contests"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Contests />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/topics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Topics />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyze"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Analyze />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Planner />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
