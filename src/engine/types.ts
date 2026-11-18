export type Cell = number | string | null | Uint8Array;

export interface ResultSet {
  columns: string[];
  rows: Cell[][];
}

export interface RunSuccess {
  ok: true;
  /** Último conjunto de resultados produzido (null se nenhum SELECT foi executado). */
  result: ResultSet | null;
  /** Total de linhas antes do corte para exibição. */
  totalRows: number;
  truncated: boolean;
  elapsedMs: number;
}

export interface RunFailure {
  ok: false;
  error: string;
  elapsedMs: number;
}

export type RunOutcome = RunSuccess | RunFailure;

export interface CompareOptions {
  /** A ordem das linhas faz parte da resposta? */
  orderMatters?: boolean;
  /**
   * Índices (nas colunas esperadas) que definem a ordenação. Quando há empates
   * nessas colunas, qualquer ordem entre as linhas empatadas é aceita.
   * Padrão: todas as colunas.
   */
  orderKeys?: number[];
}

export type VerdictCode =
  | 'correct'
  | 'no_result'
  | 'column_count'
  | 'row_count'
  | 'values'
  | 'rounding'
  | 'order';

export interface Verdict {
  correct: boolean;
  code: VerdictCode;
  title: string;
  message: string;
  tips: string[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  pk: boolean;
  fk?: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
}

export interface ValidateRequest {
  exerciseId: string;
  userSql: string;
  solutionSql: string;
  options: CompareOptions;
}

export interface ValidateResponse {
  run: RunOutcome;
  verdict: Verdict | null;
}
