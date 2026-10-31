// Path to Presidency scorekeeper UI. Renders from a single store; rules live in game.js.
import * as G from './game.js';
import { STATES, STATE_CODES, COUNTRIES, PALETTE, ev, stateName, WIN_EV } from './data.js';
import { renderMap, textOn } from './map.js';

const SAVE_KEY = 'presidente.save.v1';
const THEME_KEY = 'presidente.theme';
const HISTORY_MAX = 80;

const store = {
  game: null,
  history: [],
  tab: 'play',
  selected: null,
  statesOpen: false,
  sheet: null,
  draft: {
    players: [
      { name: '', color: PALETTE[0].hex },
      { name: '', color: PALETTE[1].hex },
    ],
    first: 0,
  },
};

// ---------- persistence ----------
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ game: store.game, history: store.history.slice(-HISTORY_MAX), draft: store.draft }));
  } catch { /* storage unavailable: play continues in memory */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.game?.v === 1) { store.game = d.game; store.history = d.history || []; }
    if (d.draft?.players?.length) store.draft = d.draft;
  } catch { /* ignore a corrupt save */ }
}

// ---------- theme ----------
function applyTheme(t) {
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
function getTheme() { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; } }
function cycleTheme() {
  const order = ['system', 'dark', 'light'];
  const next = order[(order.indexOf(getTheme()) + 1) % 3];
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  applyTheme(next);
  toast(next === 'system' ? 'Theme follows your phone' : `${next[0].toUpperCase() + next.slice(1)} mode`);
  render();
}

// ---------- helpers ----------
const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const locName = (loc) => (loc ? stateName(loc) : '—');
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function apply(fn) {
  try {
    const next = fn(store.game);
    store.history.push(store.game);
    if (store.history.length > HISTORY_MAX) store.history.shift();
    const prevPhase = store.game.phase;
    store.game = next;
    save();
    if (prevPhase === 'play' && next.phase === 'roundEnd') {
      // Round just ended: bring the scorekeeper to the round-over notice.
      store.tab = 'play';
      render();
      document.querySelector('.a-ctrl')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast(`Round ${next.round} is over`);
      return;
    }
    render();
    if (next.notice) toast(next.notice);
  } catch (e) {
    toast(e.message);
  }
}

function undo() {
  if (!store.history.length) return;
  store.game = store.history.pop();
  save();
  render();
  toast('Undid last action');
}

const ICON = {
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>',
  scores: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>',
};

function swatch(p, size = '') {
  const letter = size ? esc(p.name.slice(0, 1).toUpperCase()) : '';
  return `<span class="swatch ${size}" style="background:${p.color};color:${textOn(p.color)}">${letter}</span>`;
}

function statusChips(g, p) {
  const chips = [];
  if (p.out) chips.push(`<span class="chip out">Out in round ${p.eliminatedRound}</span>`);
  else {
    if (p.lost > 0) chips.push(`<span class="chip warn">Loses ${p.lost} more turn${p.lost > 1 ? 's' : ''}</span>`);
    if (p.stuck !== null) chips.push(`<span class="chip warn">${p.stuck ? `Stuck · ${p.stuck} roll${p.stuck > 1 ? 's' : ''} for a 7` : 'Stuck · draws next turn'}</span>`);
    for (const a of p.allies) chips.push(`<span class="chip">Allied: ${COUNTRIES[a].name}</span>`);
  }
  return chips.join('');
}

// ---------- header + tabs ----------
function header() {
  const g = store.game;
  const sub = g ? (g.phase === 'initial' ? 'Opening draw' : g.phase === 'over' ? 'Final' : `Round ${g.round}`) : 'New game';
  return `<header class="top">
    <h1 class="brand">Path to Presidency<small>${sub}</small></h1>
    ${g ? `<button class="icon-btn" data-act="undo" ${store.history.length ? '' : 'disabled'} aria-label="Undo last action">${ICON.undo}<span class="lbl-text">Undo</span></button>` : ''}
    <button class="icon-btn" data-act="theme" aria-label="Switch theme (now ${getTheme()})">${ICON.theme}</button>
    ${g ? `<button class="icon-btn" data-act="menu" aria-label="Game menu">${ICON.menu}</button>` : ''}
  </header>`;
}

