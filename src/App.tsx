import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trail from './pages/Trail';
import ExercisePage from './pages/ExercisePage';
import DataExplorer from './pages/DataExplorer';
import Playground from './pages/Playground';
import { useProgress } from './store/progress';

export default function App() {
  const theme = useProgress((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="trilha" element={<Trail />} />
        <Route path="exercicio/:id" element={<ExercisePage />} />
        <Route path="dados" element={<DataExplorer />} />
        <Route path="playground" element={<Playground />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
