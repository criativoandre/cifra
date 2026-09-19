import { useEffect, useState } from 'react';

export interface ViewerPrefs {
  theme: 'light' | 'dark' | null;
  showDiagrams: boolean;
  showTab: boolean;
  showBeat: boolean;
  leftHanded: boolean;
  colorChord: string | null;
  colorDot: string | null;
  colorLyric: string | null;
}

const STORAGE_KEY = 'cifra_app_viewer_prefs';

const DEFAULT_PREFS: ViewerPrefs = {
  theme: null,
  showDiagrams: true,
  showTab: false,
  showBeat: false,
  leftHanded: false,
  colorChord: null,
  colorDot: null,
  colorLyric: null,
};

function load(): ViewerPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    /* localStorage indisponível — segue com os padrões */
  }
  return DEFAULT_PREFS;
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<ViewerPrefs>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignora falha de storage */
    }

    const root = document.documentElement;
    if (prefs.theme) root.setAttribute('data-theme', prefs.theme);
    else root.removeAttribute('data-theme');

    if (prefs.colorChord) root.style.setProperty('--chord', prefs.colorChord);
    else root.style.removeProperty('--chord');
    if (prefs.colorDot) root.style.setProperty('--diagram-dot', prefs.colorDot);
    else root.style.removeProperty('--diagram-dot');
    if (prefs.colorLyric) root.style.setProperty('--lyric-color', prefs.colorLyric);
    else root.style.removeProperty('--lyric-color');
  }, [prefs]);

  function update(partial: Partial<ViewerPrefs>) {
    setPrefs((p) => ({ ...p, ...partial }));
  }

  function resetColors() {
    update({ colorChord: null, colorDot: null, colorLyric: null });
  }

  return { prefs, update, resetColors };
}
