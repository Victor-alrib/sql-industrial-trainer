import { Loader2, Play, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ErrorFeedback, InfoFeedback } from '../components/Feedback';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import { sqlClient } from '../engine/client';
import { explainError } from '../engine/errors';
import type { RunOutcome } from '../engine/types';
import { useSchema } from '../lib/schema';
import { relTime } from '../lib/stats';
import { useProgress } from '../store/progress';

const EXAMPLES: [string, string][] = [
  ['Visão geral de alarmes', `SELECT e.tag, a.severidade, COUNT(*) AS qtd
FROM alarmes a
JOIN equipamentos e ON e.id = a.equipamento_id
GROUP BY e.tag, a.severidade
ORDER BY qtd DESC;`],
  ['Tendência diária do spindle', `SELECT date(data_hora) AS dia, ROUND(AVG(valor), 1) AS temp_media, MAX(valor) AS pico
FROM leituras
WHERE sensor_id = 10
GROUP BY dia
ORDER BY dia;`],
  ['Paradas por turno', `SELECT CASE
         WHEN strftime('%H', data_inicio) BETWEEN '06' AND '13' THEN 'A'
         WHEN strftime('%H', data_inicio) BETWEEN '14' AND '21' THEN 'B'
         ELSE 'C' END AS turno,
       tipo, COUNT(*) AS eventos, SUM(duracao_min) AS minutos
FROM eventos_operacionais
GROUP BY turno, tipo
ORDER BY turno, minutos DESC;`],
];

const DEFAULT = `-- Playground livre: explore o banco industrial sem validação.\nSELECT * FROM equipamentos;\n`;

export default function Playground() {
  const draft = useProgress((s) => s.playgroundDraft);
  const history = useProgress((s) => s.playgroundHistory);
  const savePlayground = useProgress((s) => s.savePlayground);
  const recordPlayground = useProgress((s) => s.recordPlayground);
  const schema = useSchema();
  const [sql, setSql] = useState(draft || DEFAULT);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<RunOutcome | null>(null);

  const onChange = (v: string) => { setSql(v); savePlayground(v); };

  const run = useCallback(async () => {
    setBusy(true);
    const r = await sqlClient.run(sql);
    recordPlayground({ sql, ok: r.ok, rows: r.ok ? r.totalRows : undefined, message: r.ok ? undefined : r.error });
    setOut(r);
    setBusy(false);
  }, [sql, recordPlayground]);

  const err = useMemo(() => (out && !out.ok ? explainError(out.error, schema.tableNames, schema.columnNames) : null), [out, schema]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <header className="mb-6">
        <div className="section-title mb-1">Playground</div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Consultas livres</h1>
        <p className="mt-2 muted">Teste ideias, investigue os dados e prepare suas respostas. Nada aqui afeta seu progresso.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <div className="card overflow-hidden">
            <SqlEditor value={sql} onChange={onChange} onRun={run} minHeight="220px" />
            <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-ink-700 dark:bg-ink-850/60">
              <button className="btn-primary" onClick={run} disabled={busy}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Executar <span className="kbd !border-ink-950/20 !bg-ink-950/10 !text-ink-950/70">Ctrl ↵</span>
              </button>
              <button className="btn-ghost" onClick={() => onChange('')}><Trash2 size={14} /> Limpar</button>
              {out?.ok && out.result && (
                <span className="ml-auto font-mono text-xs muted">{out.totalRows} linhas · {out.elapsedMs.toFixed(0)} ms{out.truncated && ' · exibindo 1000'}</span>
              )}
            </div>
          </div>
          {err && <ErrorFeedback e={err} />}
          {out?.ok && !out.result && <InfoFeedback title="Consulta executada"><p className="mt-1 text-sm">Nenhum conjunto de resultados foi produzido.</p></InfoFeedback>}
          {out?.ok && out.result && <div className="card p-3"><ResultTable result={out.result} maxHeight={520} /></div>}
        </div>

        <aside className="space-y-6">
          <section className="card p-4">
            <div className="section-title mb-3 flex items-center gap-1.5"><Sparkles size={12} /> Exemplos</div>
            <ul className="space-y-1">
              {EXAMPLES.map(([t, q]) => (
                <li key={t}><button className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-ink-800" onClick={() => onChange(q)}>{t}</button></li>
              ))}
            </ul>
          </section>
          <section className="card p-4">
            <div className="section-title mb-3">Histórico</div>
            {history.length === 0 ? <p className="text-sm muted">Vazio.</p> : (
              <ul className="max-h-[420px] space-y-2 overflow-auto">
                {history.map((h, i) => (
                  <li key={i}>
                    <button className="w-full rounded-md border border-slate-200 p-2 text-left hover:border-amber-400/60 dark:border-ink-700" onClick={() => onChange(h.sql)}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className={h.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{h.ok ? `${h.rows ?? 0} linhas` : 'erro'}</span>
                        <span className="muted">{relTime(h.at)}</span>
                      </div>
                      <pre className="line-clamp-2 whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-400">{h.sql.trim()}</pre>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
