// Decorative only: navigation and future availability are conveyed in real text.
export function StrategyPaths({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 420 260" fill="none" aria-hidden="true" focusable="false">
    <g stroke="currentColor" opacity=".09"><path d="M20 30H400M20 80H400M20 130H400M20 180H400M20 230H400M50 10V250M130 10V250M210 10V250M290 10V250M370 10V250"/></g>
    <g stroke="currentColor" opacity=".2" strokeWidth="1.5"><path d="M50 130H90Q110 130 110 110V70Q110 50 130 50H210M50 130H90Q110 130 110 150V190Q110 210 130 210H210M210 50H270Q290 50 290 70V110Q290 130 310 130H370M210 210H270Q290 210 290 190V150Q290 130 310 130H370"/></g>
    <path d="M50 130H90Q110 130 110 110V70Q110 50 130 50H210H270Q290 50 290 70V110Q290 130 310 130H370" stroke="var(--primary)" strokeWidth="2"/>
    <g fill="var(--background)" stroke="currentColor" strokeWidth="1.5"><circle cx="210" cy="210" r="6" opacity=".35"/><circle cx="210" cy="50" r="6" stroke="var(--primary)"/></g>
    <circle cx="50" cy="130" r="8" fill="var(--primary)"/>
    <circle cx="370" cy="130" r="17" fill="var(--background)" stroke="var(--primary)" strokeWidth="1.5"/>
    <path d="m364 130 4 4 8-8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
