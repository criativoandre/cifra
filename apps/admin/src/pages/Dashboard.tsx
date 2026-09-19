import { useEffect, useState } from 'react';
import type { Cifra, Repertorio } from '@cifra-app/shared';
import { useAuth } from '@cifra-app/shared';
import { supabase } from '../lib/supabase';

type CifraComRepertorio = Cifra & { repertorio: Pick<Repertorio, 'nome' | 'cor'> | null };

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ cifras: 0, repertorios: 0, membros: 0, semRepertorio: 0 });
  const [recentes, setRecentes] = useState<CifraComRepertorio[]>([]);
  const canSeeMembros = profile?.role === 'administrador' || profile?.role === 'editor';

  useEffect(() => {
    async function load() {
      const [cifrasCount, repsCount, membrosCount, semRepCount, recentesRes] = await Promise.all([
        supabase.from('cifras').select('*', { count: 'exact', head: true }),
        supabase.from('repertorios').select('*', { count: 'exact', head: true }),
        canSeeMembros
          ? supabase.from('profiles').select('*', { count: 'exact', head: true })
          : Promise.resolve({ count: null }),
        supabase.from('cifras').select('*', { count: 'exact', head: true }).is('repertorio_id', null),
        supabase
          .from('cifras')
          .select('*, repertorio:repertorios(nome, cor)')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);
      setStats({
        cifras: cifrasCount.count ?? 0,
        repertorios: repsCount.count ?? 0,
        membros: membrosCount.count ?? 0,
        semRepertorio: semRepCount.count ?? 0,
      });
      setRecentes((recentesRes.data as unknown as CifraComRepertorio[]) ?? []);
    }
    load();
  }, [canSeeMembros]);

  return (
    <div>
      <div className="cards-row">
        <StatCard num={stats.cifras} label="Cifras cadastradas" />
        <StatCard num={stats.repertorios} label="Repertórios" />
        {canSeeMembros && <StatCard num={stats.membros} label="Membros com acesso" />}
        <StatCard num={stats.semRepertorio} label="Cifras sem repertório" />
      </div>
      <div className="panel">
        <div className="panel-head">
          <h2>Últimas cifras importadas</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cantor/Ministério</th>
                <th>Repertório</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((c) => (
                <tr key={c.id}>
                  <td>{c.titulo}</td>
                  <td>{c.cantor_ministerio}</td>
                  <td>
                    {c.repertorio ? (
                      <span className="badge set">
                        <span className="rep-dot" style={{ background: c.repertorio.cor }} />
                        {c.repertorio.nome}
                      </span>
                    ) : (
                      <span className="badge">Sem repertório</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ num, label }: { num: number; label: string }) {
  return (
    <div className="stat-card">
      <div className="num">{num}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}
