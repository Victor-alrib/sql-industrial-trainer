/**
 * Cliente do sandbox SQL. Encaminha as consultas ao Web Worker, aplica tempo
 * limite (o worker é destruído e recriado se a consulta travar) e, se o
 * navegador não permitir workers, recorre a uma execução local equivalente.
 */
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import SqlWorker from './sqlWorker.ts?worker&inline';
import type { RunOutcome, TableInfo, ValidateRequest, ValidateResponse } from './types';

export const QUERY_TIMEOUT_MS = 5000;

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

class SqlClient {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private fallback: Promise<import('./core').Engine> | null = null;

  /** No build de arquivo único o wasm vem embutido (data URL): decodifica e envia os bytes direto. */
  private wasmSource(): { wasmUrl?: string; wasmBinary?: ArrayBuffer } {
    if (wasmUrl.startsWith('data:')) {
      const b64 = wasmUrl.slice(wasmUrl.indexOf(',') + 1);
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { wasmBinary: bytes.buffer };
    }
    return { wasmUrl: this.absoluteWasmUrl() };
  }

  private absoluteWasmUrl() {
    return wasmUrl.startsWith('data:') ? wasmUrl : new URL(wasmUrl, document.baseURI).href;
  }

  private spawn(): Promise<void> {
    try {
      const w = new SqlWorker();
      this.worker = w;
      w.onmessage = (ev) => {
        const { id, ok, data, error } = ev.data;
        const p = this.pending.get(id);
        if (!p) return;
        clearTimeout(p.timer);
        this.pending.delete(id);
        ok ? p.resolve(data) : p.reject(new Error(error));
      };
      w.onerror = (ev) => {
        ev.preventDefault?.();
        this.failAll(new Error('O ambiente SQL encontrou um erro inesperado.'));
      };
      return this.post('init', this.wasmSource(), 30_000).then(() => undefined);
    } catch {
      this.worker = null;
      return this.useFallback().then(() => undefined);
    }
  }

  private useFallback() {
    if (!this.fallback) {
      this.fallback = Promise.all([import('sql.js'), import('./core')]).then(async ([m, core]) => {
        const src = this.wasmSource();
        const SQL = await m.default(src.wasmBinary ? { wasmBinary: src.wasmBinary } : { locateFile: () => src.wasmUrl! });
        return core.createEngine(SQL);
      });
    }
    return this.fallback;
  }

  private failAll(err: Error) {
    for (const [, p] of this.pending) { clearTimeout(p.timer); p.reject(err); }
    this.pending.clear();
  }

  private post<T>(type: string, payload: unknown, timeout = QUERY_TIMEOUT_MS): Promise<T> {
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        // a consulta travou: descarta o worker inteiro e cria outro limpo
        this.worker?.terminate();
        this.worker = null;
        this.ready = null;
        this.failAll(new Error('timeout'));
        reject(new Error('timeout'));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.worker!.postMessage({ id, type, payload });
    });
  }

  init(): Promise<void> {
    if (!this.ready) {
      this.ready = this.spawn().catch(async () => {
        // Worker bloqueado (CSP, navegador antigo): executa no thread principal
        this.worker?.terminate();
        this.worker = null;
        await this.useFallback();
      });
    }
    return this.ready;
  }

  private async call<T>(type: string, payload: any): Promise<T> {
    await this.init();
    if (!this.worker) {
      const eng = await this.useFallback();
      if (type === 'run') return eng.run(payload.sql, payload.limit) as T;
      if (type === 'validate') return eng.validate(payload) as T;
      return eng.schema() as T;
    }
    return this.post<T>(type, payload);
  }

  async run(sql: string, limit = 1000): Promise<RunOutcome> {
    try {
      return await this.call<RunOutcome>('run', { sql, limit });
    } catch (e) {
      return { ok: false, error: timeoutMsg(e), elapsedMs: QUERY_TIMEOUT_MS };
    }
  }

  async validate(req: ValidateRequest): Promise<ValidateResponse> {
    try {
      return await this.call<ValidateResponse>('validate', req);
    } catch (e) {
      return { run: { ok: false, error: timeoutMsg(e), elapsedMs: QUERY_TIMEOUT_MS }, verdict: null };
    }
  }

  schema(): Promise<TableInfo[]> {
    return this.call<TableInfo[]>('schema', {});
  }
}

function timeoutMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m === 'timeout' ? '__TIMEOUT__' : m;
}

export const sqlClient = new SqlClient();
