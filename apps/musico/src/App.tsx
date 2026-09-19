import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@cifra-app/shared';
import Login from './pages/Login';
import Library from './pages/Library';
import Viewer from './pages/Viewer';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <div className="viewer-loading">Carregando...</div>;

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/cifra/:id" element={<Viewer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
