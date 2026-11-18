import { Database, Gauge, Map, Menu, Moon, Sun, Terminal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { EXERCISES } from '../content/exercises';
import { useSchema } from '../lib/schema';
import { useProgress } from '../store/progress';
import Logo from './Logo';

const NAV = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/trilha', label: 'Trilha de módulos', icon: Map },
  { to: '/dados', label: 'Banco industrial', icon: Database },
  { to: '/playground', label: 'Playground SQL', icon: Terminal },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const theme = useProgress((s) => s.theme);
  const setTheme = useProgress((s) => s.setTheme);
  const exercises = useProgress((s) => s.exercises);
  const schema = useSchema();
  const solved = EXERCISES.filter((e) => exercises[e.id]?.status === 'solved').length;

  useEffect(() => setOpen(false), [loc.pathname]);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <NavLink to="/" className="flex items-center gap-3 px-1">
        <Logo />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">SQL Industrial</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Trainer</div>
        </div>
      </NavLink>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={17} strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="card-muted p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="muted">Progresso geral</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{solved}/{EXERCISES.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(solved / EXERCISES.length) * 100}%` }} />
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-2 px-1 text-[11px] muted">
          <span className={`h-2 w-2 rounded-full ${schema.ready ? 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/70' : schema.error ? 'bg-rose-500' : 'animate-pulse bg-amber-400'}`} />
          {schema.ready ? 'SQLite sandbox online' : schema.error ? 'Falha ao iniciar o SQLite' : 'Iniciando SQLite…'}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary w-full !py-1.5 text-xs"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur dark:border-ink-800 dark:bg-ink-900/60 lg:block">
        {sidebar}
      </aside>

      {/* mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-900/90 lg:hidden">
        <div className="flex items-center gap-2"><Logo size={28} /><span className="font-semibold">SQL Industrial Trainer</span></div>
        <button className="btn-ghost !p-2" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-ink-900">
            <button className="btn-ghost absolute right-2 top-3 !p-2" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
