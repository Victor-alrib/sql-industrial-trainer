import {
  AlertTriangle, ArrowRight, Award, CheckCircle2, Download, Flame, Layers, RotateCcw, Target, Trophy, Upload, XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DifficultyBadge } from '../components/Badges';
import { EXERCISES, exerciseById } from '../content/exercises';
import { MODULES } from '../content/modules';
import { activityByDay, overallStats, pct, relTime, streakDays } from '../lib/stats';
import { useProgress } from '../store/progress';

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-medium muted">{icon}{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</div>
      {sub && <div className="mt-1 text-xs muted">{sub}</div>}
    </div>
  );
}

function ActivityChart({ data }: { data: ReturnType<typeof activityByDay> }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.ok + d.fail));
  const H = 140;
  const total = data.reduce((a, d) => a + d.ok + d.fail, 0);
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Verificações corretas</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Verificações incorretas</span>
        <span className="ml-auto">{total} nos últimos 14 dias</span>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200 dark:border-ink-700" style={{ height: H }}>
          <span className="absolute -top-2 right-0 bg-white pl-1 font-mono text-[10px] muted dark:bg-ink-900">{max}</span>
        </div>
        <div className="flex items-end gap-1.5 border-b border-slate-300 dark:border-ink-600" style={{ height: H }}>
          {data.map((d, i) => {
            const okH = (d.ok / max) * H;
            const failH = (d.fail / max) * H;
            return (
              <div
                key={d.key}
                className="relative flex h-full flex-1 cursor-default flex-col justify-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {hover === i && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-lg dark:border-ink-600 dark:bg-ink-800">
                    <div className="font-medium">{d.label}</div>
                    <div className="muted">{d.ok} corretas · {d.fail} incorretas</div>
                  </div>
                )}
                <div className="mx-auto flex w-full max-w-[22px] flex-col justify-end gap-[2px]">
                  {d.fail > 0 && <div className="rounded-t-[4px] bg-amber-400" style={{ height: failH }} />}
                  {d.ok > 0 && <div className={`bg-emerald-500 ${d.fail ? '' : 'rounded-t-[4px]'}`} style={{ height: okH }} />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {data.map((d, i) => (
            <div key={d.key} className="flex-1 text-center font-mono text-[10px] muted">{i % 2 === (data.length - 1) % 2 ? d.label : ''}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const prog = useProgress((s) => s.exercises);
  const activity = useProgress((s) => s.activity);
  const resetAll = useProgress((s) => s.resetAll);
  const importState = useProgress((s) => s.importState);
  const o = overallStats(prog, activity);
  const days = activityByDay(activity);
  const streak = streakDays(activity);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const final = EXERCISES.find((e) => e.finalChallenge)!;
  const recent = [...activity].reverse().slice(0, 10);
  const fresh = activity.length === 0 && Object.keys(prog).length === 0;

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'sql-industrial-trainer', exportedAt: new Date().toISOString(), exercises: prog, activity }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sql-industrial-trainer-progresso.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const onImport = async (f: File) => {
    const ok = importState(await f.text());
    setMsg(ok ? 'Progresso importado com sucesso.' : 'Arquivo inválido.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 lg:px-8">
      {/* hero */}
      <section className="card grid-bg relative overflow-hidden p-6 lg:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="section-title mb-2 !text-amber-600 dark:!text-amber-400">Indústria Vale do Aço · Unidade Contagem</div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
              {fresh ? 'Aprenda SQL resolvendo problemas da fábrica.' : 'Bem-vindo de volta ao turno.'}
            </h1>
            <p className="mt-2 muted">
              {fresh
                ? '16 equipamentos, 27 sensores e 4.860 leituras esperando suas consultas. Sem aulas longas: contexto, objetivo, editor e validação automática.'
                : o.next
                  ? 'Seu próximo problema já está na bancada.'
                  : 'Você concluiu todos os exercícios. Excelente trabalho!'}
            </p>
          </div>
          {o.next && (
            <Link to={`/exercicio/${o.next.id}`} className="card group flex w-full max-w-sm items-center gap-4 p-4 transition hover:border-amber-400/60">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-400 font-mono text-sm font-bold text-ink-950">{o.next.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs muted">{fresh ? 'Comece por aqui' : 'Continuar'} · {MODULES.find((m) => m.id === o.next!.moduleId)!.title}</div>
                <div className="truncate font-medium text-slate-900 dark:text-white">{o.next.title}</div>
                <DifficultyBadge d={o.next.difficulty} />
              </div>
              <ArrowRight size={18} className="text-amber-500 transition group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={<Layers size={14} />} label="Módulos concluídos" value={`${o.modulesCompleted}/${MODULES.length}`} />
        <Stat icon={<CheckCircle2 size={14} />} label="Exercícios resolvidos" value={`${o.solved}/${o.total}`} sub={`${Math.round((o.solved / o.total) * 100)}% da trilha`} />
        <Stat icon={<Target size={14} />} label="Taxa de acertos" value={pct(o.accuracy)} sub={o.checks ? `${o.correct} de ${o.checks} verificações` : 'nenhuma verificação ainda'} />
        <Stat icon={<Award size={14} />} label="De primeira" value={String(o.firstTry)} sub="resolvidos sem erro" />
        <Stat icon={<Flame size={14} />} label="Sequência" value={`${streak} d`} sub="dias seguidos praticando" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* progresso por módulo */}
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Progresso por módulo</h2>
          <ul className="space-y-3">
            {o.modules.map((m) => {
              const mod = MODULES.find((x) => x.id === m.moduleId)!;
              return (
                <li key={m.moduleId} className="grid grid-cols-[1.5rem_1fr_3rem_3.5rem] items-center gap-3 text-sm">
                  <span className="font-mono text-xs muted">{String(m.moduleId).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <div className="mb-1 flex justify-between">
                      <Link to="/trilha" className="truncate hover:text-amber-600 dark:hover:text-amber-400">{mod.title}</Link>
                    </div>
                    <div className="flex h-1.5 gap-[2px]">
                      {Array.from({ length: m.total }).map((_, i) => (
                        <div key={i} className={`flex-1 rounded-full ${i < m.solved ? (m.completed ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200 dark:bg-ink-700'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-right font-mono text-xs">{m.solved}/{m.total}</span>
                  <span className="text-right font-mono text-xs muted" title="Taxa de acertos nas verificações do módulo">{pct(m.accuracy)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs muted">Última coluna: taxa de acertos nas verificações de cada módulo.</p>
        </section>

        {/* revisão */}
        <section className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <AlertTriangle size={16} className="text-amber-500" /> Conteúdos para revisar
          </h2>
          <p className="mb-4 text-xs muted">Exercícios com muitas tentativas, solução consultada ou todas as dicas usadas.</p>
          {o.reviewModules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm muted dark:border-ink-600">
              {o.checks === 0 ? 'Resolva alguns exercícios para receber recomendações.' : 'Nada pendente. Seus fundamentos estão sólidos!'}
            </div>
          ) : (
            <ul className="space-y-3">
              {o.reviewModules.map((m) => {
                const mod = MODULES.find((x) => x.id === m.moduleId)!;
                return (
                  <li key={m.moduleId} className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-3 dark:border-amber-400/20 dark:bg-amber-400/[0.05]">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{mod.title}</span>
                      <span className="font-mono text-xs muted">acertos {pct(m.accuracy)}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {m.review.map((r) => (
                        <li key={r.exercise.id}>
                          <Link to={`/exercicio/${r.exercise.id}`} className="flex items-baseline gap-2 text-xs hover:underline">
                            <span className="font-mono text-amber-700 dark:text-amber-400">{r.exercise.id}</span>
                            <span className="text-slate-700 dark:text-slate-300">{r.exercise.title}</span>
                            <span className="muted">— {r.reasons.join(', ')}</span>
                          </Link>
                        </li>
                      ))}
                      {m.review.length === 0 && <li className="text-xs muted">Taxa de acertos abaixo de 50% neste módulo.</li>}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Histórico de aprendizagem</h2>
          <ActivityChart data={days} />
          <div className="mt-6">
            <div className="section-title mb-2">Últimas verificações</div>
            {recent.length === 0 ? (
              <p className="text-sm muted">Nenhuma verificação registrada.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-ink-800">
                {recent.map((a, i) => {
                  const ex = exerciseById(a.exerciseId);
                  return (
                    <li key={i} className="flex items-center gap-3 py-2 text-sm">
                      {a.ok ? <CheckCircle2 size={15} className="text-emerald-500" /> : <XCircle size={15} className="text-amber-500" />}
                      <Link to={`/exercicio/${a.exerciseId}`} className="min-w-0 flex-1 truncate hover:text-amber-600 dark:hover:text-amber-400">
                        <span className="mr-2 font-mono text-xs muted">{a.exerciseId}</span>{ex?.title}
                      </Link>
                      <span className="text-xs muted">{a.ok ? 'correta' : 'incorreta'} · {relTime(a.at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className={`card relative overflow-hidden p-5 ${o.finalSolved ? 'border-emerald-400/50' : ''}`}>
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300"><Trophy size={16} /> Desafio final</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Relatório de confiabilidade</h3>
              <p className="mt-1 text-sm muted">Falhas, MTTR, MTBF, custo e alarmes críticos dos ativos de criticidade A — cinco tabelas, uma consulta.</p>
              <Link to={`/exercicio/${final.id}`} className={o.finalSolved ? 'btn-success mt-4' : 'btn-primary mt-4'}>
                {o.finalSolved ? <><CheckCircle2 size={15} /> Concluído — rever</> : <>Encarar o desafio <ArrowRight size={15} /></>}
              </Link>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Seus dados</h2>
            <p className="mb-4 text-xs muted">O progresso fica salvo neste navegador (localStorage). Exporte para levar a outro dispositivo.</p>
            <div className="flex flex-wrap gap-2">
              {import.meta.env.MODE !== 'single' && (
                <button className="btn-secondary !py-1.5 text-xs" onClick={exportData}><Download size={14} /> Exportar</button>
              )}
              <button className="btn-secondary !py-1.5 text-xs" onClick={() => fileRef.current?.click()}><Upload size={14} /> Importar</button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
              {confirmReset ? (
                <>
                  <button className="btn !py-1.5 text-xs bg-rose-500 text-white hover:bg-rose-400" onClick={() => { resetAll(); setConfirmReset(false); setMsg('Progresso reiniciado.'); }}>Confirmar</button>
                  <button className="btn-ghost !py-1.5 text-xs" onClick={() => setConfirmReset(false)}>Cancelar</button>
                </>
              ) : (
                <button className="btn-ghost !py-1.5 text-xs" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Reiniciar progresso</button>
              )}
            </div>
            {msg && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
