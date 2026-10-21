// Brand name is not translated.
const BRAND = { first: "Tuk", second: "Trail" } as const;

/** "TukTrail" set in the display face, with a tiny kilometre-post mark. Decorative: parent supplies the label. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg width="18" height="26" viewBox="0 0 18 26" className="shrink-0">
        <path d="M1 9a8 8 0 0 1 16 0v16H1z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
        <path d="M1.9 6.5A8 8 0 0 1 16.1 6.5" stroke="var(--laterite)" strokeWidth="5" fill="none" />
        <path d="M5 15h8M5 19h5" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.375rem] leading-none tracking-tight text-ink">
        {BRAND.first}
        <span className="text-laterite">{BRAND.second}</span>
      </span>
    </span>
  );
}
