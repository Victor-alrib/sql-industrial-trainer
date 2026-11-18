// Resume o banco gerado: contagem por tabela e distribuições principais.
import initSqlJs from 'sql.js';
import { buildIndustrialDatabase, TABLE_ORDER } from '../src/db/seed.ts';
const db = buildIndustrialDatabase(await initSqlJs());
const q = (title: string, s: string) => {
  const r = db.exec(s)[0];
  console.log(`\n### ${title}\n\n| ${r.columns.join(' | ')} |\n|${r.columns.map(() => '---').join('|')}|`);
  for (const v of r.values) console.log(`| ${v.join(' | ')} |`);
};
q('Registros por tabela', TABLE_ORDER.map((t) => `SELECT '${t}' AS tabela, COUNT(*) AS registros FROM ${t}`).join(' UNION ALL '));
q('Alarmes por severidade', `SELECT severidade, COUNT(*) AS qtd, SUM(reconhecido) AS reconhecidos FROM alarmes GROUP BY 1 ORDER BY 2 DESC`);
q('Ordens por tipo e status', `SELECT tipo, status, COUNT(*) AS qtd, ROUND(SUM(custo),2) AS custo FROM ordens_manutencao GROUP BY 1,2`);
q('Eventos por tipo', `SELECT tipo, COUNT(*) AS qtd, SUM(duracao_min) AS minutos FROM eventos_operacionais GROUP BY 1`);
