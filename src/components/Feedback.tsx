import { AlertTriangle, CheckCircle2, ChevronDown, Info, Lightbulb, XOctagon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { ErrorExplanation } from '../engine/errors';
import type { Verdict } from '../engine/types';

function Shell({ tone, icon, title, children }: { tone: 'ok' | 'warn' | 'err' | 'info'; icon: ReactNode; title: string; children?: ReactNode }) {
  const tones = {
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    warn: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
    err: 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
    info: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100',
  };
  return (
    <div className={`animate-pop rounded-xl border px-4 py-3 ${tones[tone]}`} role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Tips({ tips }: { tips: string[] }) {
  if (!tips.length) return null;
  return (
    <ul className="mt-2 space-y-1.5 text-sm">
      {tips.map((t, i) => (
        <li key={i} className="flex gap-2">
          <Lightbulb size={14} className="mt-[3px] shrink-0 opacity-70" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function ErrorFeedback({ e }: { e: ErrorExplanation }) {
  const [raw, setRaw] = useState(false);
  return (
    <Shell tone="err" icon={<XOctagon size={18} />} title={e.title}>
      <p className="mt-1 text-sm">{e.explanation}</p>
      <Tips tips={e.tips} />
      <button className="mt-2 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100" onClick={() => setRaw(!raw)}>
        <ChevronDown size={12} className={raw ? 'rotate-180' : ''} /> mensagem original do SQLite
      </button>
      {raw && <pre className="mt-1 whitespace-pre-wrap rounded bg-black/10 px-2 py-1 text-xs dark:bg-black/30">{e.raw}</pre>}
    </Shell>
  );
}

export function VerdictFeedback({ v, extra, children }: { v: Verdict; extra?: string | null; children?: ReactNode }) {
  if (v.correct) {
    return (
      <Shell tone="ok" icon={<CheckCircle2 size={18} />} title={v.title}>
        <p className="mt-1 text-sm">{v.message}</p>
        {extra && <p className="mt-2 flex gap-2 text-sm"><Info size={14} className="mt-[3px] shrink-0" />{extra}</p>}
        {children}
      </Shell>
    );
  }
  return (
    <Shell tone="warn" icon={<AlertTriangle size={18} />} title={v.title}>
      <p className="mt-1 text-sm">{v.message}</p>
      <Tips tips={v.tips} />
      {children}
    </Shell>
  );
}

export function InfoFeedback({ title, children }: { title: string; children?: ReactNode }) {
  return <Shell tone="info" icon={<Info size={18} />} title={title}>{children}</Shell>;
}
