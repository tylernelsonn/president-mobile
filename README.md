# Presidente Scorekeeper

A phone companion app for the **Presidente** board game. One scorekeeper runs it
at the table. It replaces the paper scoresheet and tracks:

- **Turns.** Tap the dice total. The app subtracts it, handles the 7 rule, and offers only the moves the rules allow.
- **Who won each state.** A live electoral map colored by each player's piece color, plus a full state-by-state list.
- **Scoreboard.** Votes per player, distance to 270, current state, votes left to roll out, lost turns, stuck status and alliances.
- **Rounds.** Round end at 51 states, elimination (with tie roll-off), the highest scorer going first, and choosing starting states.
- **Undo** for any action, **dark mode**, and auto-save so a refresh doesn't lose the game.

It's an installable web app (PWA). Open it in your phone's browser and use
**Add to Home Screen**. It works offline after the first load.

## Run it

No build step. Serve the folder with any static server:

```sh
npm start          # serves on http://localhost:5173
# or: python3 -m http.server 5173
```

Then open that address on your phone (same Wi-Fi, using your computer's IP) or
host the folder on GitHub Pages, Netlify or Vercel.

## Test it

```sh
npm test
```

The tests cover the board data (538 votes, symmetric adjacency, the Tricky
States), each rule (rolling out, 7s, vacation cards, backtracking, stuck,
elimination, 270), and a fuzz test that plays 300 random 2–8 player games to
completion.

## Project layout

| File | What it does |
| --- | --- |
| `js/data.js` | States, 2024–2032 electoral votes, adjacency, Mexico/Canada borders, piece colors |
| `js/game.js` | Rules engine: pure functions, `state -> new state` |
| `js/map.js` | SVG map renderer |
| `js/map-paths.js` | State shapes generated from `us-atlas@3.0.1` (US Census, public domain) |
| `js/app.js` | UI, persistence, undo |
| `css/app.css` | Styles, light and dark themes |
| `sw.js`, `manifest.webmanifest` | Offline support and home-screen install |

## How the rules are applied

These follow `Presidente.docx`. Where the rules left room for interpretation,
the app does this:

- **Board connections.** Real land borders, plus the Tricky States: Alaska ↔ Hawaii, Alaska/Hawaii ↔ the West Coast (WA, OR, CA), D.C. ↔ MD/VA/WV, Utah ↔ New Mexico, Arizona ↔ Colorado, and no New Jersey ↔ Connecticut.
- **Canada borders** AK, WA, ID, MT, ND, MN, MI, OH, PA, NY, VT, NH and ME (Ohio and Pennsylvania across Lake Erie). **Mexico borders** CA, AZ, NM, TX and HI.
- **Rolling out.** When you roll your number or more, you may move into an adjacent free state (new votes, dot), back into an adjacent state you own that leads to a free state (no new votes, roll out again), or into an allied country that borders a free state (lose 4 turns). If none of these exist, you're stuck.
- **Stuck.** You get 4 rolls to hit a 7. On the next turn you draw a card instead of rolling.
- **Opening draw.** Only state cards count. Redraw Mexico, Canada and Stay.
- **Drawing Mexico or Canada when already allied** means draw again.
- **Stay Where You Are** resets your current state to full votes and costs 4 turns.
- **Next round start.** You may start in the state you ended in, an owned state next to it, or an allied country next to it (lose 4 turns). If you ended in a country, you may start in an owned state on its border or in the country (lose 4 turns). You roll out of the chosen state's full votes.
- **270** ends the game the moment someone reaches it.
- **A 269–269 tie** is announced, and the tiebreaker is played at the table.
