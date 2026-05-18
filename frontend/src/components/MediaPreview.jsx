import { mediaUrl } from '../api/client';

function fmtSize(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function daysLeft(expiry) {
  const ms = new Date(expiry).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function MediaPreview({ media }) {
  if (!media) {
    return (
      <div className="text-xs italic text-zinc-500 dark:text-zinc-400">
        Media expired and has been removed.
      </div>
    );
  }
  const expired = new Date(media.expiryDate).getTime() <= Date.now();
  const url = mediaUrl(media.id);
  const left = daysLeft(media.expiryDate);

  return (
    <div className="space-y-1">
      {expired ? (
        <div className="text-xs italic text-zinc-500 dark:text-zinc-400">Media expired.</div>
      ) : media.kind === 'image' ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={media.fileName}
            className="max-w-xs max-h-64 rounded-lg object-cover"
            loading="lazy"
          />
        </a>
      ) : (
        <video
          src={url}
          controls
          className="max-w-xs max-h-64 rounded-lg bg-black"
          preload="metadata"
        />
      )}

      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="truncate max-w-[180px]" title={media.fileName}>
          {media.fileName} · {fmtSize(media.size)}
        </span>
        {!expired && (
          <a
            href={url}
            download={media.fileName}
            className="ml-2 px-2 py-0.5 rounded bg-brand-600 text-white hover:bg-brand-700"
          >
            ↓ Download · {left}d left
          </a>
        )}
      </div>
    </div>
  );
}
