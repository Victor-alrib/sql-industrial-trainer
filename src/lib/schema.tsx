import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { sqlClient } from '../engine/client';
import type { TableInfo } from '../engine/types';

interface SchemaState {
  ready: boolean;
  error: string | null;
  tables: TableInfo[];
  tableNames: string[];
  columnNames: string[];
}

const Ctx = createContext<SchemaState>({ ready: false, error: null, tables: [], tableNames: [], columnNames: [] });

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SchemaState>({ ready: false, error: null, tables: [], tableNames: [], columnNames: [] });
  useEffect(() => {
    let alive = true;
    sqlClient
      .init()
      .then(() => sqlClient.schema())
      .then((tables) => {
        if (!alive) return;
        setState({
          ready: true, error: null, tables,
          tableNames: tables.map((t) => t.name),
          columnNames: [...new Set(tables.flatMap((t) => t.columns.map((c) => c.name)))],
        });
      })
      .catch((e) => alive && setState((s) => ({ ...s, error: String(e?.message ?? e) })));
    return () => { alive = false; };
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useSchema = () => useContext(Ctx);
