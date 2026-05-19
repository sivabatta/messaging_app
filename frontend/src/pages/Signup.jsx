import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup, dark, setDark } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await signup(username, password);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Create account</h1>
          <button type="button" onClick={() => setDark(!dark)} className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200">
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-2 rounded">{err}</div>}
        <input
          className="w-full px-3 py-2 rounded border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          placeholder="userID (4–16 chars, letters/digits/_.-)"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          required
          minLength={4}
          maxLength={16}
          pattern="[A-Za-z0-9_.\-]{4,16}"
        />
        <input
          className="w-full px-3 py-2 rounded border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
          type="password"
          placeholder="password (min 6 chars)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button disabled={busy} className="w-full py-2 rounded bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50">
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <div className="text-sm text-center text-zinc-600 dark:text-zinc-400">
          Already have an account? <Link className="text-brand-600" to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
