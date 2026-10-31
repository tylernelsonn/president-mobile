// SVG electoral map: states filled by owner colour, Mexico/Canada boxes, player pins.
import { MAP_PATHS } from './map-paths.js';
import { STATES, COUNTRIES } from './data.js';

const SMALL = new Set(['RI', 'DE', 'DC', 'CT', 'NJ', 'MA', 'NH', 'VT', 'MD', 'WV']);
const LABEL_NUDGE = { FL: [12, 6], MI: [10, 18], LA: [-10, 0], KY: [6, 2], CA: [-6, 0], ID: [0, 16], HI: [6, 0] };
const COUNTRY_BOX = {
  CN: { x: 150, y: -58, w: 700, h: 48, lx: 172, px: 560, cy: -34 },
  MX: { x: 330, y: 620, w: 330, h: 50, lx: 350, px: 560, cy: 645 },
};
export const VIEWBOX = '0 -64 975 740';

export function textOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#111';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#141a26' : '#ffffff';
}

function pos(loc) {
  if (COUNTRY_BOX[loc]) return [COUNTRY_BOX[loc].px, COUNTRY_BOX[loc].cy];
  const [x, y] = MAP_PATHS[loc].c;
  const n = LABEL_NUDGE[loc] || [0, 0];
  return [x + n[0], y + n[1]];
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// opts: { owner: {code: playerId}, players: [...], currentId, selected, showPins }
export function renderMap({ owner, players, currentId, selected, showPins = true, title = 'Electoral map' }) {
  const color = Object.fromEntries(players.map((p) => [p.id, p.color]));
  const out = [];
  out.push(`<svg class="map" viewBox="${VIEWBOX}" role="img" aria-label="${esc(title)}">`);

  for (const [c, box] of Object.entries(COUNTRY_BOX)) {
    out.push(`<rect class="country" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="10"/>`);
    out.push(`<text class="country-lbl" x="${box.lx}" y="${box.cy}">${COUNTRIES[c].name.toUpperCase()}</text>`);
  }

  for (const code of Object.keys(STATES)) {
    if (code === 'DC') continue;
    const o = owner[code];
    const fill = o ? `style="fill:${color[o]}"` : '';
    const cls = `st${o ? '' : ' free'}${selected === code ? ' sel' : ''}`;
    out.push(`<path class="${cls}" ${fill} d="${MAP_PATHS[code].d}" data-code="${code}"><title>${esc(STATES[code][0])} · ${STATES[code][1]}</title></path>`);
  }
  // D.C. is too small to see: draw it as a dot.
  {
    const [x, y] = MAP_PATHS.DC.c;
    const o = owner.DC;
    out.push(`<circle class="st${o ? '' : ' free'}${selected === 'DC' ? ' sel' : ''}" ${o ? `style="fill:${color[o]}"` : ''} cx="${x + 22}" cy="${y + 12}" r="9" data-code="DC"><title>Washington D.C. · 3</title></circle>`);
    out.push(`<path d="M${x} ${y}L${x + 15} ${y + 8}" stroke="var(--muted)" stroke-width="1"/>`);
  }
  for (const code of Object.keys(STATES)) {
    if (SMALL.has(code)) continue;
    const [x, y] = pos(code);
    const o = owner[code];
    const fill = o ? textOn(color[o]) : 'var(--muted)';
    out.push(`<text class="lbl" x="${x}" y="${y}" style="fill:${fill}">${code}</text>`);
  }

  if (showPins) {
    const groups = {};
    for (const p of players) if (!p.out && p.loc) (groups[p.loc] ||= []).push(p);
    for (const [loc, ps] of Object.entries(groups)) {
      let [x, y] = loc === 'DC' ? [MAP_PATHS.DC.c[0] + 22, MAP_PATHS.DC.c[1] + 12] : pos(loc);
      const spread = COUNTRY_BOX[loc] ? 44 : 34;
      ps.forEach((p, i) => {
        const px = x + (i - (ps.length - 1) / 2) * spread + (COUNTRY_BOX[loc] ? 0 : 0);
        const py = COUNTRY_BOX[loc] ? y : y - 30;
        if (p.id === currentId) out.push(`<circle class="pin-ring" cx="${px}" cy="${py}" r="23"/>`);
        out.push(`<circle class="pin" cx="${px}" cy="${py}" r="16" style="fill:${p.color}"/>`);
        out.push(`<text class="pin-t" x="${px}" y="${py + 1}" style="fill:${textOn(p.color)}">${esc(p.name.slice(0, 1).toUpperCase())}</text>`);
      });
    }
  }
  out.push('</svg>');
  return out.join('');
}
