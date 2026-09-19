import { useEffect, useState } from 'react';
import type { Profile, Role } from '@cifra-app/shared';
import { useAuth } from '@cifra-app/shared';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';

const ROLE_LABEL: Record<Role, string> = {
  administrador: 'Administrador',
  editor: 'Editor',
  colaborador: 'Colaborador',
};

export default function MembrosPage() {
  const { profile: me } = useAuth();
  const [membros, setMembros] = useState<Profile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('nome');
    setMembros((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function removeMembro(id: string) {
    await supabase.from('profiles').delete().eq('id', id);
    setConfirmId(null);
    loadAll();
  }

  const membroParaExcluir = membros.find((m) => m.id === confirmId);

  return (
    <div>
      <div className="panel">
        <div className="panel-head">
          <h2>Membros com acesso</h2>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Adicionar Membro</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Função</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!loading &&
                membros.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`badge ${m.role === 'administrador' ? 'set' : m.role === 'editor' ? 'editor' : ''}`}>
                        {ROLE_LABEL[m.role]}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {m.id !== me?.id && (
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmId(m.id)}>Remover</button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="hint">
        Função "Administrador" tem acesso total. "Editor" tem acesso a tudo — cifras, repertórios, dashboard — menos
        gerenciar membros. "Colaborador" só pode visualizar cifras e repertórios, sem importar, editar ou excluir nada.
      </div>

      {modalOpen && (
        <NovoMembroModal
          onClose={() => setModalOpen(false)}
          onInvited={() => {
            setModalOpen(false);
            loadAll();
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmId}
        message={`Remover o acesso de "${membroParaExcluir?.nome}"? Essa ação não pode ser desfeita.`}
        onConfirm={() => confirmId && removeMembro(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

function NovoMembroModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('colaborador');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!nome.trim() || !email.trim()) {
      setError('Preencha nome e e-mail.');
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke('invite-member', {
      body: { nome: nome.trim(), email: email.trim(), role },
    });
    setSaving(false);
    if (invokeError || data?.error) {
      setError(data?.error ?? invokeError?.message ?? 'Não foi possível enviar o convite.');
      return;
    }
    onInvited();
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>Adicionar Membro</h3>
        <div className="field">
          <label>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" />
        </div>
        <div className="field">
          <label>Função</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="colaborador">Colaborador</option>
            <option value="editor">Editor</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleInvite} disabled={saving}>
            {saving ? 'Enviando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
