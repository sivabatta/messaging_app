export default function UploadProgress({ name, pct }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
      <span className="truncate max-w-[160px] text-zinc-700 dark:text-zinc-200">Uploading {name}</span>
      <div className="flex-1 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded overflow-hidden">
        <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-zinc-600 dark:text-zinc-300 w-9 text-right">{pct}%</span>
    </div>
  );
}
