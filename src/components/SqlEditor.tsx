import { SQLite, sql } from '@codemirror/lang-sql';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo, useRef } from 'react';
import { useSchema } from '../lib/schema';
import { useProgress } from '../store/progress';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
  onCheck?: () => void;
  minHeight?: string;
  placeholder?: string;
}

const baseTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
  '.cm-content': { padding: '12px 0' },
  '.cm-tooltip-autocomplete': { borderRadius: '8px', overflow: 'hidden' },
});

export default function SqlEditor({ value, onChange, onRun, onCheck, minHeight = '180px', placeholder }: Props) {
  const theme = useProgress((s) => s.theme);
  const { tables } = useSchema();

  // refs mantêm os atalhos sempre apontando para os handlers atuais
  const runRef = useRef(onRun);
  const checkRef = useRef(onCheck);
  runRef.current = onRun;
  checkRef.current = onCheck;

  const extensions = useMemo(() => {
    const schema: Record<string, string[]> = {};
    for (const t of tables) schema[t.name] = t.columns.map((c) => c.name);
    return [
      sql({ dialect: SQLite, schema, upperCaseKeywords: true }),
      baseTheme,
      EditorView.lineWrapping,
      Prec.highest(
        keymap.of([
          { key: 'Mod-Enter', run: () => { runRef.current?.(); return true; } },
          { key: 'Shift-Mod-Enter', run: () => { checkRef.current?.(); return true; } },
        ]),
      ),
    ];
  }, [tables]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? 'dark' : 'light'}
      extensions={extensions}
      minHeight={minHeight}
      placeholder={placeholder}
      basicSetup={{ foldGutter: false, highlightActiveLineGutter: true, autocompletion: true, bracketMatching: true, closeBrackets: true }}
      aria-label="Editor SQL"
    />
  );
}
