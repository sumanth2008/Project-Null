import React, { useRef, useState, useLayoutEffect } from "react";

/**
 * FoldMinimizeCard
 * - click header to toggle open/closed (folding)
 * - click minimize to collapse into a small floating icon (minimization)
 * - accessible: keyboard toggles, aria attributes
 */
export default function FoldMinimizeCard({ title = "Cyber Lab", children, icon: Icon }: { title?: string, children: React.ReactNode, icon?: React.ElementType }) {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState("none");

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      setMaxH(`${el.scrollHeight}px`);
      // after transition, set to none so nested resizing is fine
      const t = setTimeout(() => setMaxH("none"), 360);
      return () => clearTimeout(t);
    } else {
      // force to measured height then shrink to 0 for smooth collapse
      setMaxH(`${el.scrollHeight}px`);
      requestAnimationFrame(() => requestAnimationFrame(() => setMaxH("0px")));
    }
  }, [open]);

  if (minimized) {
    return (
      <button
        aria-label="Restore panel"
        className="fixed bottom-4 right-4 w-12 h-12 rounded-lg shadow-lg bg-emerald-800 text-white flex items-center justify-center transform-gpu transition-transform duration-200 hover:scale-105 focus:outline-none z-50"
        onClick={() => setMinimized(false)}
      >
        {Icon ? <Icon className="w-5 h-5" /> : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12h18" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    );
  }

  return (
    <section className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-fit">
      <header className="flex items-center justify-between p-4 bg-zinc-900 text-zinc-100 cursor-pointer border-b border-zinc-800"
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" ") setOpen(o=>!o) }}
        aria-expanded={open}
        >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-emerald-400" />}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e)=>{ e.stopPropagation(); setMinimized(true); }}
            aria-label="Minimize panel"
            className="px-2 py-1 rounded bg-zinc-800 text-xs hover:bg-zinc-700 transition-colors"
          >Min</button>
          <svg className={`w-4 h-4 transform transition-transform duration-250 ${open? "rotate-180":""}`} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
        </div>
      </header>

      <div
        ref={contentRef}
        className="bg-transparent overflow-hidden transition-[max-height,padding] duration-300 ease-in-out"
        style={{
          maxHeight: maxH,
          padding: open ? "1.5rem" : "0 1.5rem",
        }}
        aria-hidden={!open}
      >
        <div className="text-sm text-zinc-300 h-full">
          {children}
        </div>
      </div>
    </section>
  );
}
