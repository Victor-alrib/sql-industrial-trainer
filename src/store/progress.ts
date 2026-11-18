import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Attempt {
  at: number;
  sql: string;
  kind: 'run' | 'check';
  /** run: executou sem erro | check: resposta correta */
  ok: boolean;
  code?: string;
  message?: string;
  rows?: number;
}

export interface ExerciseProgress {
  status: 'new' | 'attempted' | 'solved';
  checks: number;
  failedChecks: number;
  runs: number;
  hintsUsed: number;
  solutionRevealed: boolean;
  /** Solução vista antes de resolver: o exercício não conta como “resolvido por conta própria”. */
  revealedBeforeSolve: boolean;
  solvedAt?: number;
  firstTry?: boolean;
  draft: string;
  history: Attempt[];
}

export interface ActivityEntry {
  at: number;
  exerciseId: string;
  ok: boolean;
}

interface State {
  exercises: Record<string, ExerciseProgress>;
  activity: ActivityEntry[];
  theme: 'dark' | 'light';
  playgroundDraft: string;
  playgroundHistory: Attempt[];
  lastExerciseId?: string;

  get(id: string): ExerciseProgress;
  saveDraft(id: string, sql: string): void;
  recordRun(id: string, a: Omit<Attempt, 'at' | 'kind'>): void;
  recordCheck(id: string, a: Omit<Attempt, 'at' | 'kind'>): void;
  revealHint(id: string, n: number): void;
  revealSolution(id: string): void;
  resetExercise(id: string): void;
  resetAll(): void;
  importState(json: string): boolean;
  setTheme(t: 'dark' | 'light'): void;
  savePlayground(sql: string): void;
  recordPlayground(a: Omit<Attempt, 'at' | 'kind'>): void;
}

export const emptyProgress = (): ExerciseProgress => ({
  status: 'new', checks: 0, failedChecks: 0, runs: 0, hintsUsed: 0,
  solutionRevealed: false, revealedBeforeSolve: false, draft: '', history: [],
});

const HISTORY_LIMIT = 30;
const ACTIVITY_LIMIT = 2000;

export const useProgress = create<State>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (p: ExerciseProgress) => Partial<ExerciseProgress>) =>
        set((s) => {
          const cur = s.exercises[id] ?? emptyProgress();
          return { exercises: { ...s.exercises, [id]: { ...cur, ...fn(cur) } }, lastExerciseId: id };
        });

      return {
        exercises: {},
        activity: [],
        theme: 'dark',
        playgroundDraft: '',
        playgroundHistory: [],

        get: (id) => get().exercises[id] ?? emptyProgress(),

        saveDraft: (id, sql) => patch(id, () => ({ draft: sql })),

        recordRun: (id, a) =>
          patch(id, (p) => ({
            runs: p.runs + 1,
            status: p.status === 'new' ? 'attempted' : p.status,
            history: [{ ...a, at: Date.now(), kind: 'run' as const }, ...p.history].slice(0, HISTORY_LIMIT),
          })),

        recordCheck: (id, a) => {
          patch(id, (p) => {
            const solvedNow = a.ok && p.status !== 'solved';
            return {
              checks: p.checks + 1,
              failedChecks: p.failedChecks + (a.ok ? 0 : 1),
              status: a.ok ? 'solved' : p.status === 'solved' ? 'solved' : 'attempted',
              solvedAt: solvedNow ? Date.now() : p.solvedAt,
              firstTry: solvedNow ? p.failedChecks === 0 : p.firstTry,
              history: [{ ...a, at: Date.now(), kind: 'check' as const }, ...p.history].slice(0, HISTORY_LIMIT),
            };
          });
          set((s) => ({ activity: [...s.activity, { at: Date.now(), exerciseId: id, ok: a.ok }].slice(-ACTIVITY_LIMIT) }));
        },

        revealHint: (id, n) => patch(id, (p) => ({ hintsUsed: Math.max(p.hintsUsed, n) })),

        revealSolution: (id) =>
          patch(id, (p) => ({ solutionRevealed: true, revealedBeforeSolve: p.revealedBeforeSolve || p.status !== 'solved' })),

        resetExercise: (id) => set((s) => {
          const { [id]: _, ...rest } = s.exercises;
          void _;
          return { exercises: rest };
        }),

        resetAll: () => set({ exercises: {}, activity: [], playgroundHistory: [], playgroundDraft: '', lastExerciseId: undefined }),

        importState: (json) => {
          try {
            const data = JSON.parse(json);
            if (!data || typeof data.exercises !== 'object' || !Array.isArray(data.activity)) return false;
            set({ exercises: data.exercises, activity: data.activity });
            return true;
          } catch {
            return false;
          }
        },

        setTheme: (t) => {
          try { localStorage.setItem('sit-theme', t); } catch { /* ignore */ }
          document.documentElement.classList.toggle('dark', t === 'dark');
          set({ theme: t });
        },

        savePlayground: (sql) => set({ playgroundDraft: sql }),
        recordPlayground: (a) =>
          set((s) => ({ playgroundHistory: [{ ...a, at: Date.now(), kind: 'run' as const }, ...s.playgroundHistory].slice(0, HISTORY_LIMIT) })),
      };
    },
    {
      name: 'sql-industrial-trainer:v1',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          localStorage.setItem('__sit_probe', '1');
          localStorage.removeItem('__sit_probe');
          return localStorage;
        } catch {
          const mem = new Map<string, string>();
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
        }
      }),
      partialize: (s) => ({
        exercises: s.exercises, activity: s.activity, theme: s.theme,
        playgroundDraft: s.playgroundDraft, playgroundHistory: s.playgroundHistory, lastExerciseId: s.lastExerciseId,
      }),
    },
  ),
);
