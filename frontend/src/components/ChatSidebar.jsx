import { useAuth } from '../context/AuthContext.jsx';

function initials(name) {
  return name?.slice(0, 2).toUpperCase() || '??';
}

function lastSeenText(u) {
  if (u.online) return 'online';
  if (!u.lastSeen) return 'offline';
  const diff = Date.now() - new Date(u.lastSeen).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ChatSidebar({ users, self, activeId, onSelect, onLogout }) {
  const { user, dark, setDark } = useAuth();

  const selfEntry = self
    ? { id: self.id, username: 'Notes to self', email: 'Messages only you can see', online: true, lastSeen: null, isSelf: true }
    : null;

  return (
    <aside className="w-full sm:w-80 border-r dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full">
      <header className="p-4 border-b dark:border-zinc-800 flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.username}</div>
          <div className="text-xs text-zinc-500 truncate">Signed in</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setDark(!dark)}
            title="Toggle theme"
            aria-label="Toggle theme"
            className="h-9 w-9 grid place-items-center rounded-full bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {dark ? '☀' : '☾'}
          </button>
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="h-9 w-9 grid place-items-center rounded-full bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            ⎋
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {selfEntry && (
          <button
            onClick={() => onSelect(selfEntry)}
            className={
              'w-full flex items-center gap-3 px-4 py-3 text-left border-b dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 ' +
              (activeId === selfEntry.id ? 'bg-zinc-100 dark:bg-zinc-800' : '')
            }
          >
            <div className="h-10 w-10 rounded-full bg-brand-600 text-white grid place-items-center font-semibold">★</div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">Notes to self</div>
              <div className="text-xs text-zinc-500 truncate">Messages only you can see</div>
            </div>
          </button>
        )}
        {users.length === 0 && (
          <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            No other users yet — invite someone, or use Notes to self above.
          </div>
        )}
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u)}
            className={
              'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 ' +
              (activeId === u.id ? 'bg-zinc-100 dark:bg-zinc-800' : '')
            }
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-brand-500/20 text-brand-700 dark:text-brand-500 grid place-items-center font-semibold">
                {initials(u.username)}
              </div>
              <span
                className={
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ' +
                  (u.online ? 'bg-green-500' : 'bg-zinc-400')
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{u.username}</div>
              <div className="text-xs text-zinc-500 truncate">{lastSeenText(u)}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
