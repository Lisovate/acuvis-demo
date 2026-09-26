import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { useAuth } from "./auth.js";
import { Login } from "./pages/Login.js";
import { Register } from "./pages/Register.js";
import { Dashboard } from "./pages/Dashboard.js";
import { CreateLink } from "./pages/CreateLink.js";
import { Members } from "./pages/Members.js";
import { Webhooks } from "./pages/Webhooks.js";
import { AcceptInvite } from "./pages/AcceptInvite.js";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/new"
          element={
            <RequireAuth>
              <CreateLink />
            </RequireAuth>
          }
        />
        <Route
          path="/members"
          element={
            <RequireAuth>
              <Members />
            </RequireAuth>
          }
        />
        <Route
          path="/webhooks"
          element={
            <RequireAuth>
              <Webhooks />
            </RequireAuth>
          }
        />
        <Route
          path="/invite"
          element={
            <RequireAuth>
              <AcceptInvite />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
