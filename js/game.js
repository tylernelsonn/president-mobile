// Presidente rules engine. Every action takes a state and returns a new state
// (the input is never mutated), so the UI can keep an undo stack of snapshots.

import { STATES, ADJ, BORDERS, COUNTRIES, ev, stateName, WIN_EV } from './data.js';

const LOST_TURNS = 4;
const STUCK_TURNS = 4;
const ALL_STATES = Object.keys(STATES);

const clone = (s) => JSON.parse(JSON.stringify(s));
const isCountry = (loc) => loc != null && loc in COUNTRIES;
export const isCountryLoc = isCountry;
const label = (loc) => stateName(loc);

// ---------- queries ----------

export const player = (s, id) => s.players.find((p) => p.id === id);
export const current = (s) => player(s, s.order[s.turn]);
export const activePlayers = (s) => s.order.map((id) => player(s, id)).filter((p) => !p.out);
export const ownedBy = (s, id) => ALL_STATES.filter((c) => s.owner[c] === id);
export const votes = (s, id) => ownedBy(s, id).reduce((t, c) => t + ev(c), 0);
export const freeStates = (s) => ALL_STATES.filter((c) => !s.owner[c]);
export const isFree = (s, c) => c in STATES && !s.owner[c];

// Neighbours of a location: states, plus countries the state borders.
function neighbours(loc) {
  if (isCountry(loc)) return [...BORDERS[loc]];
  const out = [...ADJ[loc]];
  for (const c of Object.keys(BORDERS)) if (BORDERS[c].includes(loc)) out.push(c);
  return out;
}

// Can player reach a free state starting at `start`, walking only through
// states they own and countries they are allied with?
// `from` (the state being left) is not walked back through.
function leadsToFree(s, p, start, from) {
  const seen = new Set([start, from]);
  const queue = [start];
  while (queue.length) {
    const at = queue.shift();
    for (const n of neighbours(at)) {
      if (isFree(s, n)) return true;
      if (seen.has(n)) continue;
      const walkable = isCountry(n) ? p.allies.includes(n) : s.owner[n] === p.id;
      if (walkable) { seen.add(n); queue.push(n); }
    }
  }
  return false;
}

// Where a player may go after rolling out of a state.
export function moveOptions(s, p) {
  const from = p.loc;
  const opts = [];
  for (const n of ADJ[from]) if (isFree(s, n)) opts.push({ type: 'claim', code: n });
  for (const n of ADJ[from]) {
    if (s.owner[n] === p.id && leadsToFree(s, p, n, from)) opts.push({ type: 'return', code: n });
  }
  for (const c of Object.keys(BORDERS)) {
    if (BORDERS[c].includes(from) && p.allies.includes(c) && BORDERS[c].some((b) => isFree(s, b))) {
      opts.push({ type: 'country', code: c });
    }
  }
  return opts;
}

// Where a player may go when leaving Mexico or Canada.
export function countryExitOptions(s, p) {
  const c = p.loc;
  return [
    ...BORDERS[c].filter((b) => isFree(s, b)).map((b) => ({ type: 'claim', code: b })),
    ...BORDERS[c].filter((b) => s.owner[b] === p.id).map((b) => ({ type: 'return', code: b })),
  ];
}

// Where a surviving player may begin the next round.
export function startOptions(s, p) {
  const opts = [];
  if (isCountry(p.loc)) {
    for (const b of BORDERS[p.loc]) if (s.owner[b] === p.id) opts.push({ type: 'start', code: b });
    opts.push({ type: 'startCountry', code: p.loc });
    return opts;
  }
  opts.push({ type: 'start', code: p.loc });
  for (const n of ADJ[p.loc]) if (s.owner[n] === p.id) opts.push({ type: 'start', code: n });
  for (const c of Object.keys(BORDERS)) {
    if (BORDERS[c].includes(p.loc) && p.allies.includes(c)) opts.push({ type: 'startCountry', code: c });
  }
  return opts;
}

// What the current player has to do now.
export function turnMode(s) {
  const p = current(s);
  if (s.pending) return s.pending.kind; // 'move' | 'draw'
  if (p.lost > 0) return 'lose';
  if (p.stuck === 0) return 'stuckDraw';
  return 'roll';
}

