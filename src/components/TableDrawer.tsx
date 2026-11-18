import { KeyRound, Link2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TABLE_DOCS } from '../db/seed';
import { sqlClient } from '../engine/client';
import type { ResultSet } from '../engine/types';
import { useSchema } from '../lib/schema';
import ResultTable from './ResultTable';

export function TableSchema({ name }: { name: string }) {
  const { tables } = useSchema();
  const t = tables.find((x) => x.name === name);
  if (!t) return null;
  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-ink-800 dark:border-ink-700">
      {t.columns.map((c) => (
        <div key={c.name} className="flex items-center gap-3 px-3 py-1.5 text-xs">
          <span className="w-4">
            {c.pk ? <KeyRound size={12} className="text-amber-500" /> : c.fk ? <Link2 size={12} className="text-sky-500" /> : null}
          </span>
          <span className="font-mono font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
          <span className="font-mono text-[10px] uppercase text-slate-400">{c.type}</span>
          {c.fk && <span className="ml-auto font-mono text-[10px] text-sky-600 dark:text-sky-400">→ {c.fk}</span>}
          {!c.fk && c.notNull && !c.pk && <span className="ml-auto text-[10px] muted">obrigatório</span>}
        </div>
      ))}
    </div>
  );
}

export default function TableDrawer({ name, onClose }: { name: string | null; onClose: () => void }) {
  const [sample, setSample] = useState<ResultSet | null>(null);
  const { tables } = useSchema();
  const info = tables.find((t) => t.name === name);

  useEffect(() => {
    if (!name) return;
    setSample(null);
    sqlClient.run(`SELECT * FROM ${name} LIMIT 25`).then((r) => r.ok && setSample(r.result));
  }, [name]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!name) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Tabela ${name}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="animate-pop relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-ink-700">
          <div>
            <div className="section-title">Tabela</div>
            <h2 className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{name}</h2>
            <p className="mt-1 text-sm muted">{TABLE_DOCS[name]}</p>
          </div>
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-auto px-5 py-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="section-title">Colunas</span>
              {info && <span className="text-xs muted">{info.rowCount.toLocaleString('pt-BR')} registros</span>}
            </div>
            <TableSchema name={name} />
          </div>
          <div>
            <div className="section-title mb-2">Amostra (25 primeiras linhas)</div>
            {sample ? <ResultTable result={sample} maxHeight={420} dense /> : <div className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-ink-800" />}
          </div>
        </div>
      </div>
    </div>
  );
}
