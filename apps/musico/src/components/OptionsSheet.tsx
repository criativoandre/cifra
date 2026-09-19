import type { ViewerPrefs } from '../lib/usePreferences';

interface Props {
  open: boolean;
  onClose: () => void;
  prefs: ViewerPrefs;
  onChange: (partial: Partial<ViewerPrefs>) => void;
  onReset: () => void;
  hasTab: boolean;
  hasBeat: boolean;
}

export default function OptionsSheet({ open, onClose, prefs, onChange, onReset, hasTab, hasBeat }: Props) {
  return (
    <>
      <div className={`overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`options-panel ${open ? 'open' : ''}`}>
        <button className="close-panel" onClick={onClose}>✕</button>
        <h3>Opções</h3>

        <Row icon="🎸" label="Mostrar acordes (topo)">
          <Switch checked={prefs.showDiagrams} onChange={(v) => onChange({ showDiagrams: v })} />
        </Row>

        {hasTab && (
          <Row icon="🎼" label="Mostrar tablatura">
            <Switch checked={prefs.showTab} onChange={(v) => onChange({ showTab: v })} />
          </Row>
        )}

        {hasBeat && (
          <Row icon="🥁" label="Mostrar batida">
            <Switch checked={prefs.showBeat} onChange={(v) => onChange({ showBeat: v })} />
          </Row>
        )}

        <Row icon="🤚" label="Modo canhoto (diagramas)">
          <Switch checked={prefs.leftHanded} onChange={(v) => onChange({ leftHanded: v })} />
        </Row>

        <Row icon="🌙" label="Tema escuro">
          <Switch checked={prefs.theme === 'dark'} onChange={(v) => onChange({ theme: v ? 'dark' : 'light' })} />
        </Row>

        <Row icon="🎨" label="Cor das notas">
          <input type="color" value={prefs.colorChord ?? '#7c1329'} onChange={(e) => onChange({ colorChord: e.target.value })} />
        </Row>

        <Row icon="⚪" label="Cor das bolinhas (diagramas)">
          <input type="color" value={prefs.colorDot ?? '#000000'} onChange={(e) => onChange({ colorDot: e.target.value })} />
        </Row>

        <Row icon="✏️" label="Cor da letra">
          <input type="color" value={prefs.colorLyric ?? '#1b1d22'} onChange={(e) => onChange({ colorLyric: e.target.value })} />
        </Row>

        <button className="opt-reset" onClick={onReset}>Restaurar cores padrão</button>
      </div>
    </>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="opt-row">
      <span className="opt-label">
        <span className="opt-icon">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="slider-tg" />
    </label>
  );
}
