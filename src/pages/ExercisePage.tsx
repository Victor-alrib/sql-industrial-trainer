import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Eye, History, Lightbulb, Loader2, Lock,
  Play, RotateCcw, ShieldCheck, Table2, Target, Trophy, X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DifficultyBadge, StatusIcon } from '../components/Badges';
import { ErrorFeedback, InfoFeedback, VerdictFeedback } from '../components/Feedback';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import TableDrawer from '../components/TableDrawer';
import { EXERCISES, exerciseById } from '../content/exercises';
import { MODULES } from '../content/modules';
import { sqlClient } from '../engine/client';
import { explainError } from '../engine/errors';
import type { RunOutcome, Verdict } from '../engine/types';
import { useSchema } from '../lib/schema';
import { canRevealSolution, MIN_FAILS_TO_REVEAL, relTime } from '../lib/stats';
import { emptyProgress, useProgress } from '../store/progress';

const STARTER = '-- Escreva sua consulta abaixo e pressione Ctrl+Enter para executar\n\n';

interface Outcome {
  kind: 'run' | 'check';
  run: RunOutcome;
  verdict: Verdict | null;
  conceptNote: string | null;
}

export default function ExercisePage() {
  const { id = '' } = useParams();
  const ex = exerciseById(id);
  if (!ex) {
    return (
      <div className="p-10">
        <p className="muted">Exercício não encontrado.</p>
        <Link to="/trilha" className="btn-secondary mt-4">Voltar para a trilha</Link>
      </div>
    );
  }
  return <ExerciseView key={ex.id} id={ex.id} />;
}

