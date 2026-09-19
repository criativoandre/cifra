import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cifra, CifraBloco } from '@cifra-app/shared';
import { transposeChordToken, normalizeForDiagram, diagramSVG } from '@cifra-app/shared';
import { supabase } from '../lib/supabase';
import { useAutoFitFont } from '../lib/useAutoFitFont';
import { useAutoscroll } from '../lib/useAutoscroll';
import { usePreferences } from '../lib/usePreferences';
import OptionsSheet from '../components/OptionsSheet';

type PopoverKind = 'tom' | 'fonte' | 'rolagem' | null;

export default function Viewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cifra, setCifra] = useState<Cifra | null>(null);
  const [loading, setLoading] = useState(true);
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [fontPct, setFontPct] = useState(100);
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const { prefs, update, resetColors } = usePreferences();
  const { scrolling, speed, setSpeed, toggle: toggleScroll } = useAutoscroll();

  useEffect(() => {
    async function load(cifraId: string) {
      setLoading(true);
      const { data } = await supabase.from('cifras').select('*').eq('id', cifraId).single();
      setCifra((data as Cifra | null) ?? null);
      setTransposeSteps(0);
      setFontPct(100);
      setLoading(false);
    }
    if (id) load(id);
  }, [id]);

  useEffect(() => {
    return () => toggleScroll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const uniqueChords = useMemo(() => {
    if (!cifra) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    cifra.conteudo.forEach((b: CifraBloco) => {
      if (b.type === 'section' || !b.chords) return;
      b.chords
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .forEach((tok) => {
          const t = transposeChordToken(tok, transposeSteps);
          if (!seen.has(t)) {
            seen.add(t);
            order.push(t);
          }
        });
    });
    return order;
  }, [cifra, transposeSteps]);

  const bodyRef = useAutoFitFont(fontPct, [cifra?.id, transposeSteps]);
  const diagramRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightedChord, setHighlightedChord] = useState<string | null>(null);

  function jumpToDiagram(chord: string) {
    const el = diagramRefs.current[chord];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHighlightedChord(chord);
    setTimeout(() => setHighlightedChord((c) => (c === chord ? null : c)), 1200);
  }

  const currentTom = cifra?.tom_original ? transposeChordToken(cifra.tom_original, transposeSteps) : null;

  function togglePopover(p: PopoverKind) {
    setPopover((cur) => (cur === p ? null : p));
  }

  if (loading) return <div className="viewer-loading">Carregando...</div>;
  if (!cifra) return <div className="viewer-loading">Cifra não encontrada.</div>;

  return (
    <div className="viewer-screen">
      <header>
        <div className="top-row">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <div>
            <div className="song-title">{cifra.titulo}</div>
            <div className="song-sub">{cifra.cantor_ministerio}</div>
            {cifra.tom_original && (
              <div className="song-tom">
                Tom original: <span className="tom-note">{cifra.tom_original}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {prefs.showDiagrams && uniqueChords.length > 0 && (
        <div className="diagram-strip">
          {uniqueChords.map((chord) => (
            <div
              className={`diagram-card ${prefs.leftHanded ? 'flip' : ''} ${highlightedChord === chord ? 'hl' : ''}`}
              key={chord}
              ref={(el) => (diagramRefs.current[chord] = el)}
            >
              <div dangerouslySetInnerHTML={{ __html: diagramSVG(normalizeForDiagram(chord)) }} />
              <div className="cname">{chord}</div>
            </div>
          ))}
        </div>
      )}

      <main>
        {prefs.showTab && cifra.tablatura && (
          <div className="tab-block">
            <div className="block-label">Tablatura</div>
            <pre>{cifra.tablatura}</pre>
          </div>
        )}
        {prefs.showBeat && cifra.batida && (
          <div className="beat-block">
            <div className="block-label">Batida</div>
            {cifra.batida}
          </div>
        )}

        <div className="song-body" ref={bodyRef}>
          {cifra.conteudo.map((bloco: CifraBloco, i: number) => {
            if (bloco.type === 'section') {
              return (
                <div className="section-title" key={i}>
                  {bloco.label}
                </div>
              );
            }
            const isChordOnly = !bloco.lyric;
            const next = cifra.conteudo[i + 1];
            const tight = Boolean(isChordOnly && next && next.type !== 'section' && !next.lyric);
            return (
              <div className={`line-pair ${tight ? 'tight' : ''}`} key={i}>
                {bloco.chords && (
                  <div className="chord-line">
                    {bloco.chords
                      .split(/(\s+)/)
                      .map((part, j) => {
                        if (!part.trim()) return part;
                        const transposed = transposeChordToken(part, transposeSteps);
                        return (
                          <span key={j} className="chord" onClick={() => jumpToDiagram(transposed)}>
                            {transposed}
                          </span>
                        );
                      })}
                  </div>
                )}
                {bloco.lyric && <div className="lyric-line">{bloco.lyric}</div>}
              </div>
            );
          })}
        </div>

        <div className="note">
          Toque em qualquer acorde do texto para ver o diagrama correspondente em destaque no topo.
        </div>
      </main>

      <OptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        prefs={prefs}
        onChange={update}
        onReset={resetColors}
        hasTab={!!cifra.tablatura}
        hasBeat={!!cifra.batida}
      />

      {popover === 'tom' && (
        <PopoverBox>
          <button className="icon-btn" onClick={() => setTransposeSteps((s) => s - 1)}>−</button>
          <span className="tool-label">{currentTom ?? '-'}</span>
          <button className="icon-btn" onClick={() => setTransposeSteps((s) => s + 1)}>+</button>
        </PopoverBox>
      )}
      {popover === 'fonte' && (
        <PopoverBox>
          <button className="icon-btn" onClick={() => setFontPct((p) => Math.max(80, p - 5))}>A−</button>
          <span className="tool-label">{fontPct}%</span>
          <button className="icon-btn" onClick={() => setFontPct((p) => Math.min(120, p + 5))}>A+</button>
        </PopoverBox>
      )}
      {popover === 'rolagem' && scrolling && (
        <PopoverBox wide>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Velocidade</label>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            style={{ flex: 1 }}
          />
        </PopoverBox>
      )}

      <nav className="bottom-bar">
        <BBButton label="Tom" icon="±" onClick={() => togglePopover('tom')} />
        <BBButton label="Fonte" icon="A" onClick={() => togglePopover('fonte')} />
        <BBButton
          label="Rolagem"
          icon={scrolling ? '❚❚' : '▶'}
          active={scrolling}
          onClick={() => {
            const willScroll = !scrolling;
            setPopover(willScroll ? 'rolagem' : null);
            toggleScroll();
          }}
        />
        <BBButton
          label="Opções"
          icon="⚙"
          onClick={() => {
            setPopover(null);
            setOptionsOpen(true);
          }}
        />
      </nav>
    </div>
  );
}

function PopoverBox({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className="bb-popover open"
      style={{ position: 'fixed', bottom: 78, left: '50%', transform: 'translateX(-50%)', width: wide ? 220 : undefined }}
    >
      {children}
    </div>
  );
}

function BBButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button className="bb-btn" onClick={onClick}>
      <span className={`bb-icon ${active ? 'active' : ''}`}>{icon}</span>
      <span className="bb-label">{label}</span>
    </button>
  );
}
