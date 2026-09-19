import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cifra, Repertorio } from '@cifra-app/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '@cifra-app/shared';

export default function Library() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRep, setActiveRep] = useState<string>('Todos');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: cifrasData }, { data: repsData }] = await Promise.all([
        supabase.from('cifras').select('*').order('titulo'),
        supabase.from('repertorios').select('*').order('nome'),
      ]);
      setCifras((cifrasData as Cifra[]) ?? []);
      setRepertorios((repsData as Repertorio[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const repertorioById = useMemo(() => {
    const map = new Map<string, Repertorio>();
    repertorios.forEach((r) => map.set(r.id, r));
    return map;
  }, [repertorios]);

  const filtered = cifras.filter((c) => {
    const rep = c.repertorio_id ? repertorioById.get(c.repertorio_id) : null;
    const matchesRep = activeRep === 'Todos' || rep?.nome === activeRep;
    const term = search.toLowerCase();
    const matchesTerm = c.titulo.toLowerCase().includes(term) || c.cantor_ministerio.toLowerCase().includes(term);
    return matchesRep && matchesTerm;
  });

  const initials = (profile?.nome ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="library-screen">
      <div className="lib-header">
        <div className="lib-header-row">
          <h1>🎸 Cifra App</h1>
          <div className="account-wrap">
            <button className="account-avatar" onClick={() => setMenuOpen((v) => !v)}>
              {initials || '?'}
            </button>
            {menuOpen && (
              <div className="account-menu open">
                <div className="acc-name">{profile?.nome}</div>
                <div className="acc-email">{profile?.email}</div>
                <div className="acc-org">⛪ {profile?.role}</div>
                <hr />
                <button className="acc-logout" onClick={signOut}>Deslogar</button>
              </div>
            )}
          </div>
        </div>
        <input
          className="lib-search"
          placeholder="Buscar por título ou cantor/ministério..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="lib-chips">
        {['Todos', ...repertorios.map((r) => r.nome)].map((nome) => {
          const rep = repertorios.find((r) => r.nome === nome);
          return (
            <div
              key={nome}
              className={`lib-chip ${activeRep === nome ? 'active' : ''}`}
              onClick={() => setActiveRep(nome)}
            >
              {rep && <span className="dot" style={{ background: rep.cor }} />}
              {nome}
            </div>
          );
        })}
      </div>

      <div className="lib-list">
        {loading && <div className="lib-empty">Carregando...</div>}
        {!loading && filtered.length === 0 && <div className="lib-empty">Nenhuma cifra encontrada.</div>}
        {!loading &&
          filtered.map((c) => {
            const rep = c.repertorio_id ? repertorioById.get(c.repertorio_id) : null;
            return (
              <div key={c.id} className="lib-card" onClick={() => navigate(`/cifra/${c.id}`)}>
                <div className="lib-tom">{c.tom_original ?? '-'}</div>
                <div className="lib-info">
                  <div className="lib-title">{c.titulo}</div>
                  <div className="lib-artist">{c.cantor_ministerio}</div>
                  {rep && (
                    <div className="lib-rep">
                      <span className="dot" style={{ background: rep.cor }} />
                      {rep.nome}
                    </div>
                  )}
                </div>
                <div className="chevron">›</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
