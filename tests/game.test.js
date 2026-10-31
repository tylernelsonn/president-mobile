import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../js/game.js';
import { STATES, ev } from '../js/data.js';

const four = () => G.newGame(
  [{ name: 'Zak', color: '#d33a3a' }, { name: 'Syd', color: '#2f63d6' }, { name: 'Angela', color: '#2f9a4c' }, { name: 'Kristie', color: '#e5b420' }],
  'p0');

function opening(picks) {
  let s = four();
  for (const c of picks) s = G.initialDraw(s, c);
  return s;
}

test('opening draw places everyone and starts play', () => {
  const s = opening(['IL', 'VT', 'NY', 'TX']);
  assert.equal(s.phase, 'play');
  assert.equal(G.current(s).name, 'Zak');
  assert.equal(G.votes(s, 'p3'), 40);
  assert.throws(() => G.initialDraw(four(), 'ZZ'));
});

test('rolling subtracts; rolling out offers adjacent states; extra does not carry', () => {
  let s = opening(['IL', 'VT', 'NY', 'TX']);
  s = G.roll(s, 8);                 // Zak 19 -> 11
  assert.equal(G.player(s, 'p0').remaining, 11);
  assert.equal(G.current(s).name, 'Syd');
  s = G.roll(s, 5);                 // Syd needs 3, rolls 5
  assert.equal(G.turnMode(s), 'move');
  const codes = s.pending.options.map((o) => o.code).sort();
  assert.deepEqual(codes, ['MA', 'NH']);   // NY is owned by Angela
  s = G.choose(s, { type: 'claim', code: 'MA' });
  const syd = G.player(s, 'p1');
  assert.equal(syd.loc, 'MA');
  assert.equal(syd.remaining, 11);
  assert.equal(G.votes(s, 'p1'), 14);
  assert.deepEqual(syd.sheet.at(-1), { t: '11', dot: true });
});

test('seven: drawing another player\'s state means draw again; own state gives no votes', () => {
  let s = opening(['IL', 'VT', 'NY', 'TX']);
  s = G.roll(s, 7);
  assert.equal(G.turnMode(s), 'draw');
  s = G.draw(s, 'TX');
  assert.match(s.notice, /Kristie/);
  assert.equal(G.turnMode(s), 'draw');
  s = G.draw(s, 'IL');
  const zak = G.player(s, 'p0');
  assert.equal(zak.remaining, 19);
  assert.equal(zak.sheet.at(-1).dot, false);
  assert.equal(G.votes(s, 'p0'), 19);
});

test('vacation: Mexico costs 4 turns, then leaving offers bordering states', () => {
  let s = opening(['IL', 'CA', 'NY', 'TX']);
  s = G.roll(s, 7); s = G.draw(s, 'MX');
  assert.equal(G.player(s, 'p0').lost, 4);
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 3; k++) s = G.roll(s, 2);
    assert.equal(G.turnMode(s), 'lose');
    s = G.loseTurn(s);
  }
  for (let k = 0; k < 3; k++) s = G.roll(s, 2);
  assert.equal(G.turnMode(s), 'roll');
  // Already allied, so a 7 that draws Mexico means draw again.
  const again = G.draw(G.roll(s, 7), 'MX');
  assert.match(again.notice, /already allied/);
  s = G.roll(s, 4);
  const codes = s.pending.options.map((o) => o.code).sort();
  assert.deepEqual(codes, ['AZ', 'HI', 'NM']);  // CA and TX are taken
});

test('stay where you are resets the state and costs 4 turns', () => {
  let s = opening(['IL', 'VT', 'NY', 'TX']);
  s = G.roll(s, 8);
  for (let k = 0; k < 3; k++) s = G.roll(s, 2);
  s = G.roll(s, 7); s = G.draw(s, 'STAY');
  const zak = G.player(s, 'p0');
  assert.equal(zak.remaining, 19);
  assert.equal(zak.lost, 4);
});

