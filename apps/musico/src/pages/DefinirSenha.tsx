import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function DefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    const { data } = await supabase.auth.getUser();
    setIsAdmin(data.user?.user_metadata?.role === 'administrador');
    setDone(true);
  }

  if (done) {
    return (
      <div className="login-screen">
        <div className="login-logo">✅</div>
        <div className="login-title">Senha definida!</div>
        <div className="login-sub">Sua conta já está pronta pra usar.</div>
        {isAdmin && import.meta.env.VITE_ADMIN_URL ? (
          <a className="btn-primary" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }} href={import.meta.env.VITE_ADMIN_URL}>
            Ir para o Painel Admin
          </a>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/')}>Ir para o app</button>
        )}
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-logo">🎸</div>
      <div className="login-title">Cifra App</div>
      <div className="login-sub">Defina a senha da sua conta para começar a usar o app.</div>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nova senha</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>
        <div className="field">
          <label>Confirmar senha</label>
          <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" />
        </div>
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Definir senha e entrar'}
        </button>
        {error && <div className="error-msg">{error}</div>}
      </form>
    </div>
  );
}
