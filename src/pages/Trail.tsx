import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DifficultyBadge, StatusIcon } from '../components/Badges';
import { exercisesOfModule } from '../content/exercises';
import { MODULES } from '../content/modules';
import { moduleStats, overallStats } from '../lib/stats';
import { useProgress } from '../store/progress';

export default function Trail() {
  const prog = useProgress((s) => s.exercises);
  const activity = useProgress((s) => s.activity);
  const o = overallStats(prog, activity);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      <header className="mb-8">
        <div className="section-title mb-1">Trilha de aprendizagem</div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Do SELECT ao relatório de confiabilidade</h1>
        <p className="mt-2 max-w-2xl muted">
          Dez módulos, {o.total} problemas reais de chão de fábrica. Cada módulo traz só uma cola rápida de sintaxe — o aprendizado vem de resolver.
        </p>
      </header>

      <ol className="relative space-y-4 border-l border-dashed border-slate-300 pl-6 dark:border-ink-600">
        {MODULES.map((m) => {
          const st = moduleStats(m.id, prog);
          const exs = exercisesOfModule(m.id);
          const isNext = o.next?.moduleId === m.id;
          return (
            <li key={m.id} className="relative">
              <span
                className={`absolute -left-[37px] top-5 flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[11px] font-semibold ${
                  st.completed
                    ? 'border-emerald-400 bg-emerald-400 text-white'
                    : isNext
                      ? 'border-amber-400 bg-amber-400 text-ink-950'
                      : 'border-slate-300 bg-white text-slate-500 dark:border-ink-600 dark:bg-ink-900'
                }`}
              >
                {m.id}
              </span>
              <div className={`card overflow-hidden ${isNext ? 'ring-1 ring-amber-400/50' : ''}`}>
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900 dark:text-white">{m.title}</h2>
                      {isNext && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Continue aqui</span>}
                      {st.completed && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Concluído</span>}
                    </div>
                    <p className="mt-0.5 text-sm muted">{m.tagline}</p>
                  </div>
                  <div className="w-36">
                    <div className="mb-1 flex justify-between text-xs muted"><span>{st.solved}/{st.total}</span><span>{Math.round((st.solved / st.total) * 100)}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700">
                      <div className={`h-full rounded-full ${st.completed ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${(st.solved / st.total) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-ink-800 dark:border-ink-800">
                  {exs.map((ex) => {
                    const status = prog[ex.id]?.status ?? 'new';
                    return (
                      <li key={ex.id}>
                        <Link to={`/exercicio/${ex.id}`} className="group flex items-center gap-3 px-5 py-2.5 transition hover:bg-slate-50 dark:hover:bg-ink-850">
                          <StatusIcon status={status} size={16} />
                          <span className="w-9 font-mono text-xs muted">{ex.id}</span>
                          <span className="flex-1 truncate text-sm text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                            {ex.finalChallenge && <Trophy size={13} className="mr-1.5 inline text-amber-500" />}
                            {ex.title}
                          </span>
                          <DifficultyBadge d={ex.difficulty} />
                          <ArrowRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500 dark:text-ink-600" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