function tabs() {
  const t = [['play', 'Play', ICON.dice], ['scores', 'Scores', ICON.scores], ['log', 'Log', ICON.log]];
  return `<nav class="tabs" aria-label="Sections">${t.map(([id, label, icon]) =>
    `<button data-act="tab" data-v="${id}" ${store.tab === id ? 'aria-current="page"' : ''}>${icon}${label}</button>`).join('')}</nav>`;
}

// ---------- setup ----------
function setupView() {
  const d = store.draft;
  const used = d.players.map((p) => p.color);
  const rows = d.players.map((p, i) => `
    <div class="player-row">
      <span class="seat" aria-hidden="true">${i + 1}</span>
      <input id="pname-${i}" data-input="name" data-i="${i}" value="${esc(p.name)}" placeholder="Player ${i + 1} name" autocomplete="off" maxlength="20" aria-label="Player ${i + 1} name">
      <div class="mini">
        <button data-act="up" data-i="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button data-act="remove" data-i="${i}" aria-label="Remove player" ${d.players.length <= 2 ? 'disabled' : ''}>✕</button>
      </div>
      <div class="palette" role="group" aria-label="Piece colour for player ${i + 1}">
        ${PALETTE.map((c) => `<button data-act="color" data-i="${i}" data-v="${c.hex}" style="background:${c.hex}" aria-label="${c.name}" aria-pressed="${p.color === c.hex}" ${used.includes(c.hex) && p.color !== c.hex ? 'disabled' : ''}></button>`).join('')}
      </div>
    </div>`).join('');
  return `<section class="view">
    <div class="card">
      <p class="eyebrow">Set up</p>
      <h2 class="title">Pick your party</h2>
      <p class="muted">Add everyone in clockwise seating order and choose the colour of their pieces.</p>
      <div>${rows}</div>
      <div class="row wrap" style="margin-top:12px">
        <button class="btn" data-act="add" ${d.players.length >= 8 ? 'disabled' : ''}>+ Add player</button>
        <span class="muted">${d.players.length} of 8 players</span>
      </div>
    </div>
    <div class="card stack">
      <label class="eyebrow" for="first">Who won the roll for first?</label>
      <select id="first" class="sel" data-input="first">
        ${d.players.map((p, i) => `<option value="${i}" ${+d.first === i ? 'selected' : ''}>${esc(p.name || `Player ${i + 1}`)}</option>`).join('')}
      </select>
      <button class="btn primary block" data-act="begin">Start the election</button>
    </div>
  </section>`;
}

// ---------- play ----------
function cardPicker(g, { initialOnly = false } = {}) {
  const p = G.current(g);
  const cards = STATE_CODES.map((c) => {
    const o = g.owner[c];
    const owner = o ? G.player(g, o) : null;
    const taken = initialOnly && o;
    return `<button data-act="${initialOnly ? 'initial' : 'draw'}" data-v="${c}" data-name="${esc(STATES[c][0].toLowerCase())} ${c.toLowerCase()}" class="${o && o !== p.id ? 'taken' : ''}" ${taken ? 'disabled' : ''}>
      ${owner ? swatch(owner) : '<span class="swatch" style="background:var(--free)"></span>'}
      <span class="n">${esc(STATES[c][0])}</span><span class="v">${STATES[c][1]}</span></button>`;
  }).join('');
  const specials = initialOnly ? '' : `<div class="specials">
      ${Object.entries(COUNTRIES).map(([c, x]) => `<button data-act="draw" data-v="${c}">${x.name}${p.allies.includes(c) ? '<br><span class="muted">allied</span>' : ''}</button>`).join('')}
      <button data-act="draw" data-v="STAY">Stay where you are</button>
    </div>`;
  return `<div class="stack">
    ${specials}
    <input id="card-search" class="search" type="search" placeholder="Find the state on the card…" autocomplete="off" data-input="search" aria-label="Search states">
    <div class="cards" id="cards">${cards}</div>
    <p id="cards-none" class="muted" style="margin:0" hidden>No state matches that search.</p>
  </div>`;
}

