import { useEffect, useState } from 'react';
import type { Cifra, CifraBloco, Repertorio } from '@cifra-app/shared';
import { useAuth } from '@cifra-app/shared';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';

interface ParsedCifra {
  titulo: string | null;
  cantor_ministerio: string | null;
  compositor: string | null;
  tom_original: string | null;
  afinacao: string | null;
  tem_tablatura: boolean;
  tablatura: string | null;
  tem_batida: boolean;
  batida: string | null;
  conteudo: CifraBloco[];
}


export default function CifrasPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'administrador' || profile?.role === 'editor';
  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function loadAll() {
    const [{ data: cifrasData }, { data: repsData }] = await Promise.all([
      supabase.from('cifras').select('*').order('titulo'),
      supabase.from('repertorios').select('*').order('nome'),
    ]);
    setCifras((cifrasData as Cifra[]) ?? []);
    setRepertorios((repsData as Repertorio[]) ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = cifras.filter((c) => {
    const term = search.toLowerCase();
    return c.titulo.toLowerCase().includes(term) || c.cantor_ministerio.toLowerCase().includes(term);
  });

  async function updateRepertorio(cifraId: string, repertorioId: string) {
    await supabase.from('cifras').update({ repertorio_id: repertorioId || null }).eq('id', cifraId);
    loadAll();
  }

  async function removeCifra(cifraId: string) {
    await supabase.from('cifras').delete().eq('id', cifraId);
    setConfirmId(null);
    loadAll();
  }

  const cifraParaExcluir = cifras.find((c) => c.id === confirmId);

  return (
    <div>
      <div className="panel">
        <div className="panel-head">
          <h2>Cifras</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="search-input" placeholder="Buscar por título ou cantor..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {canWrite && <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Nova Cifra</button>}
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cantor/Ministério</th>
                <th>Repertório</th>
                {canWrite && <th />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.titulo}</td>
                  <td>{c.cantor_ministerio}</td>
                  <td>
                    {canWrite ? (
                      <select className="repertorio-select" value={c.repertorio_id ?? ''} onChange={(e) => updateRepertorio(c.id, e.target.value)}>
                        <option value="">Sem repertório</option>
                        {repertorios.map((r) => (
                          <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                      </select>
                    ) : (
                      repertorios.find((r) => r.id === c.repertorio_id)?.nome ?? 'Sem repertório'
                    )}
                  </td>
                  {canWrite && (
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirmId(c.id)}>Remover</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <NovaCifraModal
          repertorios={repertorios}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            loadAll();
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmId}
        message={`Remover a cifra "${cifraParaExcluir?.titulo}"? Essa ação não pode ser desfeita.`}
        onConfirm={() => confirmId && removeCifra(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

function NovaCifraModal({
  repertorios,
  onClose,
  onCreated,
}: {
  repertorios: Repertorio[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [cantor, setCantor] = useState('');
  const [repertorioId, setRepertorioId] = useState('');
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCifra | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileLabel(f.name);
    setParseError(null);
    setParsing(true);

    const form = new FormData();
    form.append('file', f);
    const { data, error } = await supabase.functions.invoke('parse-cifra', { body: form });
    setParsing(false);

    if (error || data?.error) {
      setParseError(data?.error ?? error?.message ?? 'Não foi possível ler o arquivo.');
      // mesmo se o parser falhar, sugere título/cantor pelo nome do arquivo, pra não travar o cadastro
      const name = f.name.replace(/\.(pdf|txt)$/i, '').replace(/_+/g, ' ');
      const cap = (s: string) => s.trim().split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
      setTitulo(cap(name));
      return;
    }

    const result = data.data as ParsedCifra;
    setParsed(result);
    if (result.titulo) setTitulo(result.titulo);
    if (result.cantor_ministerio) setCantor(result.cantor_ministerio);
  }

  async function handleSave() {
    if (!titulo.trim() || !cantor.trim()) {
      alert('Preencha título e cantor/ministério.');
      return;
    }
    setSaving(true);

    let arquivoUrl: string | null = null;
    if (file && profile?.organizacao_id) {
      const path = `${profile.organizacao_id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('cifras-arquivos').upload(path, file);
      if (!uploadError) arquivoUrl = path;
    }

    const { data: userRes } = await supabase.auth.getUser();
    await supabase.from('cifras').insert({
      titulo: titulo.trim(),
      cantor_ministerio: cantor.trim(),
      compositor: parsed?.compositor ?? null,
      tom_original: parsed?.tom_original ?? null,
      afinacao: parsed?.afinacao ?? null,
      repertorio_id: repertorioId || null,
      conteudo: parsed?.conteudo ?? [],
      tem_tablatura: parsed?.tem_tablatura ?? false,
      tablatura: parsed?.tablatura ?? null,
      tem_batida: parsed?.tem_batida ?? false,
      batida: parsed?.batida ?? null,
      arquivo_original_url: arquivoUrl,
      uploaded_by: userRes.user?.id,
    });
    setSaving(false);
    onCreated();
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>Nova Cifra</h3>
        <label className="upload-box" htmlFor="cifraFile">
          {parsing && '⏳ Lendo o arquivo...'}
          {!parsing && fileLabel && `✅ Arquivo recebido: ${fileLabel}`}
          {!parsing && !fileLabel && '📄 Toque para enviar um PDF ou TXT'}
          <br />
          <span style={{ fontSize: '0.72rem' }}>
            {parsed
              ? `${parsed.conteudo.length} bloco(s) de letra/acorde reconhecidos automaticamente.`
              : 'A letra e os acordes são extraídos automaticamente, preservando a posição de cada acorde.'}
          </span>
        </label>
        <input id="cifraFile" type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={onFileChange} />
        {parseError && (
          <div className="error-msg">
            Não consegui ler o conteúdo automaticamente ({parseError}). Você ainda pode salvar preenchendo os campos
            abaixo — só o texto da cifra em si vai ficar vazio, pra editar depois.
          </div>
        )}

        <div className="field">
          <label>Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Vou Subir" />
        </div>
        <div className="field">
          <label>Cantor / Ministério</label>
          <input value={cantor} onChange={(e) => setCantor(e.target.value)} placeholder="Ex: Ministério Exemplo" />
        </div>
        <div className="field">
          <label>Repertório (opcional)</label>
          <select value={repertorioId} onChange={(e) => setRepertorioId(e.target.value)}>
            <option value="">Sem repertório</option>
            {repertorios.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || parsing}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
