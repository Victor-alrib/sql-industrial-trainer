import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { Difficulty } from '../content/types';

const DIFF: Record<Difficulty, { label: string; cls: string; bars: number }> = {
  facil: { label: 'Fácil', cls: 'text-emerald-600 dark:text-emerald-400', bars: 1 },
  medio: { label: 'Médio', cls: 'text-amber-600 dark:text-amber-400', bars: 2 },
  dificil: { label: 'Difícil', cls: 'text-rose-600 dark:text-rose-400', bars: 3 },
};

export function DifficultyBadge({ d }: { d: Difficulty }) {
  const c = DIFF[d];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.cls}`} title={`Dificuldade: ${c.label}`}>
      <span className="flex items-end gap-[2px]">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`w-[3px] rounded-sm ${i <= c.bars ? 'bg-current' : 'bg-current opacity-20'}`} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {c.label}
    </span>
  );
}

export function StatusIcon({ status, size = 18 }: { status: 'new' | 'attempted' | 'solved'; size?: number }) {
  if (status === 'solved') return <CheckCircle2 size={size} className="shrink-0 text-emerald-500" aria-label="Resolvido" />;
  if (status === 'attempted') return <CircleDot size={size} className="shrink-0 text-amber-500" aria-label="Em andamento" />;
  return <Circle size={size} className="shrink-0 text-slate-300 dark:text-ink-600" aria-label="Não iniciado" />;
}
