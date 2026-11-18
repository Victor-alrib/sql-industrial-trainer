/**
 * Núcleo de execução SQL (independente de React e de Web Worker).
 *
 * Isolamento:
 *  - o banco industrial é gerado uma única vez e serializado em memória (`pristine`);
 *  - CADA execução abre uma cópia descartável desse snapshot, em modo
 *    somente leitura (PRAGMA query_only), e a fecha em seguida;
 *  - este módulo roda dentro de um Web Worker: a consulta do aluno não tem
 *    acesso ao localStorage, ao DOM nem ao progresso salvo do aplicativo.
 */
import type { Database, SqlJsStatic } from 'sql.js';
import { buildIndustrialDatabase } from '../db/seed';
import { compareResults } from './compare';
import type { Cell, ResultSet, RunOutcome, TableInfo, ValidateRequest, ValidateResponse } from './types';

export const MAX_SQL_LENGTH = 20_000;
const MAX_COLLECT = 50_000;

export interface Engine {
  run(sql: string, displayLimit?: number): RunOutcome;
  validate(req: ValidateRequest): ValidateResponse;
  schema(): TableInfo[];
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function createEngine(SQL: SqlJsStatic): Engine {
  const seedDb = buildIndustrialDatabase(SQL);
  const pristine = seedDb.export();
  seedDb.close();

  const expectedCache = new Map<string, ResultSet | null>();

  const sandbox = (): Database => {
    const db = new SQL.Database(pristine);
    db.run('PRAGMA query_only = 1;');
    return db;
  };

  /** Executa todas as instruções e devolve o resultado da última que produz colunas. */
  const execute = (sql: string): { result: ResultSet | null; total: number } => {
    if (sql.length > MAX_SQL_LENGTH) throw new Error('Consulta muito longa (limite de 20.000 caracteres).');
    const db = sandbox();
    try {
      let last: ResultSet | null = null;
      let total = 0;
      for (const stmt of db.iterateStatements(sql)) {
        try {
          const cols = stmt.getColumnNames();
          if (cols.length === 0) {
            while (stmt.step()) { /* instruções sem retorno */ }
            continue;
          }
          const rows: Cell[][] = [];
          let count = 0;
          while (stmt.step()) {
            count++;
            if (rows.length < MAX_COLLECT) rows.push(stmt.get() as Cell[]);
          }
          last = { columns: cols, rows };
          total = count;
        } finally {
          stmt.free();
        }
      }
      return { result: last, total };
    } finally {
      db.close();
    }
  };

  const run = (sql: string, displayLimit = 1000): RunOutcome => {
    const t0 = now();
    try {
      if (!sql.trim()) throw new Error('Digite uma consulta SQL antes de executar.');
      const { result, total } = execute(sql);
      const truncated = !!result && result.rows.length > displayLimit;
      return {
        ok: true,
        result: result && truncated ? { columns: result.columns, rows: result.rows.slice(0, displayLimit) } : result,
        totalRows: total,
        truncated,
        elapsedMs: now() - t0,
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e), elapsedMs: now() - t0 };
    }
  };

  const validate = (req: ValidateRequest): ValidateResponse => {
    let expected = expectedCache.get(req.exerciseId);
    if (expected === undefined) {
      expected = execute(req.solutionSql).result;
      expectedCache.set(req.exerciseId, expected);
    }
    const t0 = now();
    let full: { result: ResultSet | null; total: number };
    try {
      if (!req.userSql.trim()) throw new Error('Digite uma consulta SQL antes de verificar.');
      full = execute(req.userSql);
    } catch (e) {
      return { run: { ok: false, error: e instanceof Error ? e.message : String(e), elapsedMs: now() - t0 }, verdict: null };
    }
    const elapsedMs = now() - t0;
    const verdict = compareResults(expected!, full.result, req.options, req.userSql);
    const limit = 1000;
    const r = full.result;
    return {
      run: {
        ok: true,
        result: r && r.rows.length > limit ? { columns: r.columns, rows: r.rows.slice(0, limit) } : r,
        totalRows: full.total,
        truncated: !!r && r.rows.length > limit,
        elapsedMs,
      },
      verdict,
    };
  };

  const schema = (): TableInfo[] => {
    const db = sandbox();
    try {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")[0]?.values.map((v) => String(v[0])) ?? [];
      return tables.map((name) => {
        const cols = db.exec(`PRAGMA table_info(${name})`)[0]?.values ?? [];
        const fks = db.exec(`PRAGMA foreign_key_list(${name})`)[0]?.values ?? [];
        const fkMap = new Map(fks.map((f) => [String(f[3]), `${f[2]}.${f[4]}`]));
        const rowCount = Number(db.exec(`SELECT COUNT(*) FROM ${name}`)[0].values[0][0]);
        return {
          name,
          rowCount,
          columns: cols.map((c) => ({
            name: String(c[1]),
            type: String(c[2]),
            notNull: Number(c[3]) === 1,
            pk: Number(c[5]) > 0,
            fk: fkMap.get(String(c[1])),
          })),
        };
      });
    } finally {
      db.close();
    }
  };

  return { run, validate, schema };
}
