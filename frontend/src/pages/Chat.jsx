import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { SocketProvider, useSocket } from '../context/SocketContext.jsx';
import ChatSidebar from '../components/ChatSidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

function ChatShell() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);

  useEffect(() => {
    api.get('/auth/users').then((r) => setUsers(r.data.users));
  }, []);

  useEffect(() => {
    if (!socket) return;
    function onPresence({ userId, online, lastSeen }) {
      setUsers((list) =>
        list.map((u) =>
          u.id === userId ? { ...u, online, lastSeen: lastSeen || u.lastSeen } : u
        )
      );
      setActive((a) => (a && a.id === userId ? { ...a, online, lastSeen: lastSeen || a.lastSeen } : a));
    }
    socket.on('presence:update', onPresence);
    return () => socket.off('presence:update', onPresence);
  }, [socket]);

  function pick(u) {
    setActive(u);
    setShowSidebarOnMobile(false);
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950">
      {!connected && (
        <div className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 text-center py-1">
          Reconnecting…
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <div className={(showSidebarOnMobile ? 'flex' : 'hidden') + ' sm:flex'}>
          <ChatSidebar
            users={users}
            self={user}
            activeId={active?.id}
            onSelect={pick}
            onLogout={logout}
          />
        </div>
        <div className={(showSidebarOnMobile ? 'hidden' : 'flex') + ' sm:flex flex-1'}>
          <ChatWindow
            peer={active}
            socket={socket}
            onBack={() => setShowSidebarOnMobile(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const token = localStorage.getItem('token');
  return (
    <SocketProvider token={token}>
      <ChatShell />
    </SocketProvider>
  );
}