// ---------- setup ----------

export function newGame(players, firstId) {
  // players: [{name, color}] in clockwise seating order.
  const ps = players.map((p, i) => ({
    id: 'p' + i, name: p.name.trim(), color: p.color,
    loc: null, remaining: 0, lost: 0, stuck: null, allies: [], out: false, sheet: [],
  }));
  const order = ps.map((p) => p.id);
  const first = Math.max(0, order.indexOf(firstId));
  return {
    v: 1, phase: 'initial', round: 1, players: ps, order,
    turn: first, firstTurn: first, owner: {}, pending: null,
    winner: null, tie: false, notice: null, log: [],
    roundEnd: null, startQueue: [],
  };
}

function note(s, text) {
  s.log.unshift({ round: s.round, text });
  if (s.log.length > 200) s.log.length = 200;
}

export function initialDraw(prev, code) {
  const s = clone(prev);
  if (s.phase !== 'initial') throw new Error('Not in the opening draw.');
  if (!isFree(s, code)) throw new Error(`${label(code)} is already taken. Draw again.`);
  const p = current(s);
  claim(s, p, code);
  note(s, `${p.name} drew ${label(code)} (${ev(code)})`);
  s.turn = (s.turn + 1) % s.order.length;
  if (s.turn === s.firstTurn) { s.phase = 'play'; note(s, 'The election begins!'); }
  return s;
}

// ---------- play ----------

function claim(s, p, code) {
  s.owner[code] = p.id;
  p.loc = code;
  p.remaining = ev(code);
  p.stuck = null;
  p.sheet.push({ t: String(ev(code)), dot: true });
}

function moveInto(s, p, code) {
  p.loc = code;
  p.remaining = ev(code);
  p.stuck = null;
  p.sheet.push({ t: String(ev(code)), dot: false });
}

function becomeStuck(s, p) {
  p.stuck = STUCK_TURNS;
  p.remaining = 0;
  p.sheet.push({ t: 'stuck', dot: false });
  note(s, `${p.name} is stuck in ${label(p.loc)}. ${STUCK_TURNS} turns to roll a 7.`);
}

export function roll(prev, n) {
  const s = clone(prev);
  if (s.phase !== 'play') throw new Error('Not time to roll.');
  if (turnMode(s) === 'stuckDraw') throw new Error('Draw a card instead of rolling.');
  if (turnMode(s) !== 'roll') throw new Error('Not time to roll.');
  if (!(n >= 2 && n <= 12)) throw new Error('Enter a dice total from 2 to 12.');
  const p = current(s);
  s.notice = null;

  if (n === 7) {
    s.pending = { kind: 'draw', reason: 'seven' };
    note(s, `${p.name} rolled a 7 and draws a card`);
    return s;
  }

  if (p.stuck !== null) {
    p.stuck -= 1;
    p.sheet.push({ t: `(${n})`, dot: false });
    note(s, `${p.name} rolled ${n} while stuck. ${p.stuck ? p.stuck + ' left' : 'Draws a card next turn'}`);
    return endTurn(s);
  }

  if (isCountry(p.loc)) {
    const opts = countryExitOptions(s, p);
    note(s, `${p.name} rolled ${n} and leaves ${label(p.loc)}`);
    if (!opts.length) { becomeStuck(s, p); return endTurn(s); }
    s.pending = { kind: 'move', options: opts, roll: n };
    return s;
  }

  p.remaining -= n;
  if (p.remaining > 0) {
    p.sheet.push({ t: String(p.remaining), dot: false });
    note(s, `${p.name} rolled ${n}: ${p.remaining} left in ${label(p.loc)}`);
    return endTurn(s);
  }
  p.remaining = 0;
  const opts = moveOptions(s, p);
  note(s, `${p.name} rolled ${n} and is out of ${label(p.loc)}`);
  if (!opts.length) { becomeStuck(s, p); return endTurn(s); }
  s.pending = { kind: 'move', options: opts, roll: n };
  return s;
}

