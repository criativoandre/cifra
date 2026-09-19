import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@cifra-app/shared';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CifrasPage from './pages/Cifras';
import RepertoriosPage from './pages/Repertorios';
import MembrosPage from './pages/Membros';

export default function App() {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="viewer-loading">Carregando...</div>;

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  const isAdmin = profile?.role === 'administrador';

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cifras" element={<CifrasPage />} />
        <Route path="/repertorios" element={<RepertoriosPage />} />
        <Route path="/membros" element={isAdmin ? <MembrosPage /> : <Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
