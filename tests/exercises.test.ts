import initSqlJs from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { EXERCISES, exerciseById } from '../src/content/exercises';
import { MODULES } from '../src/content/modules';
import { createEngine, type Engine } from '../src/engine/core';

let engine: Engine;
beforeAll(async () => {
  engine = createEngine(await initSqlJs());
});

const check = (id: string, userSql: string) => {
  const ex = exerciseById(id)!;
  return engine.validate({ exerciseId: ex.id, userSql, solutionSql: ex.solution, options: ex.options ?? {} });
};

describe('conteúdo', () => {
  it('todo módulo tem exercícios e ids únicos', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    expect(ids.size).toBe(EXERCISES.length);
    for (const m of MODULES) expect(EXERCISES.some((e) => e.moduleId === m.id)).toBe(true);
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('solução de %s executa, retorna linhas e se auto-valida', (_, ex) => {
    const r = engine.run(ex.solution);
    expect(r.ok, r.ok ? '' : r.error).toBe(true);
    if (!r.ok) return;
    expect(r.result).not.toBeNull();
    expect(r.result!.rows.length).toBeGreaterThan(0);
    expect(r.result!.columns.length).toBe(ex.expectedColumns.length);
    expect(ex.hints.length).toBe(3);
    const v = check(ex.id, ex.solution);
    expect(v.verdict?.correct).toBe(true);
  });
});

/** Consultas diferentes e corretas que DEVEM ser aceitas. */
const ALTERNATIVES: Record<string, string[]> = {
  '1.1': ['select id, nome, area, capacidade_hora, gerente from linhas_producao order by nome desc'],
  '1.2': ['SELECT fabricante AS fab, tag, nome FROM equipamentos'],
  '1.4': ['SELECT fabricante FROM equipamentos GROUP BY fabricante'],
  '2.4': [
    "SELECT id, equipamento_id, data_abertura, custo FROM ordens_manutencao WHERE tipo='corretiva' AND strftime('%Y-%m', data_abertura)='2026-09' AND custo>3000",
    "SELECT id, equipamento_id, data_abertura, custo FROM ordens_manutencao WHERE tipo='corretiva' AND data_abertura LIKE '2026-09%' AND custo>3000",
  ],
  '2.5': ["SELECT data_hora, valor FROM leituras WHERE sensor_id=10 AND valor>85 AND date(data_hora) BETWEEN '2026-09-20' AND '2026-09-25'"],
  '3.1': ['SELECT tag, data_instalacao FROM equipamentos ORDER BY data_instalacao ASC, tag DESC'],
  '4.5': [
    'SELECT ROUND(COUNT(data_reconhecimento) * 100.0 / COUNT(*), 1) FROM alarmes',
    'SELECT ROUND(AVG(reconhecido) * 100, 1) FROM alarmes',
  ],
  '5.1': ['SELECT COUNT(*) n, linha_id FROM equipamentos GROUP BY linha_id ORDER BY n DESC'],
  '6.3': [
    `SELECT e.tag, ROUND(AVG(l.valor),2) FROM leituras l, sensores s, equipamentos e
     WHERE l.sensor_id=s.id AND s.equipamento_id=e.id AND s.tipo='temperatura' GROUP BY e.tag HAVING AVG(l.valor) > 80`,
    `SELECT tag, media FROM (SELECT e.tag, AVG(l.valor) AS media FROM equipamentos e JOIN sensores s ON s.equipamento_id=e.id
     JOIN leituras l ON l.sensor_id=s.id WHERE s.tipo='temperatura' GROUP BY e.tag) WHERE media > 80`,
  ],
  '7.2': [
    'SELECT tag, nome FROM equipamentos WHERE id NOT IN (SELECT equipamento_id FROM ordens_manutencao)',
    'SELECT tag, nome FROM equipamentos e WHERE NOT EXISTS (SELECT 1 FROM ordens_manutencao o WHERE o.equipamento_id = e.id)',
  ],
  '7.3': ['SELECT e.tag, (SELECT COUNT(*) FROM alarmes a WHERE a.equipamento_id = e.id) FROM equipamentos e'],
  '8.2': ["SELECT DISTINCT e.tag, e.nome FROM equipamentos e JOIN alarmes a ON a.equipamento_id = e.id WHERE a.severidade = 'critica'"],
  '8.3': [
    "SELECT nome FROM operadores WHERE funcao LIKE 'Operador%' AND id NOT IN (SELECT operador_id FROM alarmes WHERE operador_id IS NOT NULL)",
    "SELECT o.nome FROM operadores o LEFT JOIN alarmes a ON a.operador_id = o.id WHERE o.funcao LIKE 'Operador%' AND a.id IS NULL",
  ],
  '8.4': [
    `WITH r AS (SELECT s.tag, l.data_hora, l.valor, RANK() OVER (PARTITION BY s.id ORDER BY l.valor DESC) rk
      FROM sensores s JOIN leituras l ON l.sensor_id = s.id WHERE s.tipo='vibracao') SELECT tag, data_hora, valor FROM r WHERE rk = 1`,
  ],
  '9.4': [
    `SELECT e.tag, o.data_abertura, o.tipo FROM ordens_manutencao o JOIN equipamentos e ON e.id = o.equipamento_id
     WHERE o.data_abertura = (SELECT MAX(o2.data_abertura) FROM ordens_manutencao o2 WHERE o2.equipamento_id = o.equipamento_id)`,
  ],
  '9.5': [
    `WITH m AS (SELECT substr(data_abertura,1,7) mes, SUM(custo) c FROM ordens_manutencao GROUP BY 1)
     SELECT mes, c, (SELECT SUM(c) FROM m m2 WHERE m2.mes <= m.mes) FROM m ORDER BY mes`,
  ],
  '10.1': [
    `SELECT e.tag, COUNT(*), AVG(julianday(o.data_conclusao)*24 - julianday(o.data_inicio)*24) mttr
     FROM equipamentos e, ordens_manutencao o WHERE o.equipamento_id=e.id AND o.tipo='corretiva' AND o.data_conclusao IS NOT NULL
     GROUP BY e.tag ORDER BY mttr DESC`,
  ],
  '10.4': [
    `SELECT e.tag, l.nome,
       (SELECT COUNT(*) FROM eventos_operacionais v WHERE v.equipamento_id=e.id AND v.tipo='parada_nao_programada') AS f,
       (SELECT SUM(duracao_min)/60.0 FROM eventos_operacionais v WHERE v.equipamento_id=e.id AND v.tipo='parada_nao_programada') AS hp,
       (SELECT AVG(duracao_min)/60.0 FROM eventos_operacionais v WHERE v.equipamento_id=e.id AND v.tipo='parada_nao_programada') AS mttr,
       (2208 - (SELECT SUM(duracao_min)/60.0 FROM eventos_operacionais v WHERE v.equipamento_id=e.id AND v.tipo='parada_nao_programada'))
         / (SELECT COUNT(*) FROM eventos_operacionais v WHERE v.equipamento_id=e.id AND v.tipo='parada_nao_programada') AS mtbf,
       (SELECT SUM(custo) FROM ordens_manutencao o WHERE o.equipamento_id=e.id AND o.status!='cancelada') AS custo,
       (SELECT COUNT(*) FROM alarmes a WHERE a.equipamento_id=e.id AND a.severidade='critica') AS crit
     FROM equipamentos e JOIN linhas_producao l ON l.id=e.linha_id
     WHERE e.criticidade='A' AND EXISTS (SELECT 1 FROM eventos_operacionais v WHERE v.equipamento_id=e.id AND v.tipo='parada_nao_programada')
     ORDER BY mtbf`,
  ],
};

/** Erros típicos que DEVEM ser rejeitados (com o código de diagnóstico esperado). */
const WRONG: [string, string, string][] = [
  ['1.2', 'SELECT * FROM equipamentos', 'column_count'],
  ['2.3', 'SELECT nome, funcao FROM operadores WHERE linha_id = NULL', 'row_count'],
  ['2.5', "SELECT data_hora, valor FROM leituras WHERE sensor_id=10 AND valor>85 AND data_hora BETWEEN '2026-09-20' AND '2026-09-25'", 'row_count'],
  ['3.2', 'SELECT id, equipamento_id, custo FROM ordens_manutencao ORDER BY custo LIMIT 5', 'values'],
  ['3.3', 'SELECT nome, turno FROM operadores ORDER BY nome', 'order'],
  ['4.5', 'SELECT ROUND(100 * SUM(reconhecido) / COUNT(*), 1) FROM alarmes', 'rounding'],
  ['6.3', "SELECT e.tag, ROUND(AVG(l.valor),2) FROM equipamentos e JOIN sensores s ON s.equipamento_id=e.id JOIN leituras l ON l.sensor_id=s.id GROUP BY e.tag HAVING AVG(l.valor) > 80", 'row_count'],
  ['7.3', 'SELECT e.tag, COUNT(*) FROM equipamentos e LEFT JOIN alarmes a ON a.equipamento_id = e.id GROUP BY e.tag', 'values'],
  ['7.4', "SELECT l.nome, COUNT(o.id) FROM linhas_producao l JOIN equipamentos e ON e.linha_id=l.id LEFT JOIN ordens_manutencao o ON o.equipamento_id=e.id WHERE o.status IN ('aberta','em_andamento') GROUP BY l.nome", 'row_count'],
  ['8.3', "SELECT nome FROM operadores WHERE funcao LIKE 'Operador%' AND id NOT IN (SELECT operador_id FROM alarmes)", 'row_count'],
  ['8.5', "SELECT ROUND(AVG(custo),2) FROM ordens_manutencao WHERE status <> 'cancelada'", 'values'],
  ['10.4', `SELECT e.tag, l.nome, COUNT(v.id), ROUND(SUM(v.duracao_min)/60.0,2), ROUND(AVG(v.duracao_min)/60.0,2),
     ROUND((2208 - SUM(v.duracao_min)/60.0)/COUNT(v.id),2), ROUND(SUM(o.custo),2), COUNT(a.id)
     FROM equipamentos e JOIN linhas_producao l ON l.id=e.linha_id
     JOIN eventos_operacionais v ON v.equipamento_id=e.id AND v.tipo='parada_nao_programada'
     LEFT JOIN ordens_manutencao o ON o.equipamento_id=e.id AND o.status<>'cancelada'
     LEFT JOIN alarmes a ON a.equipamento_id=e.id AND a.severidade='critica'
     WHERE e.criticidade='A' GROUP BY e.tag ORDER BY 6`, 'values'],
];

describe('validação semântica', () => {
  for (const [id, list] of Object.entries(ALTERNATIVES)) {
    list.forEach((sql, i) => {
      it(`aceita alternativa ${i + 1} do exercício ${id}`, () => {
        const v = check(id, sql);
        expect(v.run.ok, v.run.ok ? '' : (v.run as { error: string }).error).toBe(true);
        expect(v.verdict?.correct, v.verdict?.message).toBe(true);
      });
    });
  }
  for (const [id, sql, code] of WRONG) {
    it(`rejeita erro típico em ${id} (${code})`, () => {
      const v = check(id, sql);
      expect(v.verdict?.correct).toBe(false);
      expect(v.verdict?.code).toBe(code);
    });
  }
});

describe('sandbox', () => {
  it('bloqueia escrita', () => {
    const r = engine.run("DELETE FROM equipamentos; SELECT COUNT(*) FROM equipamentos");
    expect(r.ok).toBe(false);
  });
  it('cada execução parte do banco original', () => {
    engine.run('CREATE TABLE x(a)');
    const r = engine.run("SELECT COUNT(*) FROM sqlite_master WHERE name='x'");
    expect(r.ok && r.result!.rows[0][0]).toBe(0);
  });
  it('retorna colunas mesmo sem linhas', () => {
    const r = engine.run("SELECT tag FROM equipamentos WHERE 1=0");
    expect(r.ok && r.result!.columns).toEqual(['tag']);
  });
  it('dados determinísticos', () => {
    const r = engine.run('SELECT COUNT(*), ROUND(SUM(valor), 1) FROM leituras');
    const r2 = engine.run('SELECT COUNT(*), ROUND(SUM(valor), 1) FROM leituras');
    expect(r).toMatchObject({ ok: true });
    expect(r.ok && r2.ok && r.result!.rows).toEqual(r2.ok && r2.result!.rows);
  });
});

describe('sem empates na fronteira dos Top-N', () => {
  it('3.2: 5º e 6º custos diferentes', () => {
    const r = engine.run('SELECT custo FROM ordens_manutencao ORDER BY custo DESC LIMIT 6');
    expect(r.ok && r.result!.rows[4][0] !== r.result!.rows[5][0]).toBe(true);
  });
});