function turnCard(g) {
  const p = G.current(g);
  const mode = G.turnMode(g);
  let big = '';
  if (mode === 'move') {
    big = '';
  } else if (G.isCountryLoc(p.loc)) {
    big = p.lost ? `<div class="big-num">${p.lost}<small>turn${p.lost > 1 ? 's' : ''} left on vacation</small></div>` : `<div class="big-num">→<small>leaves on any roll but 7</small></div>`;
  } else if (p.stuck !== null) {
    big = `<div class="big-num">${p.stuck}<small>${p.stuck ? 'rolls left to hit a 7' : 'draws a card this turn'}</small></div>`;
  } else {
    big = `<div class="big-num">${p.remaining}<small>votes to roll out of ${esc(locName(p.loc))}</small></div>`;
  }

  let action = '';
  if (mode === 'roll') {
    action = `<p class="eyebrow">Enter the dice total</p>
      <div class="pad">
        ${[2, 3, 4, 5, 6].map((n) => `<button data-act="roll" data-v="${n}">${n}</button>`).join('')}
        <button class="seven" data-act="roll" data-v="7"><b>7</b> draw</button>
        ${[8, 9, 10, 11, 12].map((n) => `<button data-act="roll" data-v="${n}">${n}</button>`).join('')}
      </div>`;
  } else if (mode === 'lose') {
    action = `<p class="muted">${esc(p.name)} is ${p.loc === 'MX' || p.loc === 'CN' ? `on vacation in ${esc(locName(p.loc))}` : 'staying where they are'}. Turn ${5 - p.lost} of 4 lost.</p>
      <button class="btn primary block" data-act="lose">Skip ${esc(p.name)}'s turn</button>`;
  } else if (mode === 'draw' || mode === 'stuckDraw') {
    action = `<p class="eyebrow">${mode === 'stuckDraw' ? 'Stuck for 4 turns: draw a card' : 'Seven! Draw a card'}</p>
      ${g.notice ? `<div class="notice">${esc(g.notice)}</div>` : ''}
      ${cardPicker(g)}`;
  } else if (mode === 'move') {
    action = `<p class="eyebrow">Rolled ${g.pending.roll}. Where does ${esc(p.name)} go?</p>
      <div class="stack">${g.pending.options.map((o, i) => optionButton(o, i, 'choose')).join('')}</div>`;
  }

  return `<div class="card stack">
    <div class="turn-head">
      ${swatch(p, 'lg')}
      <div class="grow">
        <p class="eyebrow" style="margin:0">Now rolling</p>
        <h2 class="title">${esc(p.name)}</h2>
        <div class="loc">in ${esc(locName(p.loc))} <span class="muted">· ${G.votes(g, p.id)} votes</span></div>
      </div>
    </div>
    <div class="row wrap">${statusChips(g, p)}</div>
    ${big}
    ${action}
  </div>`;
}

function optionButton(o, i, act) {
  if (o.type === 'claim') {
    return `<button class="option claim" data-act="${act}" data-i="${i}"><span class="what"><b>Win ${esc(stateName(o.code))}</b><span>New state · adds ${ev(o.code)} votes</span></span><span class="ev">+${ev(o.code)}</span></button>`;
  }
  if (o.type === 'return') {
    return `<button class="option" data-act="${act}" data-i="${i}"><span class="what"><b>Back into ${esc(stateName(o.code))}</b><span>Already yours · roll out of ${ev(o.code)}, no new votes</span></span><span class="ev">${ev(o.code)}</span></button>`;
  }
  if (o.type === 'country') {
    return `<button class="option" data-act="${act}" data-i="${i}"><span class="what"><b>Go to ${esc(stateName(o.code))}</b><span>Allied · lose 4 turns, then take a free state on its border</span></span><span class="ev">${COUNTRIES[o.code].letter}</span></button>`;
  }
  if (o.type === 'start') {
    return `<button class="option" data-act="${act}" data-i="${i}"><span class="what"><b>Start in ${esc(stateName(o.code))}</b><span>Roll out of ${ev(o.code)}</span></span><span class="ev">${ev(o.code)}</span></button>`;
  }
  return `<button class="option" data-act="${act}" data-i="${i}"><span class="what"><b>Start in ${esc(stateName(o.code))}</b><span>Lose 4 turns to begin the round</span></span><span class="ev">${COUNTRIES[o.code].letter}</span></button>`;
}

