import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
  }

  return (
    <div className="login-screen">
      <div className="login-logo">🎸</div>
      <div className="login-title">Cifra App</div>
      <div className="login-sub">Entre com sua conta para acessar as cifras</div>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@igreja.com" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <div className="error-msg">{error}</div>}
      </form>
    </div>
  );
}
