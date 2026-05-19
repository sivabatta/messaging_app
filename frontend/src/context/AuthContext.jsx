import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const r = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  }

  async function signup(username, password) {
    const r = await api.post('/auth/signup', { username, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, dark, setDark }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