function upNext(g) {
  const n = g.order.length;
  const rows = [];
  for (let i = 1; i < n; i++) {
    const p = G.player(g, g.order[(g.turn + i) % n]);
    if (p.out) continue;
    const where = G.isCountryLoc(p.loc) ? `${locName(p.loc)} · ${p.lost} lost` : p.stuck !== null ? `${locName(p.loc)} · stuck` : `${locName(p.loc)} · ${p.remaining} to go`;
    rows.push(`<div class="q">${swatch(p)}<span class="grow"><b>${esc(p.name)}</b> <span class="muted">${esc(where)}</span></span><span class="num">${G.votes(g, p.id)}</span></div>`);
  }
  if (!rows.length) return '';
  return `<div class="card"><p class="eyebrow">Up next</p><div class="queue">${rows.join('')}</div></div>`;
}

function mapCard(g, extra = '') {
  return `<div class="card stack">
    <div class="map-wrap" data-map>${renderMap({ owner: g.owner, players: g.players, currentId: g.phase === 'play' ? G.current(g).id : null, selected: store.selected })}</div>
    <div class="legend">${G.activePlayers(g).map((p) => `<span>${swatch(p)}${esc(p.name)} <b>${G.votes(g, p.id)}</b></span>`).join('')}<span><span class="swatch" style="background:var(--free)"></span>Free ${G.freeStates(g).length}</span></div>
    ${selectedInfo(g)}
    ${extra}
  </div>`;
}

function selectedInfo(g) {
  const c = store.selected;
  if (!c) return '';
  const o = g.owner[c];
  const owner = o ? G.player(g, o) : null;
  return `<div class="row">${owner ? swatch(owner) : '<span class="swatch" style="background:var(--free)"></span>'}<span class="grow"><b>${esc(stateName(c))}</b> · ${ev(c)} votes</span><span class="muted">${owner ? `Won by ${esc(owner.name)}` : 'Free'}</span></div>`;
}

// Map on top (phone) / wide on the left (tablet); controls under it / sticky on the right.
function layout(g, ctrl, rest = '') {
  return `<section class="view split">
    <div class="a-map">${mapCard(g)}</div>
    <div class="a-ctrl sticky">${ctrl}</div>
    <div class="a-rest stack">${rest}${statesCard(g)}</div>
  </section>`;
}

function playView() {
  const g = store.game;
  if (g.phase === 'initial') {
    const p = G.current(g);
    return layout(g, `<div class="card stack">
        <div class="turn-head">${swatch(p, 'lg')}<div class="grow"><p class="eyebrow" style="margin:0">Opening draw · ${((g.turn - g.firstTurn + g.order.length) % g.order.length) + 1} of ${g.order.length}</p><h2 class="title">${esc(p.name)}</h2></div></div>
        <p class="muted" style="margin:0">Draw from the state deck and tap the state on the card. ${esc(p.name)} places a piece there.</p>
        ${cardPicker(g, { initialOnly: true })}
      </div>`);
  }
  if (g.phase === 'play') {
    return layout(g, turnCard(g), upNext(g));
  }
  if (g.phase === 'roundEnd') return roundEndView(g);
  if (g.phase === 'nextStart') return nextStartView(g);
  return overView(g);
}

