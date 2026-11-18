export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" className="fill-ink-900 dark:fill-ink-800" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" className="stroke-amber-400/40" />
      <path d="M8 22V10l8 6 8-6v12" stroke="#f5a524" strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="16" cy="25" r="1.6" fill="#34d399" />
    </svg>
  );
}