export function choose(prev, opt) {
  const s = clone(prev);
  if (!s.pending || s.pending.kind !== 'move') throw new Error('No move to choose.');
  const ok = s.pending.options.some((o) => o.type === opt.type && o.code === opt.code);
  if (!ok) throw new Error('That move is not allowed.');
  const p = current(s);
  if (opt.type === 'claim') {
    claim(s, p, opt.code);
    note(s, `${p.name} won ${label(opt.code)} (+${ev(opt.code)})`);
  } else if (opt.type === 'return') {
    moveInto(s, p, opt.code);
    note(s, `${p.name} moved back into ${label(opt.code)} (rolls out of ${ev(opt.code)}, no new votes)`);
  } else if (opt.type === 'country') {
    enterCountry(s, p, opt.code);
    note(s, `${p.name} went back to ${label(opt.code)} and loses ${LOST_TURNS} turns`);
  }
  s.pending = null;
  return endTurn(s);
}

function enterCountry(s, p, c) {
  p.loc = c;
  p.remaining = 0;
  p.lost = LOST_TURNS;
  p.stuck = null;
  if (!p.allies.includes(c)) p.allies.push(c);
  p.sheet.push({ t: COUNTRIES[c].letter, dot: false });
}

// card: a state code, 'MX', 'CN' or 'STAY'.
// Returns the new state; if the card means "draw again", sets s.notice and keeps drawing.
export function draw(prev, card) {
  const s = clone(prev);
  const mode = turnMode(s);
  if (s.phase !== 'play' || (mode !== 'draw' && mode !== 'stuckDraw')) throw new Error('Not time to draw.');
  const p = current(s);
  s.notice = null;

  if (card in STATES) {
    const o = s.owner[card];
    if (o && o !== p.id) {
      s.notice = `${label(card)} belongs to ${player(s, o).name}. Draw again.`;
      s.pending = { kind: 'draw', reason: 'again' };
      return s;
    }
    if (o === p.id) {
      moveInto(s, p, card);
      note(s, `${p.name} drew ${label(card)}, which they already own. Back in it, no new votes`);
    } else {
      claim(s, p, card);
      note(s, `${p.name} drew ${label(card)} (+${ev(card)})`);
    }
  } else if (card in COUNTRIES) {
    if (p.allies.includes(card)) {
      s.notice = `${p.name} is already allied with ${label(card)}. Draw again.`;
      s.pending = { kind: 'draw', reason: 'again' };
      return s;
    }
    enterCountry(s, p, card);
    note(s, `${p.name} drew ${label(card)}: on vacation, loses ${LOST_TURNS} turns`);
  } else if (card === 'STAY') {
    p.lost = LOST_TURNS;
    p.stuck = null;
    if (!isCountry(p.loc)) p.remaining = ev(p.loc);
    p.sheet.push({ t: 'S', dot: false });
    note(s, `${p.name} drew Stay Where You Are: loses ${LOST_TURNS} turns, ${label(p.loc)} resets`);
  } else {
    throw new Error('Unknown card.');
  }
  s.pending = null;
  return endTurn(s);
}

export function loseTurn(prev) {
  const s = clone(prev);
  if (turnMode(s) !== 'lose') throw new Error('This player is not losing a turn.');
  const p = current(s);
  p.lost -= 1;
  p.sheet.push({ t: 'x', dot: false });
  note(s, `${p.name} loses a turn${p.lost ? ` (${p.lost} left)` : ''}`);
  return endTurn(s);
}

function endTurn(s) {
  s.pending = null;
  // Win as soon as someone reaches 270.
  for (const p of activePlayers(s)) {
    if (votes(s, p.id) >= WIN_EV) {
      s.phase = 'over';
      s.winner = p.id;
      note(s, `${p.name} reached ${votes(s, p.id)} votes and is President!`);
      return s;
    }
  }
  if (freeStates(s).length === 0) return finishRound(s);
  const out = mathematicallyEliminated(s);
  if (out) return finishRound(s, out);
  advance(s);
  return s;
}

