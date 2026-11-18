import { EXERCISES, exercisesOfModule } from '../content/exercises';
import { MODULES } from '../content/modules';
import type { Exercise } from '../content/types';
import { emptyProgress, type ActivityEntry, type ExerciseProgress } from '../store/progress';

export const MIN_FAILS_TO_REVEAL = 3;

export function canRevealSolution(p: ExerciseProgress) {
  return p.status === 'solved' || p.failedChecks >= MIN_FAILS_TO_REVEAL;
}

export interface ModuleStats {
  moduleId: number;
  total: number;
  solved: number;
  checks: number;
  correct: number;
  accuracy: number | null;
  completed: boolean;
  started: boolean;
  review: { exercise: Exercise; reasons: string[] }[];
}

export function reviewReasons(p: ExerciseProgress): string[] {
  const r: string[] = [];
  if (p.revealedBeforeSolve) r.push('solução consultada antes de resolver');
  if (p.status === 'attempted' && p.failedChecks >= 2) r.push(`${p.failedChecks} tentativas sem sucesso`);
  if (p.status === 'solved' && p.failedChecks >= 3) r.push(`resolvido após ${p.failedChecks} erros`);
  if (p.status === 'solved' && p.hintsUsed >= 3) r.push('precisou de todas as dicas');
  return r;
}

export function moduleStats(moduleId: number, prog: Record<string, ExerciseProgress>): ModuleStats {
  const exs = exercisesOfModule(moduleId);
  let solved = 0, checks = 0, correct = 0, started = false;
  const review: ModuleStats['review'] = [];
  for (const ex of exs) {
    const p = prog[ex.id] ?? emptyProgress();
    if (p.status === 'solved') solved++;
    if (p.status !== 'new') started = true;
    checks += p.checks;
    correct += p.checks - p.failedChecks;
    const reasons = reviewReasons(p);
    if (reasons.length) review.push({ exercise: ex, reasons });
  }
  return {
    moduleId, total: exs.length, solved, checks, correct,
    accuracy: checks ? correct / checks : null,
    completed: solved === exs.length, started, review,
  };
}

export function overallStats(prog: Record<string, ExerciseProgress>, activity: ActivityEntry[]) {
  const mods = MODULES.map((m) => moduleStats(m.id, prog));
  const solved = mods.reduce((a, m) => a + m.solved, 0);
  const checks = activity.length;
  const correct = activity.filter((a) => a.ok).length;
  const firstTry = EXERCISES.filter((e) => prog[e.id]?.firstTry).length;
  const hints = EXERCISES.reduce((a, e) => a + (prog[e.id]?.hintsUsed ?? 0), 0);
  const final = EXERCISES.find((e) => e.finalChallenge);
  const reviewModules = mods.filter(
    (m) => m.review.length > 0 || (m.accuracy !== null && m.checks >= 3 && m.accuracy < 0.5),
  );
  // próximo exercício sugerido: primeiro não resolvido na ordem da trilha
  const next = EXERCISES.find((e) => (prog[e.id]?.status ?? 'new') !== 'solved');
  return {
    modules: mods,
    modulesCompleted: mods.filter((m) => m.completed).length,
    solved, total: EXERCISES.length, checks, correct,
    accuracy: checks ? correct / checks : null,
    firstTry, hints,
    finalSolved: final ? prog[final.id]?.status === 'solved' : false,
    reviewModules, next,
  };
}

/** Atividade agregada por dia (últimos N dias, fuso local). */
export function activityByDay(activity: ActivityEntry[], days = 14) {
  const out: { key: string; label: string; ok: number; fail: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({
      key: d.toDateString(),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      ok: 0, fail: 0,
    });
  }
  const idx = new Map(out.map((o, i) => [o.key, i]));
  for (const a of activity) {
    const i = idx.get(new Date(a.at).toDateString());
    if (i === undefined) continue;
    if (a.ok) out[i].ok++; else out[i].fail++;
  }
  return out;
}

export function streakDays(activity: ActivityEntry[]): number {
  const days = new Set(activity.map((a) => new Date(a.at).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);

export function relTime(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} d`;
  return new Date(ts).toLocaleDateString('pt-BR');
}