function roundEndView(g) {
  const sc = [...g.roundEnd.scores].sort((a, b) => b.votes - a.votes);
  const tied = g.roundEnd.tied;
  const rows = sc.map((x, i) => {
    const p = G.player(g, x.id);
    return `<div class="q">${swatch(p)}<span class="grow"><b>${esc(p.name)}</b></span><span class="num">${x.votes}</span></div>`;
  }).join('');
  const lowName = esc(G.player(g, tied[0]).name);
  const ctrl = tied.length > 1
    ? `<p class="notice">Tie for last place. Tied players roll, and the lowest roll is eliminated. Tap who rolled lowest.</p>
       <div class="stack">${tied.map((id) => `<button class="btn danger block" data-act="eliminate" data-v="${id}">${esc(G.player(g, id).name)} rolled lowest</button>`).join('')}</div>`
    : `<button class="btn danger block" data-act="eliminate" data-v="${tied[0]}">Eliminate ${lowName} and start round ${g.round + 1}</button>`;
  const early = g.roundEnd.early;
  const head = early
    ? `<h2 class="title">${esc(G.player(g, early.id).name)} can't catch up</h2>
      <div class="notice">Even winning all ${early.freeStates} free state${early.freeStates > 1 ? 's' : ''} (${early.free} votes) would leave ${esc(G.player(g, early.id).name)} at ${early.votes + early.free}, below every other player. The round ends now.</div>
      <p class="muted" style="margin:0">${esc(G.player(g, early.id).name)}'s states go back on the board. The free states stay free for the next round.</p>`
    : `<h2 class="title">All 51 states are taken</h2>
      <p class="muted" style="margin:0">Votes counted. The lowest total is eliminated and their states go back on the board.</p>`;
  return layout(g, `<div class="card stack">
      <p class="eyebrow">Round ${g.round} is over</p>
      ${head}
      <div class="queue">${rows}</div>
      ${ctrl}
    </div>`);
}

function nextStartView(g) {
  const p = G.player(g, g.startQueue[0]);
  const opts = G.startOptions(g, p);
  const first = G.player(g, g.order[g.turn]);
  return layout(g, `<div class="card stack">
      <p class="eyebrow">Round ${g.round + 1} setup</p>
      <div class="turn-head">${swatch(p, 'lg')}<div class="grow"><h2 class="title">${esc(p.name)}</h2><div class="loc">ended in ${esc(locName(p.loc))}</div></div></div>
      <p class="muted" style="margin:0">${esc(first.name)} has the most votes and goes first. Choose a state you own that connects to where you ended.</p>
      <div class="stack">${opts.map((o, i) => optionButton(o, i, 'start')).join('')}</div>
    </div>`);
}

function overView(g) {
  const w = g.winner ? G.player(g, g.winner) : null;
  return `<section class="view">
    <div class="card winner stack">
      <div class="stars">★ ★ ★</div>
      ${w ? `<div class="row" style="justify-content:center">${swatch(w, 'lg')}</div>
        <h2 class="title">${esc(w.name)} is President</h2>
        <p class="muted" style="margin:0">${G.votes(g, w.id)} electoral votes · Round ${g.round}</p>`
      : `<h2 class="title">269 to 269. It's a tie!</h2>
        <p class="muted" style="margin:0">Everyone is back in. Play the tiebreaker at the table: everyone rolls for each state, highest roll wins it, and the most votes after all 51 wins.</p>`}
      <button class="btn primary" data-act="new">New game</button>
    </div>
    ${mapCard(g)}
    ${statesCard(g)}
  </section>`;
}

// ---------- state-by-state list ----------
function statesCard(g) {
  const rows = STATE_CODES.map((c) => {
    const o = g.owner[c];
    const p = o ? G.player(g, o) : null;
    return `<tr data-act="select" data-v="${c}"><td>${esc(STATES[c][0])}</td><td>${p ? `<span class="row">${swatch(p)}${esc(p.name)}</span>` : '<span class="muted">Free</span>'}</td><td class="r">${STATES[c][1]}</td></tr>`;
  }).join('');
  const taken = 51 - G.freeStates(g).length;
  return `<details class="card states-card" id="states-list" ${store.statesOpen ? 'open' : ''}>
    <summary><span class="eyebrow" style="margin:0">Who won each state</span><span class="muted">${taken} of 51 taken</span></summary>
    <div style="overflow-x:auto;margin-top:8px"><table class="states"><tbody>${rows}</tbody></table></div>
  </details>`;
}

