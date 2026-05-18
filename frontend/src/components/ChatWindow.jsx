import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import UploadProgress from './UploadProgress.jsx';

const ACCEPT = 'image/jpeg,image/png,video/mp4,video/quicktime';
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;

const notifyAudio = typeof window !== 'undefined'
  ? new Audio(
      // tiny generated chime (data URI keeps everything self-contained)
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
    )
  : null;

export default function ChatWindow({ peer, socket, onMessageDelivered, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(null); // { name, pct } | null
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setErr('');
    if (!peer) return;
    api.get(`/messages/history/${peer.id}`).then((r) => {
      if (cancelled) return;
      // Merge with anything we already received via socket so a fast send
      // can't be wiped out by a slow history response.
      setMessages((prev) => {
        const ids = new Set(r.data.messages.map((m) => m.id));
        const extras = prev.filter((m) => !ids.has(m.id));
        return [...r.data.messages, ...extras];
      });
    });
    api.post('/messages/seen', { from: peer.id }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [peer?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typing]);

  useEffect(() => {
    if (!socket || !peer) return;

    function onNew(msg) {
      const involvesPeer =
        (msg.sender === peer.id && msg.receiver === user.id) ||
        (msg.sender === user.id && msg.receiver === peer.id);
      if (!involvesPeer) {
        onMessageDelivered?.(msg);
        return;
      }
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      const isSelfChat = peer.id === user.id;
      if (msg.sender === peer.id && !isSelfChat) {
        notifyAudio?.play().catch(() => {});
        api.post('/messages/seen', { from: peer.id }).catch(() => {});
      }
    }
    function onSeen({ by }) {
      if (by !== peer.id) return;
      setMessages((prev) =>
        prev.map((m) => (m.sender === user.id && !m.seen ? { ...m, seen: true } : m))
      );
    }
    function onTypingStart({ from }) {
      if (from === peer.id) setTyping(true);
    }
    function onTypingStop({ from }) {
      if (from === peer.id) setTyping(false);
    }
    function onCleared({ between }) {
      if (!between) return;
      const pair = new Set(between.map(String));
      if (pair.has(String(user.id)) && pair.has(String(peer.id))) {
        setMessages([]);
      }
    }

    socket.on('message:new', onNew);
    socket.on('message:seen', onSeen);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('chat:cleared', onCleared);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:seen', onSeen);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('chat:cleared', onCleared);
    };
  }, [socket, peer?.id, user?.id]);

  async function deleteChat() {
    if (!peer) return;
    const ok = window.confirm(
      peer.id === user.id
        ? 'Delete all Notes-to-self messages? This permanently removes them from the database.'
        : `Delete the entire conversation with ${peer.username}? This permanently removes all messages and media from the database for both of you.`
    );
    if (!ok) return;
    try {
      await api.delete(`/messages/conversation/${peer.id}`);
      setMessages([]);
    } catch (e) {
      setErr(e.response?.data?.error || 'delete failed');
    }
  }

  function emitTyping() {
    if (!socket || !peer) return;
    if (peer.id === user.id) return; // no typing indicator in Notes to self
    socket.emit('typing:start', { to: peer.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { to: peer.id });
    }, 1500);
  }

  async function sendText(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !peer) return;
    setText('');
    socket?.emit('typing:stop', { to: peer.id });
    try {
      await api.post('/messages', { to: peer.id, text: trimmed });
    } catch (e) {
      setErr(e.response?.data?.error || 'send failed');
    }
  }

  async function sendFile(file) {
    if (!file || !peer) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!ACCEPT.split(',').includes(file.type)) {
      setErr('only JPG, PNG, MP4, MOV allowed');
      return;
    }
    const limitMB = isImage ? MAX_IMAGE_MB : isVideo ? MAX_VIDEO_MB : 0;
    if (file.size > limitMB * 1024 * 1024) {
      setErr(`file exceeds ${limitMB}MB`);
      return;
    }
    setErr('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('to', peer.id);
    setUploading({ name: file.name, pct: 0 });
    try {
      await api.post('/messages/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (!e.total) return;
          setUploading({ name: file.name, pct: Math.round((e.loaded * 100) / e.total) });
        },
      });
    } catch (e) {
      setErr(e.response?.data?.error || 'upload failed');
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages]
  );

  if (!peer) {
    return (
      <div className="flex-1 grid place-items-center text-zinc-500 dark:text-zinc-400">
        Select a conversation
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="px-4 py-3 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3">
        {onBack && (
          <button className="sm:hidden text-zinc-600 dark:text-zinc-300" onClick={onBack}>←</button>
        )}
        <div className="relative">
          <div className={
            'h-9 w-9 rounded-full grid place-items-center font-semibold ' +
            (peer.id === user.id
              ? 'bg-brand-600 text-white'
              : 'bg-brand-500/20 text-brand-700 dark:text-brand-500')
          }>
            {peer.id === user.id ? '★' : peer.username?.slice(0, 2).toUpperCase()}
          </div>
          {peer.id !== user.id && (
            <span
              className={
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-900 ' +
                (peer.online ? 'bg-green-500' : 'bg-zinc-400')
              }
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{peer.username}</div>
          <div className="text-xs text-zinc-500">
            {peer.id === user.id ? 'Messages only you can see' : peer.online ? 'online' : 'offline'}
          </div>
        </div>
        <button
          onClick={deleteChat}
          title="Delete chat"
          className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded"
        >
          🗑
        </button>
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin p-3 sm:p-4 space-y-2">
        {sorted.map((m) => (
          <MessageBubble key={m.id} msg={m} mine={m.sender === user.id} />
        ))}
        {typing && <TypingIndicator name={peer.username} />}
        <div ref={endRef} />
      </div>

      {(uploading || err) && (
        <div className="px-3 pb-2 space-y-1">
          {uploading && <UploadProgress name={uploading.name} pct={uploading.pct} />}
          {err && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/30 rounded px-2 py-1">
              {err}
            </div>
          )}
        </div>
      )}

      <form onSubmit={sendText} className="p-3 border-t dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => sendFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          title="Attach image or video"
        >
          📎
        </button>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            emitTyping();
          }}
          placeholder="Type a message"
          className="flex-1 px-3 py-2 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
