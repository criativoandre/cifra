import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@cifra-app/shared';
import Login from './pages/Login';
import Library from './pages/Library';
import Viewer from './pages/Viewer';
import DefinirSenha from './pages/DefinirSenha';

// o Supabase redireciona convites/links de "esqueci minha senha" pra cá com
// #access_token=...&type=invite (ou magiclink/recovery) no final da URL —
// detectamos isso ANTES de olhar se já existe sessão, pra sempre cair na
// tela de definir senha primeiro, mesmo que o link já tenha logado a pessoa.
function isPasswordFlow() {
  return /type=(invite|magiclink|recovery)/.test(window.location.hash);
}

export default function App() {
  const { session, loading } = useAuth();

  if (isPasswordFlow()) {
    return (
      <Routes>
        <Route path="*" element={<DefinirSenha />} />
      </Routes>
    );
  }

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
