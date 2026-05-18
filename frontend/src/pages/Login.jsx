import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, dark, setDark } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Sign in</h1>
          <button type="button" onClick={() => setDark(!dark)} className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200">
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-2 rounded">{err}</div>}
        <input
          className="w-full px-3 py-2 rounded border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <input
          className="w-full px-3 py-2 rounded border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required
        />
        <button disabled={busy} className="w-full py-2 rounded bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="text-sm text-center text-zinc-600 dark:text-zinc-400">
          No account? <Link className="text-brand-600" to="/signup">Sign up</Link>
        </div>
      </form>
    </div>
  );
}
