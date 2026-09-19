import { useEffect, useState } from 'react';
import type { Repertorio } from '@cifra-app/shared';
import { useAuth } from '@cifra-app/shared';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';

export default function RepertoriosPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'administrador' || profile?.role === 'editor';
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modalRep, setModalRep] = useState<Repertorio | 'new' | null>(null);
  const [confirmRep, setConfirmRep] = useState<Repertorio | null>(null);

  async function loadAll() {
    const { data: reps } = await supabase.from('repertorios').select('*').order('nome');
    setRepertorios((reps as Repertorio[]) ?? []);

    const { data: cifras } = await supabase.from('cifras').select('repertorio_id');
    const map: Record<string, number> = {};
    (cifras ?? []).forEach((c: { repertorio_id: string | null }) => {
      if (c.repertorio_id) map[c.repertorio_id] = (map[c.repertorio_id] ?? 0) + 1;
    });
    setCounts(map);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleRemove(rep: Repertorio) {
    await supabase.from('cifras').update({ repertorio_id: null }).eq('repertorio_id', rep.id);
    await supabase.from('repertorios').delete().eq('id', rep.id);
    setConfirmRep(null);
    loadAll();
  }

  const count = confirmRep ? counts[confirmRep.id] ?? 0 : 0;

  return (
    <div>
      <div className="panel">
        <div className="panel-head">
          <h2>Repertórios</h2>
        </div>
        <div style={{ padding: 18 }}>
          <div className="repertorio-grid">
            {repertorios.map((r) => (
              <div className="rep-card" key={r.id}>
                <div className="rep-head">
                  <span className="rep-swatch" style={{ background: r.cor }} />
                  <span className="rep-name">{r.nome}</span>
                  {!r.liberado && <span className="rep-draft-badge">Não liberado</span>}
                </div>
                <div className="rep-count">{counts[r.id] ?? 0} cifra(s)</div>
                {canWrite && (
                  <div className="rep-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setModalRep(r)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmRep(r)}>Remover</button>
                  </div>
                )}
              </div>
            ))}
            {canWrite && (
              <div className="rep-add" onClick={() => setModalRep('new')}>
                <div style={{ fontSize: '1.3rem' }}>+</div>
                <div>Adicionar</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalRep && (
        <RepertorioModal
          initial={modalRep === 'new' ? null : modalRep}
          onClose={() => setModalRep(null)}
          onSaved={() => {
            setModalRep(null);
            loadAll();
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmRep}
        message={
          count > 0
            ? `Remover a pasta "${confirmRep?.nome}"? Isso remove só a pasta — as ${count} cifra(s) que estão nela continuam existindo, só ficam sem repertório até você organizá-las de novo em Cifras.`
            : `Remover a pasta "${confirmRep?.nome}"?`
        }
        onConfirm={() => confirmRep && handleRemove(confirmRep)}
        onCancel={() => setConfirmRep(null)}
      />
    </div>
  );
}

function RepertorioModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Repertorio | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [cor, setCor] = useState(initial?.cor ?? '#7c1329');
  const [liberado, setLiberado] = useState(initial?.liberado ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nome.trim()) {
      alert('Digite um nome para o repertório.');
      return;
    }
    setSaving(true);
    if (initial) {
      await supabase.from('repertorios').update({ nome: nome.trim(), cor, liberado }).eq('id', initial.id);
    } else {
      const { data: userRes } = await supabase.auth.getUser();
      await supabase.from('repertorios').insert({ nome: nome.trim(), cor, liberado, created_by: userRes.user?.id });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>{initial ? 'Editar Repertório' : 'Novo Repertório'}</h3>
        <div className="field">
          <label>Nome do repertório</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Culto de Jovens" />
        </div>
        <div className="field">
          <label>Cor de identificação</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} style={{ width: 44, height: 38, border: 'none', borderRadius: 9, padding: 0, cursor: 'pointer' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Aparece junto do nome nas cifras dessa pasta</span>
          </div>
        </div>
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
            <input type="checkbox" checked={liberado} onChange={(e) => setLiberado(e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            Liberado para todos os membros
          </label>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 5 }}>
            Desmarcado = só admins e editores veem essa pasta. Ninguém no app do músico enxerga até você marcar isso.
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : initial ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
