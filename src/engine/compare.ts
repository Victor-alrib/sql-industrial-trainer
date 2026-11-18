/**
 * Validação semântica: compara o RESULTADO da consulta do aluno com o
 * resultado da consulta de referência, nunca o texto SQL.
 *
 * Regras de equivalência:
 *  - nomes/aliases das colunas são ignorados;
 *  - a ordem das colunas é livre (as colunas são casadas pelo conteúdo);
 *  - números são comparados com tolerância de 0,01 (ROUND(x, 2) ≡ x);
 *  - a ordem das linhas só importa quando o exercício pede ORDER BY, e
 *    empates nas chaves de ordenação são aceitos em qualquer ordem.
 */
import type { Cell, CompareOptions, ResultSet, Verdict } from './types';

const TOL = 0.0101;

function norm(v: Cell): number | string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Object.is(v, -0) ? 0 : v;
  if (v instanceof Uint8Array) return '[blob ' + v.length + ']';
  const s = String(v).trim();
  if (s !== '' && /^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function cellEq(a: Cell, b: Cell, tol = TOL): boolean {
  const x = norm(a);
  const y = norm(b);
  if (x === null || y === null) return x === y;
  if (typeof x === 'number' && typeof y === 'number') {
    return Math.abs(x - y) <= tol + 1e-9 * Math.max(Math.abs(x), Math.abs(y));
  }
  return x === y;
}

function cellKey(v: Cell): string {
  const x = norm(v);
  if (x === null) return '∅';
  if (typeof x === 'number') {
    const r = (Math.round(x * 100) / 100).toFixed(2);
    return 'n:' + (r === '-0.00' ? '0.00' : r);
  }
  return 's:' + x;
}

const rowKey = (row: Cell[]) => row.map(cellKey).join('␟');

/** Multiconjunto de linhas igual? Primeiro por chave exata, depois por casamento tolerante. */
function sameRows(exp: Cell[][], act: Cell[][], tol = TOL): boolean {
  if (exp.length !== act.length) return false;
  const counts = new Map<string, number>();
  for (const r of exp) counts.set(rowKey(r), (counts.get(rowKey(r)) ?? 0) + 1);
  let exact = true;
  for (const r of act) {
    const k = rowKey(r);
    const c = counts.get(k);
    if (!c) { exact = false; break; }
    counts.set(k, c - 1);
  }
  if (exact && tol <= TOL) return true;
  if (exp.length > 3000) return false;
  // casamento tolerante (lida com arredondamentos na fronteira de 0,005)
  const used = new Array(act.length).fill(false);
  for (const e of exp) {
    let found = -1;
    for (let i = 0; i < act.length; i++) {
      if (!used[i] && e.every((v, j) => cellEq(v, act[i][j], tol))) { found = i; break; }
    }
    if (found < 0) return false;
    used[found] = true;
  }
  return true;
}

function columnValues(rs: ResultSet, j: number): Cell[] {
  return rs.rows.map((r) => r[j]);
}

function sameColumn(a: Cell[], b: Cell[]): boolean {
  if (a.length !== b.length) return false;
  const ka = a.map(cellKey).sort();
  const kb = b.map(cellKey).sort();
  if (ka.every((k, i) => k === kb[i])) return true;
  return sameRows(a.map((v) => [v]), b.map((v) => [v]));
}

/** Gera mapeamentos coluna esperada → coluna do aluno compatíveis pelo conteúdo. */
function columnMappings(exp: ResultSet, act: ResultSet, limit = 64): number[][] {
  const n = exp.columns.length;
  const cand: number[][] = [];
  for (let j = 0; j < n; j++) {
    const ev = columnValues(exp, j);
    const list: number[] = [];
    // prioriza a mesma posição
    const order = [j, ...act.columns.map((_, k) => k).filter((k) => k !== j)];
    for (const k of order) if (k < act.columns.length && sameColumn(ev, columnValues(act, k))) list.push(k);
    cand.push(list);
  }
  const out: number[][] = [];
  const cur: number[] = [];
  const used = new Set<number>();
  const bt = (j: number) => {
    if (out.length >= limit) return;
    if (j === n) { out.push([...cur]); return; }
    for (const k of cand[j]) {
      if (used.has(k)) continue;
      used.add(k); cur.push(k);
      bt(j + 1);
      cur.pop(); used.delete(k);
    }
  };
  bt(0);
  return out;
}

function project(rs: ResultSet, map: number[]): Cell[][] {
  return rs.rows.map((r) => map.map((k) => r[k]));
}

function orderOk(exp: Cell[][], act: Cell[][], keys: number[]): boolean {
  for (let i = 0; i < exp.length; i++) {
    for (const k of keys) if (!cellEq(exp[i][k], act[i][k])) return false;
  }
  return true;
}

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export function compareResults(
  expected: ResultSet,
  actual: ResultSet | null,
  opts: CompareOptions = {},
  userSql = '',
): Verdict {
  const tips: string[] = [];
  const sql = userSql.toUpperCase();
  if (/(=|<>|!=)\s*NULL\b/i.test(userSql)) {
    tips.push('Comparações com NULL usando = ou <> sempre resultam em "desconhecido". Use IS NULL / IS NOT NULL.');
  }

  if (!actual) {
    return {
      correct: false, code: 'no_result', title: 'Nenhum resultado retornado',
      message: 'Sua consulta foi executada, mas não produziu um conjunto de resultados. O exercício espera uma consulta SELECT.',
      tips,
    };
  }

  const ne = expected.columns.length;
  const na = actual.columns.length;
  if (ne !== na) {
    return {
      correct: false, code: 'column_count', title: 'Número de colunas diferente',
      message: `O resultado esperado tem ${plural(ne, 'coluna', 'colunas')}, mas sua consulta retornou ${plural(na, 'coluna', 'colunas')}.`,
      tips: [
        na > ne
          ? 'Selecione somente as colunas pedidas no objetivo (evite SELECT * quando o enunciado lista colunas específicas).'
          : 'Confira se todas as colunas pedidas no objetivo estão no SELECT.',
        ...tips,
      ],
    };
  }

  const er = expected.rows.length;
  const ar = actual.rows.length;
  if (er !== ar) {
    const more = ar > er;
    const t: string[] = [];
    if (more) {
      t.push('Talvez falte um filtro (WHERE / HAVING) ou um LIMIT.');
      if (/\bJOIN\b/.test(sql)) t.push('Um JOIN pode estar multiplicando linhas: confira as condições do ON.');
      if (!/\bDISTINCT\b|\bGROUP\s+BY\b/.test(sql)) t.push('Se o objetivo pede valores únicos, considere DISTINCT ou GROUP BY.');
    } else {
      t.push('Talvez algum filtro esteja restritivo demais (confira datas, maiúsculas/minúsculas e operadores como > vs >=).');
      if (/\bHAVING\b/.test(sql)) t.push('Se a agregação usa registros que não deveria (outro tipo, outro período), os valores mudam e outros grupos passam ou deixam de passar no HAVING. Confira o WHERE.');
      if (/\bJOIN\b/.test(sql) && !/\bLEFT\b/.test(sql)) t.push('Se o enunciado pede que itens sem correspondência também apareçam, lembre que o INNER JOIN os descarta (considere LEFT JOIN).');
      if (/\bLEFT\s+(OUTER\s+)?JOIN\b[\s\S]*\bWHERE\b/.test(sql)) t.push('Condições sobre a tabela da direita no WHERE anulam o LEFT JOIN. Experimente movê-las para o ON.');
    }
    return {
      correct: false, code: 'row_count', title: 'Quantidade de linhas diferente',
      message: `Sua consulta retornou ${plural(ar, 'linha', 'linhas')}, mas o resultado esperado tem ${plural(er, 'linha', 'linhas')}.`,
      tips: [...t, ...tips],
    };
  }

  const mappings = columnMappings(expected, actual);
  for (const map of mappings) {
    const proj = project(actual, map);
    if (!sameRows(expected.rows, proj)) continue;
    if (opts.orderMatters) {
      const keys = opts.orderKeys ?? expected.columns.map((_, i) => i);
      if (!orderOk(expected.rows, proj, keys)) {
        return {
          correct: false, code: 'order', title: 'Dados corretos, ordem incorreta',
          message: 'Todas as linhas estão certas, mas a ordem não corresponde ao que o objetivo pede.',
          tips: ['Revise o ORDER BY: coluna(s), prioridade entre elas e direção (ASC / DESC).', ...tips],
        };
      }
    }
    return {
      correct: true, code: 'correct', title: 'Resposta correta!',
      message: 'O resultado da sua consulta é equivalente ao esperado.',
      tips: [],
    };
  }

  // Valores quase iguais → provável questão de arredondamento
  if (sameRows(expected.rows, actual.rows, 0.051) || sameRows(expected.rows, actual.rows, 0.51)) {
    return {
      correct: false, code: 'rounding', title: 'Quase lá: valores muito próximos',
      message: 'Os valores numéricos estão próximos do esperado, mas não iguais.',
      tips: ['Confira o arredondamento pedido no objetivo (ROUND(valor, casas)) e se a divisão não está sendo feita entre inteiros (use 1.0 * x / y).', ...tips],
    };
  }

  // Identifica colunas esperadas sem correspondência no resultado do aluno
  const unmatched: string[] = [];
  expected.columns.forEach((name, j) => {
    const ev = columnValues(expected, j);
    const ok = actual.columns.some((_, k) => sameColumn(ev, columnValues(actual, k)));
    if (!ok) unmatched.push(`${j + 1}ª (“${name}”)`);
  });

  let wrongRows = 0;
  {
    const counts = new Map<string, number>();
    for (const r of expected.rows) counts.set(rowKey(r), (counts.get(rowKey(r)) ?? 0) + 1);
    for (const r of actual.rows) {
      const c = counts.get(rowKey(r));
      if (c) counts.set(rowKey(r), c - 1);
      else wrongRows++;
    }
  }

  const t: string[] = [];
  if (unmatched.length && unmatched.length < expected.columns.length) {
    t.push(`Nenhuma das suas colunas corresponde à coluna esperada ${unmatched.join(', ')}. Revise o cálculo ou o filtro que a produz.`);
  } else if (unmatched.length) {
    t.push('Nenhuma coluna corresponde ao esperado: confira se está consultando a tabela e o filtro corretos.');
  }
  t.push('Confira filtros de data/período, condições de JOIN e a função de agregação utilizada.');
  return {
    correct: false, code: 'values', title: 'Valores diferentes do esperado',
    message: `A quantidade de linhas está certa, mas ${plural(wrongRows || ar, 'linha não confere', 'linhas não conferem')} com o resultado esperado.`,
    tips: [...t, ...tips],
  };
}