// ---------- scores tab ----------
function scoresView() {
  const g = store.game;
  const act = G.activePlayers(g).sort((a, b) => G.votes(g, b.id) - G.votes(g, a.id));
  const out = g.players.filter((p) => p.out).sort((a, b) => b.eliminatedRound - a.eliminatedRound);
  const taken = 51 - G.freeStates(g).length;
  const row = (p, i) => {
    const v = p.out ? (p.eliminatedVotes ?? 0) : G.votes(g, p.id);
    const owned = G.ownedBy(g, p.id).sort((a, b) => ev(b) - ev(a));
    const where = p.out ? '' : G.isCountryLoc(p.loc) ? `In ${locName(p.loc)}` : p.stuck !== null ? `Stuck in ${locName(p.loc)}` : `In ${locName(p.loc)} · ${p.remaining} to roll out`;
    return `<div class="score ${p.out ? 'out' : ''}">
      <div class="row">
        <span class="rank">${p.out ? '–' : i + 1}</span>${swatch(p)}
        <div class="grow"><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">${esc(where)}</div></div>
        <div class="votes">${v}<small>${p.out ? 'at elimination' : g.winner === p.id ? 'President' : `${Math.max(0, WIN_EV - v)} to win`}</small></div>
      </div>
      ${p.out ? '' : `<div class="bar" aria-label="${v} of 270 votes"><i style="width:${Math.min(1, v / WIN_EV) * 100}%;background:${p.color}"></i></div>`}
      <div class="row wrap">${statusChips(g, p)}</div>
      ${owned.length ? `<details><summary>${owned.length} state${owned.length > 1 ? 's' : ''} won</summary><div class="owned" style="margin-top:8px">${owned.map((c) => `<span>${esc(STATES[c][0])} ${ev(c)}</span>`).join('')}</div></details>` : ''}
    </div>`;
  };
  return `<section class="view">
    <div class="card">
      <p class="eyebrow">${g.phase === 'over' ? 'Final scoreboard' : `Round ${g.round} · ${taken} of 51 states taken`}</p>
      <h2 class="title">Scoreboard</h2>
      <p class="muted" style="margin:4px 0 0;font-size:13px">270 to win. A full bar means 270 votes.</p>
      <div>${act.map(row).join('')}${out.map((p) => row(p, 0)).join('')}</div>
    </div>
  </section>`;
}

// ---------- log tab ----------
function logView() {
  const g = store.game;
  return `<section class="view"><div class="card">
    <p class="eyebrow">Game log</p>
    ${g.log.length ? `<ul class="log">${g.log.map((l) => `<li><span class="rd">R${l.round}</span><span>${esc(l.text)}</span></li>`).join('')}</ul>` : '<p class="muted">Nothing yet.</p>'}
  </div></section>`;
}

// ---------- sheet ----------
function sheet() {
  if (store.sheet !== 'menu') return '';
  return `<div class="scrim" data-act="close"><div class="sheet" role="dialog" aria-modal="true" aria-label="Game menu" data-stop>
    <h2 class="title">Game menu</h2>
    <p class="muted" style="margin:0">Starting a new game clears this one. Player names and colours are kept.</p>
    <button class="btn danger block" data-act="confirm-new">Start a new game</button>
    <button class="btn block" data-act="close">Keep playing</button>
  </div></div>`;
}

// ---------- render ----------
function render() {
  const g = store.game;
  let body;
  if (!g) body = setupView();
  else if (store.tab === 'scores') body = scoresView();
  else if (store.tab === 'log') body = logView();
  else body = playView();
  const scrollY = window.scrollY;
  $app.innerHTML = `${header()}<main class="main">${body}</main>${g ? tabs() : ''}${sheet()}`;
  window.scrollTo(0, scrollY);
}

