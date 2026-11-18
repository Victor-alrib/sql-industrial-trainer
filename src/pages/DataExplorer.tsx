import { ArrowRight, Table2, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ResultTable from '../components/ResultTable';
import { TableSchema } from '../components/TableDrawer';
import { RELATIONSHIPS, TABLE_DOCS, TABLE_ORDER } from '../db/seed';
import { sqlClient } from '../engine/client';
import type { ResultSet } from '../engine/types';
import { useSchema } from '../lib/schema';
import { useProgress } from '../store/progress';

export default function DataExplorer() {
  const { tables, ready } = useSchema();
  const [sel, setSel] = useState('equipamentos');
  const [sample, setSample] = useState<ResultSet | null>(null);
  const savePlayground = useProgress((s) => s.savePlayground);

  useEffect(() => {
    setSample(null);
    sqlClient.run(`SELECT * FROM ${sel} LIMIT 50`).then((r) => r.ok && setSample(r.result));
  }, [sel]);

  const info = tables.find((t) => t.name === sel);
  const rels = RELATIONSHIPS.filter(([a, b]) => a.startsWith(sel + '.') || b.startsWith(sel + '.'));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <header className="mb-6">
        <div className="section-title mb-1">Banco industrial</div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Explorador de tabelas</h1>
        <p className="mt-2 max-w-3xl muted">
          Planta fictícia com 4 linhas de produção, dados do 3º trimestre de 2026 (leituras de sensores em setembro). Os dados são gerados
          de forma determinística: todos os alunos veem exatamente o mesmo banco.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="card h-fit p-2">
          {TABLE_ORDER.map((name) => {
            const t = tables.find((x) => x.name === name);
            return (
              <button
                key={name}
                onClick={() => setSel(name)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${sel === name ? 'bg-amber-400/10 text-amber-700 dark:text-amber-300' : 'hover:bg-slate-100 dark:hover:bg-ink-800'}`}
              >
                <Table2 size={14} className="shrink-0 opacity-70" />
                <span className="flex-1 truncate font-mono text-[13px]">{name}</span>
                <span className="font-mono text-[11px] muted">{t ? t.rowCount.toLocaleString('pt-BR') : '…'}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-6">
          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-mono text-lg font-semibold text-slate-900 dark:text-white">{sel}</h2>
                <p className="mt-1 text-sm muted">{TABLE_DOCS[sel]}</p>
              </div>
              <Link to="/playground" onClick={() => savePlayground(`SELECT *\nFROM ${sel}\nLIMIT 20;`)} className="btn-secondary !py-1.5 text-xs">
                <Terminal size={14} /> Consultar no playground
              </Link>
            </div>
            <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_280px]">
              <div>
                <div className="section-title mb-2">Colunas {info && <span className="normal-case tracking-normal">· {info.rowCount.toLocaleString('pt-BR')} registros</span>}</div>
                {ready ? <TableSchema name={sel} /> : <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-ink-800" />}
              </div>
              <div>
                <div className="section-title mb-2">Relacionamentos</div>
                <ul className="space-y-1.5">
                  {rels.map(([a, b]) => (
                    <li key={a + b} className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                      <span className={a.startsWith(sel + '.') ? 'text-slate-800 dark:text-slate-100' : 'muted'}>{a}</span>
                      <ArrowRight size={11} className="text-sky-500" />
                      <button className={b.startsWith(sel + '.') ? 'text-slate-800 dark:text-slate-100' : 'text-sky-600 hover:underline dark:text-sky-400'} onClick={() => setSel(b.split('.')[0])}>{b}</button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs muted">Seta = chave estrangeira → chave primária. Clique para navegar.</p>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="section-title mb-3">Primeiras 50 linhas</div>
            {sample ? <ResultTable result={sample} maxHeight={480} dense /> : <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-ink-800" />}
          </section>
        </div>
      </div>
    </div>
  );
}
