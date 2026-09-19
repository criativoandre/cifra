// Portado 1:1 do protótipo HTML já validado manualmente contra PDFs reais
// do Cifra Club (transposição, reconhecimento de acorde composto, diagramas).
// Qualquer ajuste aqui deve ser refeito também lá se o protótipo continuar em uso.

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function noteIndex(note: string): number {
  let i = SHARPS.indexOf(note);
  if (i === -1) i = FLATS.indexOf(note);
  return i;
}

export function transposeNote(note: string, steps: number): string {
  const i = noteIndex(note);
  if (i === -1) return note;
  const useFlat = note.includes('b');
  const ni = (((i + steps) % 12) + 12) % 12;
  return useFlat ? FLATS[ni] : SHARPS[ni];
}

// reconhece token de acorde: raiz + resto (qualidade/extensão) + baixo opcional (ex: "F#m7", "D/F#")
const CHORD_RE = /^([A-G](?:#|b)?)([a-zA-Z0-9+-]*)(?:\/([A-G](?:#|b)?))?$/;

export function transposeChordToken(token: string, steps: number): string {
  const m = token.match(CHORD_RE);
  if (!m) return token;
  const [, root, rest, bass] = m;
  let out = transposeNote(root, steps) + rest;
  if (bass) out += '/' + transposeNote(bass, steps);
  return out;
}

// normaliza pra achar o diagrama (ignora extensões numéricas/maj/sus etc, mantém "m")
export function normalizeForDiagram(token: string): string {
  const m = token.match(CHORD_RE);
  if (!m) return token;
  const [, root, rest] = m;
  const quality = /^m(?!aj)/.test(rest) ? 'm' : '';
  return root + quality;
}

// dicionário de diagramas (violão, 6 cordas). string: 'x' abafada, '0' solta, número = casa
export const CHORD_SHAPES: Record<string, string> = {
  C: 'x32010', 'C#': 'x43121', Db: 'x43121', D: 'xx0232', 'D#': 'x65343', Eb: 'xx1343',
  E: '022100', F: '133211', 'F#': '244322', Gb: '244322', G: '320003', 'G#': '466544', Ab: '466544',
  A: 'x02220', 'A#': 'x13331', Bb: 'x13331', B: 'x24442',
  Cm: 'x35543', 'C#m': 'x46654', Dbm: 'x46654', Dm: 'xx0231', 'D#m': 'x68876', Ebm: 'x68876',
  Em: '022000', Fm: '133111', 'F#m': '244222', Gbm: '244222', Gm: '355333', 'G#m': '466444', Abm: '466444',
  Am: 'x02210', 'A#m': 'x13321', Bbm: 'x13321', Bm: 'x24432',
};
const GENERIC_SHAPE = 'xxxxxx';

// gera o SVG do diagrama (usa as CSS vars --diagram-line/--diagram-dot já definidas no design system)
export function diagramSVG(chordName: string): string {
  const shape = CHORD_SHAPES[chordName] || GENERIC_SHAPE;
  const strings = shape.split('');
  const w = 60, h = 68, left = 8, top = 14;
  const sSpace = (w - 2 * left) / 5;
  const fSpace = (h - top - 6) / 4;
  let s = `<svg viewBox="0 0 ${w} ${h}" width="60" height="68">`;
  s += `<rect x="${left}" y="${top - 2}" width="${w - 2 * left}" height="2.5" fill="var(--diagram-line)"/>`;
  for (let f = 0; f <= 4; f++) {
    const y = top + f * fSpace;
    s += `<line x1="${left}" y1="${y}" x2="${w - left}" y2="${y}" stroke="var(--diagram-line)" stroke-width="1"/>`;
  }
  for (let c = 0; c < 6; c++) {
    const x = left + c * sSpace;
    s += `<line x1="${x}" y1="${top}" x2="${x}" y2="${h - 6}" stroke="var(--diagram-line)" stroke-width="1"/>`;
    const mark = strings[c];
    const my = top - 7;
    if (mark === 'x') {
      s += `<text x="${x}" y="${my + 5}" font-size="7" text-anchor="middle" fill="var(--diagram-line)">&#215;</text>`;
    } else if (mark === '0') {
      s += `<circle cx="${x}" cy="${my}" r="2.6" fill="none" stroke="var(--diagram-line)" stroke-width="1.1"/>`;
    } else {
      const fret = parseInt(mark, 10);
      if (fret >= 1 && fret <= 4) {
        const dy = top + (fret - 0.5) * fSpace;
        s += `<circle cx="${x}" cy="${dy}" r="4.2" fill="var(--diagram-dot)"/>`;
      }
    }
  }
  s += '</svg>';
  return s;
}
