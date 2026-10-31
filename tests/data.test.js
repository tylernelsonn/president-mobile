import test from 'node:test';
import assert from 'node:assert/strict';
import { STATES, ADJ, BORDERS, TOTAL_EV } from '../js/data.js';
import { MAP_PATHS } from '../js/map-paths.js';

test('51 states/district totalling 538 electoral votes', () => {
  assert.equal(Object.keys(STATES).length, 51);
  assert.equal(Object.values(STATES).reduce((t, [, v]) => t + v, 0), TOTAL_EV);
});

test('adjacency is symmetric and references real states', () => {
  for (const [a, ns] of Object.entries(ADJ)) {
    assert.ok(STATES[a], a);
    for (const b of ns) {
      assert.ok(STATES[b], `${a}->${b}`);
      assert.ok(ADJ[b].includes(a), `${b} should list ${a}`);
    }
  }
  assert.equal(Object.keys(ADJ).length, 51);
});

test('tricky states from the rules', () => {
  assert.deepEqual([...ADJ.DC].sort(), ['MD', 'VA', 'WV']);
  assert.ok(ADJ.UT.includes('NM') && ADJ.AZ.includes('CO'));
  assert.ok(!ADJ.NJ.includes('CT'));
  for (const w of ['WA', 'OR', 'CA', 'HI']) assert.ok(ADJ.AK.includes(w));
  assert.ok(BORDERS.CN.includes('AK') && BORDERS.MX.includes('HI'));
});

test('every state has a map shape', () => {
  for (const c of Object.keys(STATES)) assert.ok(MAP_PATHS[c]?.d, c);
});
