interface Props {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, message, confirmLabel = 'Excluir', onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h3>Confirmar ação</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', margin: '0 0 18px' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={{ background: 'var(--danger)', color: '#fff' }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