// ---------- events ----------
$app.addEventListener('click', (e) => {
  const mapHit = e.target.closest('[data-map] [data-code]');
  if (mapHit) { store.selected = mapHit.dataset.code === store.selected ? null : mapHit.dataset.code; render(); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (el.classList.contains('scrim') && e.target !== el) return; // taps inside the sheet don't close it
  const { act, v } = el.dataset;
  const i = el.dataset.i !== undefined ? +el.dataset.i : null;
  const d = store.draft;
  const g = store.game;
  switch (act) {
    case 'tab': store.tab = v; render(); window.scrollTo(0, 0); break;
    case 'theme': cycleTheme(); break;
    case 'undo': undo(); break;
    case 'menu': store.sheet = 'menu'; render(); break;
    case 'close': store.sheet = null; render(); break;
    case 'new': store.sheet = 'menu'; render(); break;
    case 'confirm-new': store.game = null; store.history = []; store.sheet = null; store.tab = 'play'; store.selected = null; save(); render(); break;
    case 'add': {
      const free = PALETTE.find((c) => !d.players.some((p) => p.color === c.hex));
      d.players.push({ name: '', color: free.hex }); save(); render();
      document.getElementById(`pname-${d.players.length - 1}`)?.focus();
      break;
    }
    case 'remove': d.players.splice(i, 1); d.first = Math.min(+d.first, d.players.length - 1); save(); render(); break;
    case 'up': [d.players[i - 1], d.players[i]] = [d.players[i], d.players[i - 1]]; save(); render(); break;
    case 'color': d.players[i].color = v; save(); render(); break;
    case 'begin': {
      const names = d.players.map((p) => p.name.trim());
      if (names.some((n) => !n)) { toast('Give every player a name.'); return; }
      if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) { toast('Each player needs a different name.'); return; }
      store.game = G.newGame(d.players, 'p' + d.first);
      store.history = []; store.tab = 'play'; store.selected = null;
      save(); render(); window.scrollTo(0, 0);
      break;
    }
    case 'initial': apply((s) => G.initialDraw(s, v)); break;
    case 'roll': apply((s) => G.roll(s, +v)); break;
    case 'draw': apply((s) => G.draw(s, v)); break;
    case 'lose': apply((s) => G.loseTurn(s)); break;
    case 'choose': apply((s) => G.choose(s, s.pending.options[i])); break;
    case 'eliminate': apply((s) => G.eliminate(s, v)); break;
    case 'start': apply((s) => G.chooseStart(s, G.startOptions(s, G.player(s, s.startQueue[0]))[i])); break;
    case 'select': store.selected = v; render(); document.querySelector('[data-map]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
    default: break;
  }
});

$app.addEventListener('toggle', (e) => {
  if (e.target.id === 'states-list') store.statesOpen = e.target.open;
}, true);

$app.addEventListener('input', (e) => {
  const el = e.target;
  const kind = el.dataset.input;
  if (kind === 'name') {
    const i = +el.dataset.i;
    store.draft.players[i].name = el.value;
    const opt = document.querySelector(`#first option[value="${i}"]`);
    if (opt) opt.textContent = el.value.trim() || `Player ${i + 1}`;
    save();
  }
  if (kind === 'first') { store.draft.first = +el.value; save(); }
  if (kind === 'search') {
    const q = el.value.trim().toLowerCase();
    let shown = 0;
    for (const b of document.querySelectorAll('#cards button')) {
      b.hidden = Boolean(q) && !b.dataset.name.includes(q);
      if (!b.hidden) shown += 1;
    }
    const none = document.getElementById('cards-none');
    if (none) none.hidden = shown > 0;
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && store.sheet) { store.sheet = null; render(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && store.game && !/INPUT|SELECT/.test(e.target.tagName)) { e.preventDefault(); undo(); }
});

// Keep the screen awake at the table.
async function keepAwake() {
  try { if (document.visibilityState === 'visible' && navigator.wakeLock) await navigator.wakeLock.request('screen'); } catch { /* optional */ }
}
document.addEventListener('visibilitychange', keepAwake);

// ---------- boot ----------
applyTheme(getTheme());
load();
render();
keepAwake();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable here */ });
}
