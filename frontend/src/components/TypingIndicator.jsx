export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 px-2 py-1">
      <span>{name} is typing</span>
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce" />
      </span>
    </div>
  );
}
