/// <reference lib="webworker" />
import initSqlJs from 'sql.js';
import { createEngine, type Engine } from './core';

let engine: Engine | null = null;

self.onmessage = async (ev: MessageEvent) => {
  const { id, type, payload } = ev.data as { id: number; type: string; payload: any };
  try {
    let data: unknown;
    if (type === 'init') {
      const SQL = await initSqlJs(payload.wasmBinary ? { wasmBinary: payload.wasmBinary } : { locateFile: () => payload.wasmUrl });
      engine = createEngine(SQL);
      data = true;
    } else {
      if (!engine) throw new Error('Motor SQL ainda não inicializado.');
      if (type === 'run') data = engine.run(payload.sql, payload.limit);
      else if (type === 'validate') data = engine.validate(payload);
      else if (type === 'schema') data = engine.schema();
      else throw new Error('Mensagem desconhecida: ' + type);
    }
    (self as unknown as Worker).postMessage({ id, ok: true, data });
  } catch (e) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