function ExerciseView({ id }: { id: string }) {
  const ex = exerciseById(id)!;
  const mod = MODULES.find((m) => m.id === ex.moduleId)!;
  const navigate = useNavigate();
  const schema = useSchema();

  const p = useProgress((s) => s.exercises[id]) ?? emptyProgress();
  const { saveDraft, recordRun, recordCheck, revealHint, revealSolution } = useProgress.getState();

  const [sql, setSql] = useState(() => p.draft || STARTER);
  const [busy, setBusy] = useState<null | 'run' | 'check'>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [tab, setTab] = useState<'result' | 'history'>('result');
  const [drawer, setDrawer] = useState<string | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();

  const idx = EXERCISES.findIndex((e) => e.id === id);
  const prev = EXERCISES[idx - 1];
  const next = EXERCISES[idx + 1];

  const onChange = (v: string) => {
    setSql(v);
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => saveDraft(id, v), 400);
  };
  useEffect(() => () => clearTimeout(draftTimer.current), []);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy('run');
    const r = await sqlClient.run(sql);
    recordRun(id, { sql, ok: r.ok, rows: r.ok ? r.totalRows : undefined, message: r.ok ? undefined : r.error });
    setOutcome({ kind: 'run', run: r, verdict: null, conceptNote: null });
    setTab('result');
    setBusy(null);
  }, [busy, sql, id, recordRun]);

  const check = useCallback(async () => {
    if (busy) return;
    setBusy('check');
    const res = await sqlClient.validate({ exerciseId: ex.id, userSql: sql, solutionSql: ex.solution, options: ex.options ?? {} });
    const ok = !!res.verdict?.correct;
    recordCheck(id, {
      sql, ok,
      code: res.run.ok ? res.verdict?.code : 'error',
      message: res.run.ok ? res.verdict?.title : res.run.error,
      rows: res.run.ok ? res.run.totalRows : undefined,
    });
    const conceptNote = ok && ex.concept && !ex.concept.pattern.test(sql) ? ex.concept.message : null;
    setOutcome({ kind: 'check', run: res.run, verdict: res.verdict, conceptNote });
    setTab('result');
    setBusy(null);
  }, [busy, sql, ex, id, recordCheck]);

  const retry = () => {
    setSql(STARTER);
    saveDraft(id, STARTER);
    setOutcome(null);
  };

  const errorInfo = useMemo(
    () => (outcome && !outcome.run.ok ? explainError(outcome.run.error, schema.tableNames, schema.columnNames) : null),
    [outcome, schema.tableNames, schema.columnNames],
  );

  const solved = p.status === 'solved';
  const revealAllowed = canRevealSolution(p);
  const showSolution = p.solutionRevealed || solved;

  return (
    <div className="grid min-h-screen lg:h-screen lg:grid-cols-[minmax(360px,440px)_1fr]">
      {/* ------------------------------------------------ painel do problema */}
      <section className="border-b border-slate-200 dark:border-ink-800 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="space-y-6 px-5 py-6 lg:px-6">
          <div className="flex items-center justify-between gap-2 text-xs">
            <Link to="/trilha" className="inline-flex items-center gap-1 muted hover:text-amber-600 dark:hover:text-amber-400">
              <ArrowLeft size={13} /> Módulo {mod.id} · {mod.title}
            </Link>
            <div className="flex gap-1">
              <button className="btn-ghost !p-1.5" disabled={!prev} onClick={() => prev && navigate(`/exercicio/${prev.id}`)} aria-label="Exercício anterior"><ArrowLeft size={15} /></button>
              <button className="btn-ghost !p-1.5" disabled={!next} onClick={() => next && navigate(`/exercicio/${next.id}`)} aria-label="Próximo exercício"><ArrowRight size={15} /></button>
            </div>
          </div>

          <header>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-amber-600 dark:text-amber-400">EX {ex.id}</span>
              <DifficultyBadge d={ex.difficulty} />
              {ex.finalChallenge && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300"><Trophy size={12} /> Desafio final</span>}
              <span className="ml-auto flex items-center gap-1.5 text-xs muted"><StatusIcon status={p.status} size={15} />{solved ? 'Resolvido' : p.status === 'attempted' ? 'Em andamento' : 'Novo'}</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{ex.title}</h1>
          </header>

          <div>
            <div className="section-title mb-2">Contexto</div>
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-300">{ex.context}</p>
          </div>

          <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-400/25 dark:bg-amber-400/[0.06]">
            <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300"><Target size={15} /> Objetivo</div>
            <p className="text-[14.5px] leading-relaxed text-slate-800 dark:text-slate-100">{ex.objective}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs muted">Colunas esperadas:</span>
              {ex.expectedColumns.map((c) => <span key={c} className="chip">{c}</span>)}
            </div>
            {ex.options?.orderMatters && <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/70">A ordem das linhas faz parte da resposta.</p>}
          </div>

          <div>
            <div className="section-title mb-2">Tabelas disponíveis</div>
            <div className="flex flex-wrap gap-2">
              {ex.tables.map((t) => (
                <button key={t} onClick={() => setDrawer(t)} className="chip cursor-pointer transition hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                  <Table2 size={12} /> {t}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs muted">Clique para ver colunas e uma amostra dos dados.</p>
          </div>

          <details className="group card-muted">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium">
              <BookOpen size={15} className="text-sky-500" /> Cola rápida: {mod.conceptLabel}
              <ChevronRight size={15} className="ml-auto transition group-open:rotate-90" />
            </summary>
            <pre className="overflow-x-auto border-t border-slate-200 px-4 py-3 text-xs leading-relaxed text-slate-700 dark:border-ink-700 dark:text-slate-300">{mod.cheatsheet}</pre>
          </details>

          {/* Dicas progressivas */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="section-title">Dicas</span>
              <span className="text-xs muted">{p.hintsUsed}/{ex.hints.length} usadas</span>
            </div>
            <div className="space-y-2">
              {ex.hints.slice(0, p.hintsUsed).map((h, i) => (
                <div key={i} className="animate-pop rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm dark:border-sky-500/20 dark:bg-sky-500/[0.07]">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">Dica {i + 1}</div>
                  {i === ex.hints.length - 1 && h.includes('___')
                    ? <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-200">{h}</pre>
                    : <p className="text-slate-800 dark:text-slate-200">{h}</p>}
                </div>
              ))}
              {p.hintsUsed < ex.hints.length && (
                <button className="btn-secondary w-full" onClick={() => revealHint(id, p.hintsUsed + 1)}>
                  <Lightbulb size={15} className="text-sky-500" />
                  {p.hintsUsed === 0 ? 'Mostrar primeira dica' : `Mostrar dica ${p.hintsUsed + 1}`}
                  {p.hintsUsed === ex.hints.length - 1 && <span className="text-xs muted">(esqueleto da consulta)</span>}
                </button>
              )}
            </div>
          </div>

          {/* Solução */}
          <div>
            <div className="section-title mb-2">Solução de referência</div>
            {showSolution ? (
              <div className="space-y-2">
                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 dark:border-ink-700 dark:bg-ink-850 dark:text-slate-200">{ex.solution}</pre>
                <p className="text-xs muted">Esta é apenas uma das consultas possíveis. A validação compara resultados, então outras abordagens corretas também são aceitas.</p>
              </div>
            ) : revealAllowed ? (
              confirmReveal ? (
                <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-ink-700">
                  <p>Ver a solução marcará este exercício para <b>revisão</b> no dashboard. Continuar?</p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-primary !py-1.5" onClick={() => { revealSolution(id); setConfirmReveal(false); }}><Eye size={14} /> Ver solução</button>
                    <button className="btn-ghost !py-1.5" onClick={() => setConfirmReveal(false)}><X size={14} /> Cancelar</button>
                  </div>
                </div>
              ) : (
                <button className="btn-secondary w-full" onClick={() => setConfirmReveal(true)}><Eye size={15} /> Revelar solução</button>
              )
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm muted dark:border-ink-600">
                <Lock size={16} className="shrink-0" />
                <span>Liberada após {MIN_FAILS_TO_REVEAL} verificações sem sucesso ({Math.min(p.failedChecks, MIN_FAILS_TO_REVEAL)}/{MIN_FAILS_TO_REVEAL}). Tente primeiro — use as dicas!</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ editor + resultado */}
      <section className="flex min-w-0 flex-col lg:overflow-y-auto">
        <div className="space-y-4 p-4 lg:p-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-ink-700">
              <span className="flex items-center gap-2 font-mono text-xs muted">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> sqlite · sandbox somente leitura
              </span>
              <button className="btn-ghost !px-2 !py-1 text-xs" onClick={retry} title="Limpar o editor e tentar novamente">
                <RotateCcw size={13} /> Tentar novamente
              </button>
            </div>
            <SqlEditor value={sql} onChange={onChange} onRun={run} onCheck={check} minHeight="200px" />
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-ink-700 dark:bg-ink-850/60">
              <button className="btn-secondary" onClick={run} disabled={!!busy}>
                {busy === 'run' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Executar
                <span className="kbd hidden sm:inline">Ctrl ↵</span>
              </button>
              <button className="btn-primary" onClick={check} disabled={!!busy}>
                {busy === 'check' ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Verificar resposta
                <span className="kbd hidden !border-ink-950/20 !bg-ink-950/10 !text-ink-950/70 sm:inline">Ctrl ⇧ ↵</span>
              </button>
              <span className="ml-auto text-xs muted">
                {p.checks > 0 && <>{p.checks} verificaç{p.checks === 1 ? 'ão' : 'ões'} · </>}{p.runs} execuç{p.runs === 1 ? 'ão' : 'ões'}
              </span>
            </div>
          </div>

          {/* feedback */}
          {outcome && !outcome.run.ok && errorInfo && <ErrorFeedback e={errorInfo} />}
          {outcome?.verdict && (
            <VerdictFeedback v={outcome.verdict} extra={outcome.conceptNote}>
              {outcome.verdict.correct && (
                <>
                  <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm"><b>Na prática:</b> {ex.takeaway}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {next ? (
                      <button className="btn-success !py-1.5" onClick={() => navigate(`/exercicio/${next.id}`)}>
                        Próximo exercício <ArrowRight size={15} />
                      </button>
                    ) : (
                      <Link to="/" className="btn-success !py-1.5"><Trophy size={15} /> Ver meu dashboard</Link>
                    )}
                  </div>
                </>
              )}
              {!outcome.verdict.correct && p.failedChecks >= MIN_FAILS_TO_REVEAL && !p.solutionRevealed && (
                <p className="mt-2 text-xs opacity-80">A solução de referência já pode ser revelada no painel à esquerda.</p>
              )}
            </VerdictFeedback>
          )}
          {outcome?.kind === 'run' && outcome.run.ok && !outcome.run.result && (
            <InfoFeedback title="Consulta executada">
              <p className="mt-1 text-sm">Nenhum conjunto de resultados foi produzido. Use SELECT para consultar dados.</p>
            </InfoFeedback>
          )}

          {/* resultado / histórico */}
          <div className="card">
            <div className="flex items-center gap-1 border-b border-slate-200 px-2 dark:border-ink-700">
              {([
                ['result', 'Resultado', Table2],
                ['history', `Histórico (${p.history.length})`, History],
              ] as const).map(([k, label, Icon]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${tab === k ? 'border-amber-400 text-slate-900 dark:text-white' : 'border-transparent muted hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
              {tab === 'result' && outcome?.run.ok && outcome.run.result && (
                <span className="ml-auto pr-3 font-mono text-xs muted">
                  {outcome.run.totalRows} linha{outcome.run.totalRows === 1 ? '' : 's'} · {outcome.run.elapsedMs.toFixed(0)} ms
                  {outcome.run.truncated && ' · exibindo 1000'}
                </span>
              )}
            </div>
            <div className="p-3">
              {tab === 'result' ? (
                outcome?.run.ok && outcome.run.result ? (
                  <ResultTable result={outcome.run.result} maxHeight={460} />
                ) : (
                  <div className="grid-bg flex h-40 flex-col items-center justify-center rounded-lg text-center text-sm muted">
                    <Play size={20} className="mb-2 opacity-50" />
                    Execute uma consulta para ver o resultado aqui.
                  </div>
                )
              ) : (
                <HistoryList items={p.history} onRestore={(s) => { onChange(s); setTab('result'); }} />
              )}
            </div>
          </div>
        </div>
      </section>

      <TableDrawer name={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

function HistoryList({ items, onRestore }: { items: { at: number; sql: string; kind: 'run' | 'check'; ok: boolean; message?: string; rows?: number }[]; onRestore: (sql: string) => void }) {
  if (!items.length) return <p className="py-8 text-center text-sm muted">Nenhuma consulta executada neste exercício ainda.</p>;
  return (
    <ul className="max-h-[460px] space-y-2 overflow-auto">
      {items.map((h, i) => (
        <li key={i} className="group rounded-lg border border-slate-200 p-3 dark:border-ink-700">
          <div className="mb-1.5 flex items-center gap-2 text-xs">
            {h.kind === 'check' ? (
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${h.ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
                {h.ok ? <Check size={11} /> : <X size={11} />} Verificação
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${h.ok ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'}`}>
                <Play size={10} /> Execução
              </span>
            )}
            <span className="truncate muted">{h.message ?? (h.rows !== undefined ? `${h.rows} linhas` : '')}</span>
            <span className="ml-auto shrink-0 muted">{relTime(h.at)}</span>
          </div>
          <pre className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{h.sql.replace(STARTER, '').trim()}</pre>
          <button className="mt-2 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400" onClick={() => onRestore(h.sql)}>
            Restaurar no editor
          </button>
        </li>
      ))}
    </ul>
  );
}
