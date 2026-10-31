// Static board data for Presidente: states, electoral votes and adjacency.

// Electoral votes, 2024–2032 apportionment. Sums to 538.
export const STATES = {
  AL: ['Alabama', 9], AK: ['Alaska', 3], AZ: ['Arizona', 11], AR: ['Arkansas', 6],
  CA: ['California', 54], CO: ['Colorado', 10], CT: ['Connecticut', 7], DE: ['Delaware', 3],
  DC: ['Washington D.C.', 3], FL: ['Florida', 30], GA: ['Georgia', 16], HI: ['Hawaii', 4],
  ID: ['Idaho', 4], IL: ['Illinois', 19], IN: ['Indiana', 11], IA: ['Iowa', 6],
  KS: ['Kansas', 6], KY: ['Kentucky', 8], LA: ['Louisiana', 8], ME: ['Maine', 4],
  MD: ['Maryland', 10], MA: ['Massachusetts', 11], MI: ['Michigan', 15], MN: ['Minnesota', 10],
  MS: ['Mississippi', 6], MO: ['Missouri', 10], MT: ['Montana', 4], NE: ['Nebraska', 5],
  NV: ['Nevada', 6], NH: ['New Hampshire', 4], NJ: ['New Jersey', 14], NM: ['New Mexico', 5],
  NY: ['New York', 28], NC: ['North Carolina', 16], ND: ['North Dakota', 3], OH: ['Ohio', 17],
  OK: ['Oklahoma', 7], OR: ['Oregon', 8], PA: ['Pennsylvania', 19], RI: ['Rhode Island', 4],
  SC: ['South Carolina', 9], SD: ['South Dakota', 3], TN: ['Tennessee', 11], TX: ['Texas', 40],
  UT: ['Utah', 6], VT: ['Vermont', 3], VA: ['Virginia', 13], WA: ['Washington', 12],
  WV: ['West Virginia', 4], WI: ['Wisconsin', 10], WY: ['Wyoming', 3],
};

export const STATE_CODES = Object.keys(STATES).sort((a, b) => STATES[a][0].localeCompare(STATES[b][0]));
export const stateName = (c) => (STATES[c] ? STATES[c][0] : COUNTRIES[c]?.name ?? c);
export const ev = (c) => (STATES[c] ? STATES[c][1] : 0);
export const TOTAL_EV = 538;
export const WIN_EV = 270;

export const COUNTRIES = {
  MX: { name: 'Mexico', letter: 'M' },
  CN: { name: 'Canada', letter: 'C' },
};

// Land borders, plus the "Tricky States" from the rules:
//   Alaska: Hawaii, the West Coast; Hawaii: Alaska, the West Coast;
//   D.C.: Maryland, Virginia, West Virginia; Four Corners: UT–NM and AZ–CO;
//   New Jersey does NOT touch Connecticut.
const RAW = {
  AL: 'FL GA MS TN', AK: 'HI WA OR CA', AZ: 'CA NV UT NM CO', AR: 'LA MS MO OK TN TX',
  CA: 'AZ NV OR AK HI', CO: 'KS NE NM OK UT WY AZ', CT: 'MA NY RI', DE: 'MD NJ PA',
  DC: 'MD VA WV', FL: 'AL GA', GA: 'AL FL NC SC TN', HI: 'AK WA OR CA',
  ID: 'MT NV OR UT WA WY', IL: 'IN IA KY MO WI', IN: 'IL KY MI OH', IA: 'IL MN MO NE SD WI',
  KS: 'CO MO NE OK', KY: 'IL IN MO OH TN VA WV', LA: 'AR MS TX', ME: 'NH',
  MD: 'DE PA VA WV DC', MA: 'CT NH NY RI VT', MI: 'IN OH WI', MN: 'IA ND SD WI',
  MS: 'AL AR LA TN', MO: 'AR IL IA KS KY NE OK TN', MT: 'ID ND SD WY', NE: 'CO IA KS MO SD WY',
  NV: 'AZ CA ID OR UT', NH: 'ME MA VT', NJ: 'DE NY PA', NM: 'AZ CO OK TX UT',
  NY: 'CT MA NJ PA VT', NC: 'GA SC TN VA', ND: 'MN MT SD', OH: 'IN KY MI PA WV',
  OK: 'AR CO KS MO NM TX', OR: 'CA ID NV WA AK HI', PA: 'DE MD NJ NY OH WV', RI: 'CT MA',
  SC: 'GA NC', SD: 'IA MN MT NE ND WY', TN: 'AL AR GA KY MS MO NC VA', TX: 'AR LA NM OK',
  UT: 'AZ CO ID NV NM WY', VT: 'MA NH NY', VA: 'KY MD NC TN WV DC', WA: 'ID OR AK HI',
  WV: 'KY MD OH PA VA DC', WI: 'IL IA MI MN', WY: 'CO ID MT NE SD UT',
};
export const ADJ = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, v.split(' ')]));

// States touching each country. Canada includes Alaska; Mexico includes Hawaii (per the rules).
// Ohio and Pennsylvania share a water border with Canada across Lake Erie.
export const BORDERS = {
  CN: ['AK', 'WA', 'ID', 'MT', 'ND', 'MN', 'MI', 'OH', 'PA', 'NY', 'VT', 'NH', 'ME'],
  MX: ['CA', 'AZ', 'NM', 'TX', 'HI'],
};

export const PALETTE = [
  { name: 'Red', hex: '#d33a3a' }, { name: 'Blue', hex: '#2f63d6' },
  { name: 'Green', hex: '#2f9a4c' }, { name: 'Yellow', hex: '#e5b420' },
  { name: 'Purple', hex: '#8b4fd0' }, { name: 'Orange', hex: '#ea7a22' },
  { name: 'Black', hex: '#2b2b33' }, { name: 'White', hex: '#f2f2ee' },
  { name: 'Pink', hex: '#e2589f' }, { name: 'Teal', hex: '#1f9d9a' },
  { name: 'Brown', hex: '#8a5a33' }, { name: 'Gray', hex: '#8d939c' },
];
