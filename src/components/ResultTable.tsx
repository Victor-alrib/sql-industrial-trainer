import type { Cell, ResultSet } from '../engine/types';

function fmt(v: Cell) {
  if (v === null) return <span className="italic text-slate-400 dark:text-slate-500">NULL</span>;
  if (v instanceof Uint8Array) return `[blob ${v.length} bytes]`;
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return v;
}

export default function ResultTable({ result, maxHeight = 380, dense = false }: { result: ResultSet; maxHeight?: number; dense?: boolean }) {
  if (result.columns.length === 0) return null;
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 dark:border-ink-700" style={{ maxHeight }}>
      <table className="w-full border-collapse text-left font-mono text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-ink-800">
          <tr>
            <th className="w-10 border-b border-slate-200 px-2 py-2 text-right font-normal text-slate-400 dark:border-ink-700 dark:text-slate-500">#</th>
            {result.columns.map((c, i) => (
              <th key={i} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold text-slate-700 dark:border-ink-700 dark:text-slate-200">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.length === 0 && (
            <tr>
              <td colSpan={result.columns.length + 1} className="px-3 py-6 text-center font-sans text-sm muted">
                A consulta não retornou linhas.
              </td>
            </tr>
          )}
          {result.rows.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-slate-50/70 hover:bg-amber-50 dark:odd:bg-ink-900 dark:even:bg-ink-850 dark:hover:bg-ink-800">
              <td className="border-b border-slate-100 px-2 text-right text-slate-400 dark:border-ink-800 dark:text-slate-600">{i + 1}</td>
              {row.map((v, j) => (
                <td
                  key={j}
                  className={`whitespace-nowrap border-b border-slate-100 px-3 ${dense ? 'py-1' : 'py-1.5'} dark:border-ink-800 ${typeof v === 'number' ? 'text-right tabular-nums text-sky-700 dark:text-sky-300' : ''}`}
                >
                  {fmt(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