test('backtracking through owned states to reach a free state', () => {
  let s = G.newGame([{ name: 'Zak', color: 'a' }, { name: 'Syd', color: 'b' }, { name: 'Ann', color: 'c' }], 'p0');
  s = G.initialDraw(s, 'ME'); s = G.initialDraw(s, 'CA'); s = G.initialDraw(s, 'TX');
  s.owner.NH = 'p0';
  // Share the rest evenly so nobody is mathematically eliminated. Zak gets nothing next to NY/VT.
  const nearby = ['MA', 'CT', 'NJ', 'PA'];
  Object.keys(STATES).filter((c) => !s.owner[c] && !['VT', 'NY'].includes(c)).sort((a, b) => ev(b) - ev(a)).forEach((c) => {
    const ids = (nearby.includes(c) ? ['p1', 'p2'] : ['p0', 'p1', 'p2']).sort((x, y) => G.votes(s, x) - G.votes(s, y));
    s.owner[c] = ids[0];
  });
  assert.equal(G.mathematicallyEliminated(s), null);
  // Zak rolls out of Maine: no free neighbour, but NH (owned) leads to VT.
  const before = G.votes(s, 'p0');
  s = G.roll(s, 4);
  assert.deepEqual(s.pending.options, [{ type: 'return', code: 'NH' }]);
  s = G.choose(s, { type: 'return', code: 'NH' });
  assert.equal(G.player(s, 'p0').remaining, 4);
  assert.equal(G.votes(s, 'p0'), before); // moving back in adds no votes
  s = G.roll(s, 2); s = G.roll(s, 2);
  s = G.roll(s, 5);
  assert.deepEqual(s.pending.options.map((o) => o.code), ['VT']);
});

test('stuck: four rolls then a card draw', () => {
  let s = G.newGame([{ name: 'Zak', color: 'a' }, { name: 'Syd', color: 'b' }, { name: 'Ann', color: 'c' }], 'p0');
  s = G.initialDraw(s, 'ME'); s = G.initialDraw(s, 'TX'); s = G.initialDraw(s, 'CA');
  s.owner.NH = 'p1';
  s = G.roll(s, 4);                 // Zak out of Maine, NH taken -> stuck
  assert.equal(G.player(s, 'p0').stuck, 4);
  for (let r = 0; r < 4; r++) {
    s = G.roll(s, 2); s = G.roll(s, 2);
    s = G.roll(s, 3);
  }
  s = G.roll(s, 2); s = G.roll(s, 2);
  assert.equal(G.turnMode(s), 'stuckDraw');
  assert.throws(() => G.roll(s, 5));
  s = G.draw(s, 'FL');
  assert.equal(G.player(s, 'p0').loc, 'FL');
  assert.equal(G.player(s, 'p0').stuck, null);
});

test('round end, elimination, highest goes first, start options', () => {
  let s = G.newGame([{ name: 'A', color: 'a' }, { name: 'B', color: 'b' }, { name: 'C', color: 'c' }], 'p0');
  s = G.initialDraw(s, 'WY'); s = G.initialDraw(s, 'TX'); s = G.initialDraw(s, 'NY');
  // Give out the rest except Colorado, which A will take.
  const rest = Object.keys(STATES).filter((c) => !s.owner[c] && c !== 'CO');
  rest.sort((a, b) => ev(b) - ev(a)).forEach((c) => { s.owner[c] = G.votes(s, 'p1') <= G.votes(s, 'p2') ? 'p1' : 'p2'; });
  assert.ok(G.votes(s, 'p1') < 270 && G.votes(s, 'p2') < 270);
  s.owner.MT = 'p0';
  s = G.roll(s, 3);
  s = G.choose(s, { type: 'claim', code: 'CO' });
  assert.equal(s.phase, 'roundEnd');
  assert.deepEqual(s.roundEnd.tied, ['p0']);
  s = G.eliminate(s, 'p0');
  assert.equal(s.phase, 'nextStart');
  assert.equal(G.ownedBy(s, 'p0').length, 0);
  const firstId = s.startQueue[0];
  assert.equal(s.order[s.turn], firstId);
  assert.ok(G.votes(s, firstId) >= G.votes(s, s.startQueue[1]));
  for (const id of [...s.startQueue]) {
    const opts = G.startOptions(s, G.player(s, id));
    s = G.chooseStart(s, opts[0]);
  }
  assert.equal(s.phase, 'play');
  assert.equal(s.round, 2);
});

