import MediaPreview from './MediaPreview.jsx';

function fmtTime(t) {
  if (!t) return '';
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ msg, mine }) {
  return (
    <div className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
      <div
        className={
          'max-w-[80%] sm:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm ' +
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
        <div className={'mt-1 flex items-center gap-1 text-[10px] ' + (mine ? 'text-brand-50/80 justify-end' : 'text-zinc-500')}>
          <span>{fmtTime(msg.createdAt)}</span>
          {mine && (
            <span title={msg.seen ? 'seen' : 'sent'}>{msg.seen ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
