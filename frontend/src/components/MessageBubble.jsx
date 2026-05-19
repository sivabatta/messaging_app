import { useState } from 'react';
import MediaPreview from './MediaPreview.jsx';

function fmtTime(t) {
  if (!t) return '';
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ msg, mine, onDelete }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    if (msg.type !== 'text' || !msg.text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(msg.text);
      } else {
        // Fallback for older mobile browsers without clipboard API.
        const ta = document.createElement('textarea');
        ta.value = msg.text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  const actionClass =
    'text-[10px] px-1.5 py-0.5 rounded transition-opacity ' +
    (mine
      ? 'text-brand-50/80 hover:bg-white/15 active:bg-white/20'
      : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300');

  return (
    <div className={'flex group ' + (mine ? 'justify-end' : 'justify-start')}>
      <div
        className={
          'max-w-[85%] sm:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm ' +
          (mine
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm')
        }
      >
        {msg.type === 'text' ? (
          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
        ) : (
          <MediaPreview media={msg.media} />
        )}

        <div className={'mt-1 flex items-center gap-1 ' + (mine ? 'justify-end' : 'justify-start')}>
          <span className={'text-[10px] ' + (mine ? 'text-brand-50/80' : 'text-zinc-500')}>
            {fmtTime(msg.createdAt)}
          </span>
          {mine && (
            <span title={msg.seen ? 'seen' : 'sent'} className={'text-[10px] ' + (mine ? 'text-brand-50/80' : 'text-zinc-500')}>
              {msg.seen ? '✓✓' : '✓'}
            </span>
          )}

          <span className="flex-1" />

          {msg.type === 'text' && (
            <button
              type="button"
              onClick={copyText}
              className={actionClass}
              title="Copy message"
              aria-label="Copy message"
            >
              {copied ? '✓ copied' : '📋'}
            </button>
          )}
          {mine && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(msg)}
              className={actionClass}
              title="Delete message"
              aria-label="Delete message"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
