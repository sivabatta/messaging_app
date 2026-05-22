import { mediaDownloadUrl, mediaUrl } from '../api/client';

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

function iconFor(fileName, fileType) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) return '📊';
  if (['doc', 'docx', 'rtf', 'odt', 'pages'].includes(ext)) return '📝';
  if (['ppt', 'pptx', 'key', 'odp'].includes(ext)) return '📈';
  if (ext === 'pdf') return '📕';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return '🗜️';
  if (['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'].includes(ext)) return '🎵';
  if (['txt', 'md', 'log'].includes(ext)) return '📄';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'rb', 'php', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql'].includes(ext)) return '💻';
  if (fileType?.startsWith('image/')) return '🖼️';
  if (fileType?.startsWith('video/')) return '🎬';
  return '📎';
}

function DownloadButton({ media, compact }) {
  return (
    <a
      href={mediaDownloadUrl(media.id)}
      download={media.fileName}
      className={
        'inline-flex items-center gap-1 rounded bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 ' +
        (compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1')
      }
      title="Download"
    >
      <span>↓</span>
      <span>Download</span>
    </a>
  );
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

  if (expired) {
    return <div className="text-xs italic text-zinc-500 dark:text-zinc-400">Media expired.</div>;
  }

  if (media.kind === 'image') {
    return (
      <div className="space-y-1">
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={media.fileName}
            className="max-w-xs max-h-64 rounded-lg object-cover"
            loading="lazy"
          />
        </a>
        <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="truncate max-w-[160px]" title={media.fileName}>
            {media.fileName} · {fmtSize(media.size)} · {left}d left
          </span>
          <DownloadButton media={media} compact />
        </div>
      </div>
    );
  }

  if (media.kind === 'video') {
    return (
      <div className="space-y-1">
        <video
          src={url}
          controls
          className="max-w-xs max-h-64 rounded-lg bg-black"
          preload="metadata"
        />
        <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="truncate max-w-[160px]" title={media.fileName}>
            {media.fileName} · {fmtSize(media.size)} · {left}d left
          </span>
          <DownloadButton media={media} compact />
        </div>
      </div>
    );
  }

  // Generic file: icon + name + size on the left, explicit Download button on the right.
  return (
    <div className="flex items-center gap-3 max-w-xs bg-black/10 dark:bg-white/10 rounded-lg p-2">
      <div className="h-10 w-10 grid place-items-center text-2xl bg-white/30 dark:bg-black/30 rounded-md shrink-0">
        {iconFor(media.fileName, media.fileType)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate" title={media.fileName}>
          {media.fileName}
        </div>
        <div className="text-[11px] opacity-75">
          {fmtSize(media.size)} · {left}d left
        </div>
      </div>
      <DownloadButton media={media} />
    </div>
  );
}