test('reaching 270 ends the game immediately', () => {
  let s = G.newGame([{ name: 'A', color: 'a' }, { name: 'B', color: 'b' }], 'p0');
  s = G.initialDraw(s, 'NV'); s = G.initialDraw(s, 'ME');
  for (const c of ['TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ']) s.owner[c] = 'p0';
  assert.ok(G.votes(s, 'p0') < 270);
  s = G.roll(s, 6);
  s = G.choose(s, { type: 'claim', code: 'CA' });
  assert.equal(s.phase, 'over');
  assert.equal(s.winner, 'p0');
});

test('state is never mutated by actions', () => {
  const s = opening(['IL', 'VT', 'NY', 'TX']);
  const before = JSON.stringify(s);
  G.roll(s, 9); G.roll(s, 7);
  assert.equal(JSON.stringify(s), before);
});

test('fuzz: random games always finish with a valid result', () => {
  const codes = Object.keys(STATES);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const dice = () => 2 + Math.floor(rnd() * 6) + Math.floor(rnd() * 6);
  let finished = 0;
  for (let g = 0; g < 300; g++) {
    const n = 2 + (g % 7);
    let s = G.newGame(Array.from({ length: n }, (_, i) => ({ name: 'P' + i, color: 'c' })), 'p' + (g % n));
    while (s.phase === 'initial') s = G.initialDraw(s, pick(G.freeStates(s)));
    for (let step = 0; step < 200000 && s.phase !== 'over'; step++) {
      if (s.phase === 'roundEnd') { s = G.eliminate(s, pick(s.roundEnd.tied)); continue; }
      if (s.phase === 'nextStart') { s = G.chooseStart(s, pick(G.startOptions(s, G.player(s, s.startQueue[0])))); continue; }
      const m = G.turnMode(s);
      if (m === 'roll') s = G.roll(s, dice());
      else if (m === 'lose') s = G.loseTurn(s);
      else if (m === 'move') s = G.choose(s, pick(s.pending.options));
      else s = G.draw(s, pick([...codes, ...codes, 'MX', 'CN', 'STAY']));
      // owner totals are consistent
      const total = G.activePlayers(s).reduce((t, p) => t + G.votes(s, p.id), 0);
      assert.ok(total <= 538);
    }
    assert.equal(s.phase, 'over', `game ${g} did not finish`);
    assert.ok(s.winner || s.tie);
    finished++;
  }
  assert.equal(finished, 300);
});

test('round ends early when a player is mathematically eliminated', () => {
  let s = G.newGame([{ name: 'A', color: 'a' }, { name: 'B', color: 'b' }, { name: 'C', color: 'c' }], 'p0');
  s = G.initialDraw(s, 'WY'); s = G.initialDraw(s, 'TX'); s = G.initialDraw(s, 'CA');
  // Free: only Vermont (3) and Rhode Island (4) and Colorado (10).
  const keep = ['VT', 'RI', 'CO'];
  Object.keys(STATES).filter((c) => !s.owner[c] && !keep.includes(c))
    .sort((a, b) => ev(b) - ev(a))
    .forEach((c) => { s.owner[c] = G.votes(s, 'p1') <= G.votes(s, 'p2') ? 'p1' : 'p2'; });
  // A has 3 (+17 free = 20), far below B and C, but the check runs at end of a turn.
  assert.ok(G.mathematicallyEliminated(s));
  s = G.roll(s, 2);   // A rolls: 1 left in Wyoming, turn ends -> round ends
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.roundEnd.early.id, 'p0');
  assert.deepEqual(s.roundEnd.tied, ['p0']);
  assert.equal(G.freeStates(s).length, 3);
  s = G.eliminate(s, 'p0');
  assert.equal(s.phase, 'nextStart');
  assert.equal(G.freeStates(s).length, 4); // Wyoming back on the board
});

test('no early end while the trailing player could still tie or pass someone', () => {
  let s = G.newGame([{ name: 'A', color: 'a' }, { name: 'B', color: 'b' }], 'p0');
  s = G.initialDraw(s, 'WY'); s = G.initialDraw(s, 'VT');
  assert.equal(G.mathematicallyEliminated(s), null);
});
