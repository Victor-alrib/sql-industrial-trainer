import initSqlJs from 'sql.js';
import { EXERCISES } from '../src/content/exercises.ts';
import { createEngine } from '../src/engine/core.ts';
const eng = createEngine(await initSqlJs());
const only = process.argv.slice(2);
for (const ex of EXERCISES) {
  if (only.length && !only.includes(ex.id)) continue;
  const r = eng.run(ex.solution);
  if (!r.ok) { console.log(ex.id, 'ERRO', r.error); continue; }
  console.log(`\n## ${ex.id} ${ex.title} — ${r.totalRows} linhas`);
  console.log(r.result!.columns.join(' | '));
  for (const row of r.result!.rows.slice(0, 8)) console.log(row.join(' | '));
}
