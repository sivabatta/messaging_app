import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Chat from './pages/Chat.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen grid place-items-center text-zinc-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <Protected>
            <Chat />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