// A player is mathematically eliminated when even winning every free state
// leaves them below every other player's current votes. Votes are never lost
// mid-round, so they are certain to finish last and the round ends now.
export function mathematicallyEliminated(s) {
  const act = activePlayers(s);
  if (act.length < 2) return null;
  const free = freeStates(s).reduce((t, c) => t + ev(c), 0);
  for (const p of act) {
    const best = votes(s, p.id) + free;
    if (act.every((o) => o.id === p.id || best < votes(s, o.id))) {
      return { id: p.id, votes: votes(s, p.id), free, freeStates: freeStates(s).length };
    }
  }
  return null;
}

function advance(s) {
  const n = s.order.length;
  for (let i = 1; i <= n; i++) {
    const t = (s.turn + i) % n;
    if (!player(s, s.order[t]).out) { s.turn = t; return; }
  }
}

function finishRound(s, early = null) {
  const act = activePlayers(s);
  const scores = act.map((p) => ({ id: p.id, votes: votes(s, p.id) }));
  if (act.length === 2 && scores.every((x) => x.votes === 269)) {
    s.phase = 'over';
    s.tie = true;
    note(s, 'A 269–269 tie!');
    return s;
  }
  const low = Math.min(...scores.map((x) => x.votes));
  const tied = scores.filter((x) => x.votes === low).map((x) => x.id);
  s.phase = 'roundEnd';
  s.roundEnd = { scores, tied, early };
  if (early) {
    const p = player(s, early.id);
    note(s, `Round ${s.round} is over. ${p.name} can't catch up: ${early.votes} votes + ${early.free} still free is less than everyone else.`);
  } else {
    note(s, `Round ${s.round} is over. All 51 states are taken.`);
  }
  return s;
}

export function eliminate(prev, id) {
  const s = clone(prev);
  if (s.phase !== 'roundEnd' || !s.roundEnd.tied.includes(id)) throw new Error('That player cannot be eliminated.');
  const p = player(s, id);
  p.out = true;
  p.eliminatedRound = s.round;
  p.eliminatedVotes = s.roundEnd.scores.find((x) => x.id === id).votes;
  for (const c of ownedBy(s, id)) delete s.owner[c];
  note(s, `${p.name} is eliminated with ${s.roundEnd.scores.find((x) => x.id === id).votes} votes`);

  const act = activePlayers(s);
  if (act.length === 1) {
    s.phase = 'over';
    s.winner = act[0].id;
    return s;
  }
  // Highest score goes first next round, then clockwise.
  const ranked = s.roundEnd.scores.filter((x) => x.id !== id).sort((a, b) => b.votes - a.votes);
  const firstId = ranked[0].id;
  s.turn = s.order.indexOf(firstId);
  s.firstTurn = s.turn;
  const queue = [];
  for (let i = 0; i < s.order.length; i++) {
    const pid = s.order[(s.turn + i) % s.order.length];
    if (!player(s, pid).out) queue.push(pid);
  }
  s.startQueue = queue;
  s.phase = 'nextStart';
  s.roundEnd = null;
  return s;
}

export function chooseStart(prev, opt) {
  const s = clone(prev);
  if (s.phase !== 'nextStart') throw new Error('Not choosing starting spots.');
  const p = player(s, s.startQueue[0]);
  const ok = startOptions(s, p).some((o) => o.type === opt.type && o.code === opt.code);
  if (!ok) throw new Error('That starting spot is not allowed.');
  p.stuck = null;
  if (opt.type === 'start') {
    p.loc = opt.code;
    p.remaining = ev(opt.code);
    p.lost = 0;
    p.sheet.push({ t: String(ev(opt.code)), dot: false, round: true });
    note(s, `${p.name} starts round ${s.round + 1} in ${label(opt.code)}`);
  } else {
    p.loc = opt.code;
    p.remaining = 0;
    p.lost = LOST_TURNS;
    p.sheet.push({ t: COUNTRIES[opt.code].letter, dot: false, round: true });
    note(s, `${p.name} starts round ${s.round + 1} in ${label(opt.code)} and loses ${LOST_TURNS} turns`);
  }
  s.startQueue.shift();
  if (!s.startQueue.length) {
    s.round += 1;
    s.phase = 'play';
    note(s, `Round ${s.round} begins`);
  }
  return s;
}
