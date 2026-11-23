// The Path to Presidency rules, from the Official Rulebook (PTP_Rulebook_A5).
// Text may use **bold**. Block types:
//   p: paragraph            h: red subheading           ex: example box (string or list of paragraphs)
//   note: gold callout      callout: { title, text } navy panel
//   steps: [[lead, text]]   numbered red circles        stars: [text] star bullets
//   tags: [[label, text]]   red label + text            box: [[count, name, detail]] what's in the box
//   vacation: true          the three vacation cards    seven: text beside a big 7
//   sheet: { head, rows, caption }  scoresheet (•19 = dot, M/C/S = vacation letter, x = lost turn)

const PLAYERS = ['John', 'Louie', 'Boston', 'Ozzy'];

export const RULES = [
  {
    id: 'welcome', title: 'Welcome, candidate',
    blocks: [
      { p: 'Race across the map, roll the dice and claim states for their **electoral votes**. When every state is taken, the player with the fewest votes is eliminated. Keep campaigning until one candidate is elected President.' },
      { callout: { title: 'Reach 270 electoral votes', text: 'To win the White House' } },
      { h: 'Players' },
      { p: '**2 to 6 players.** Each player chooses a party color. One player is the scorekeeper, or let this app do it for you.' },
      { h: 'In the box' },
      {
        box: [
          ['1', 'Game board', 'The map of the United States'], ['55', 'Cards', '54 state cards + 1 dedication card'],
          ['180', 'Coins', '30 in each of 6 colors'], ['6', 'Pawns', 'One for each color'],
          ['2', 'Dice', 'Always rolled together'], ['1', 'Rulebook', 'You are here!'],
        ],
      },
      { p: 'The 54 **state cards** are the 50 states, D.C., Canada, Mexico and Stay in Place. The **dedication card** (rules summary on the front, scoring app code on the back) stays out of the deck.' },
      { p: 'Your **coins** mark the states you claim. Your **pawn** stands in the state you are in right now. It goes wherever you go.' },
      { note: '**New to the game?** Start with **Set up**, **Rolling** and the **Seven rule**.' },
    ],
  },
  {
    id: 'setup', title: 'Set up',
    blocks: [
      {
        steps: [
          ['Pick your party.', 'Choose a color and take its coins and pawn.'],
          ['Roll for first.', 'Lay out the board. Everyone rolls to see who goes first.'],
          ['Draw your first state.', 'Set the dedication card aside and shuffle the state deck. Whoever won the roll randomly draws first. Then, in clockwise order, each player draws a card.'],
          ['Claim it.', 'Place a coin of your color on the state you drew, then stand your pawn in it. The coin shows you own the state. The pawn shows you are in it.'],
          ['Write it down.', 'The scorekeeper records the electoral votes the state holds, with a dot beside them. The dot means a new state was acquired.'],
          ['Let the election begin!', ''],
        ],
      },
      { sheet: { head: PLAYERS, rows: [['•19', '•3', '•28', '•40']] } },
      { h: 'Keeping score on paper' },
      { p: 'The scorekeeper writes each player’s name across the top of a sheet and keeps one column per player. Using the app? It does all of this for you.' },
      {
        tags: [
          ['• Dot', 'A new state was acquired. Only dotted numbers count at the end of a round.'],
          ['No dot', 'A roll was subtracted, or you re-entered a state you already own.'],
          ['M C S', 'You drew Mexico, Canada or Stay in Place. Write the letter, then **4 x’s** below it for the 4 lost turns.'],
        ],
      },
    ],
  },
  {
    id: 'rolling', title: 'Rolling',
    blocks: [
      { h: 'Your turn' },
      { p: 'Whoever won the roll-off starts the game by rolling **both dice**. The scorekeeper subtracts the number rolled from that player’s votes, unless the roll is a **7** (see the Seven rule). The new score is written below the old one, **without a dot**. Then the player to the left rolls and repeats the process.' },
      { ex: 'John rolls an 8, so he is now at 11 (19 − 8).' },
      { h: 'Rolling out of a state' },
      { p: 'When a player **rolls their number or more**, they have “rolled out” of their state. They place a new coin on an **open state touching the one they are in** and move their pawn into it.' },
      { p: 'The scorekeeper writes the number of votes that state is worth below the previous number and puts a **dot** next to it. Extra numbers do **not** carry over to the new state.' },
      { ex: 'Louie needed 3 and rolled a 5. The extra 2 do not carry over to his new state.' },
      {
        sheet: {
          head: PLAYERS,
          rows: [['•19', '•3', '•28', '•40'], ['11', '•10', '25', '30'], ['•7', '1', '19', '28']],
          caption: 'Reading the sheet: John rolled out of his 11-vote state into a 7-vote state (dot). Louie rolled out of his 3-vote state into a 10-vote state (dot), then rolled a 9.',
        },
      },
    ],
  },
  {
    id: 'seven', title: 'The seven rule',
    blocks: [
      { seven: 'When a player rolls a **7**, nothing is subtracted. Instead, the player **draws a new card** from the deck, places a new coin on that state and moves their pawn there. The scorekeeper writes down the votes for the new state.' },
      { h: 'What you draw' },
      {
        stars: [
          '**An open state.** Place a coin, move your pawn and collect its votes. You must roll out of the state.',
          '**A state you already own.** Stop drawing. Move your pawn there (no new coin) but get **no more votes** for it, and no dot. Roll out of it again.',
          '**A state another player owns.** Keep drawing until you get an unclaimed state or one of your own.',
          '**Mexico, Canada or Stay in Place.** See Vacation cards.',
        ],
      },
      { p: 'After drawing, the player must **roll out of the state again**. The scorekeeper does not put a dot next to the number when the state was already owned.' },
      {
        ex: [
          'A player in **New York** rolls a 7 and draws **Wyoming**. They place a new coin in Wyoming, move their pawn there and begin rolling out of it on their next turn.',
          'On that turn they roll another 7 and draw **New York**. That state is already theirs, so they move their pawn back to New York with no new coin and no new votes and begin rolling out of it again.',
        ],
      },
    ],
  },
  {
    id: 'vacation', title: 'Vacation cards',
    blocks: [
      { vacation: true },
      { p: 'Three cards in the deck are not states: **Mexico**, **Canada** and **Stay in Place** (the “stay where you are” card). Each one makes you **lose your next 4 turns**. The scorekeeper writes **M**, **C** or **S**, then **4 x’s** below it.' },
      { h: 'Mexico or Canada' },
      { p: 'Place a new coin in that country and move your pawn there. When your 4 turns are over, roll. If you roll anything but a 7, you leave the country:' },
      {
        stars: [
          '**Canada:** move your pawn into any open state touching Canada, **including Alaska**.',
          '**Mexico:** move your pawn into any open state touching Mexico, **including Hawaii**.',
          '**Roll a 7?** Draw another card and go to its state or country.',
        ],
      },
      { h: 'Stay in Place' },
      { p: 'Your current state resets to **all of its votes**. After the 4 lost turns, begin trying to roll out of it again.' },
      { note: '**Lost turns:** On those turns the player doesn’t roll. The 4 x’s on the score sheet are the reminder.' },
    ],
  },
  {
    id: 'allies', title: 'Allies',
    blocks: [
      { p: 'Once you have been to Mexico or Canada, you are **allied** with that country. When allied, you may choose to go back to the country if it will lead you to an **open state**. Each time you re-enter, you lose **4 turns** again.' },
      { p: 'You **cannot** choose to go into a country you are not allied with. You must draw its card.' },
      { callout: { title: 'One ally per country', text: 'Mexico and Canada can each have only one ally. Once a player is allied with a country, nobody else can go there, in this round or later ones. Anyone else who draws that country’s card keeps drawing. The country opens up again only when its ally is eliminated.' } },
      { p: 'If Mexico or Canada is drawn and it was claimed in a previous round, you don’t get to go. **Keep drawing.**' },
      { h: 'What it looks like on the sheet' },
      {
        sheet: {
          head: PLAYERS,
          rows: [['•19', '•3', '•28', '•40'], ['11', '•10', '25', '30'], ['•7', '1', '19', '28'], ['2', 'M', '9', 'S'],
            ['', 'x', '', 'x'], ['', 'x', '', 'x'], ['', 'x', '', 'x'], ['', 'x', '', 'x']],
          caption: 'Louie drew Mexico (M) and Ozzy drew Stay in Place (S). Each has 4 x’s for the 4 turns they lose.',
        },
      },
    ],
  },
  {
    id: 'stuck', title: 'Stuck',
    blocks: [
      { p: 'Eventually there may be **no open state next to you**.' },
      { p: 'If your own states connect to an open state, you must roll out of the state you are in and travel back through the states you own, one roll at a time, until you reach the open state.' },
      { p: 'If you have **no path of your own states** to an open state, you are **stuck**.' },
      { h: 'Stuck turns' },
      { p: 'When stuck, roll hoping for a **7** so you can draw a card. After you roll out of a state and are still stuck, you get **four turns** to roll for a 7. If you don’t get one, you then draw a card as if you had rolled a 7.' },
      { h: 'Stuck in Mexico or Canada' },
      { p: 'You **must** enter a state you own along that country’s border, roll out of it, and then begin the 4 stuck turns.' },
      { p: 'If you own **no state** along that border, you may stay in the country and begin the 4 stuck turns there, rolling as normal.' },
      { h: 'Declining a free state' },
      { p: 'In a country and don’t want the open state? You don’t have to take it, as long as you already own another state along the border. Re-enter the state you own instead. If you roll out of it and are still stuck, begin the 4 stuck turns.' },
      { note: '**No ping-pong.** You **cannot** go back and forth between a country you are allied with and a single state you own. Once you re-enter the state, you **must** begin the stuck rule if you are not going for the open state.' },
      { h: 'Routes through a country' },
      { p: 'If the only way to an open state is through a country you are allied with, you may take that route (losing 4 turns in the country) **or** choose the stuck rule instead. If you can reach an open state through your own states, you **must** take that route.' },
      {
        ex: [
          'A player in Canada has served their 4 turns. **Maine** is the only open state, but they don’t want it.',
          'They move their pawn into **Washington**, which they already own, and roll out of it. They are now stuck, so they begin the 4 stuck turns.',
        ],
      },
    ],
  },
  {
    id: 'tricky', title: 'Tricky states',
    blocks: [
      { p: 'A few states don’t have clear neighbors. Here is what they connect to:' },
      {
        tags: [
          ['Alaska', 'Hawaii, the West Coast, and Canada'],
          ['Hawaii', 'Alaska, the West Coast, and Mexico'],
          ['D.C.', 'Maryland, Virginia, and West Virginia'],
          ['Four Corners', 'All four corner states touch, so Utah touches New Mexico and Arizona touches Colorado.'],
          ['New England', 'New Jersey does **not** connect to Connecticut. New York separates the two.'],
        ],
      },
      { note: '**Not sure two states touch?** The app only offers moves the rules allow.' },
    ],
  },
  {
    id: 'end-round', title: 'End of a round',
    blocks: [
      { p: 'The round ends when **all the states are taken**. The scorekeeper adds up all the **dotted numbers** for each player. (All players’ scores together should add up to **538**.) The player with the **fewest votes is eliminated**, and their coins and pawn come off the board.' },
      { h: 'Early end' },
      { p: 'A round also ends early as soon as a player can no longer catch up: when their votes **plus every vote still open** are less than every other player’s votes. That player is eliminated, and any states still open stay open for the next round.' },
      { h: 'Tie for last' },
      { p: 'If a round ends with a tie for last place, the tied players **roll**, and whoever rolls the lowest is eliminated.' },
    ],
  },
  {
    id: 'next-round', title: 'The next round',
    blocks: [
      { p: 'Each new round plays just like the one before, until all the states are taken again.' },
      {
        stars: [
          'The player with the **highest score** goes first. Play continues clockwise from them.',
          '**Re-shuffle** all the state cards back into the deck.',
          'Each player may start in **any state they own that is connected to where they ended**. Connected includes states more than one away, if they link back through a chain of your own states.',
        ],
      },
      {
        ex: [
          'You ended in Utah but also own Nevada, and California is now open. Start in **Nevada**, hoping to get California.',
          'If you end in California and own California, Arizona, New Mexico, Texas and Oklahoma, you may start in **any** of them.',
        ],
      },
      { h: 'Still stuck?' },
      { p: 'If you end in a state and are still stuck after someone is eliminated, roll out of a connected state of your choosing **before** starting the 4 stuck turns.' },
      { h: 'Mexico and Canada' },
      {
        stars: [
          '**Chains don’t pass through a country.** To reach your states on the other side of an allied country, start the round in that country and lose 4 turns.',
          'You can start in a country you are allied with, if it is connected to where you ended. You still lose 4 turns to start the round.',
          'If you end the round in a country (even with turns still to lose), start in any of your states connected to it, or start in the country and lose 4 turns.',
          'If you end in a country and own **no** states connected to it, you **must** start in that country and lose 4 turns.',
        ],
      },
    ],
  },
  {
    id: 'winning', title: 'Winning the game',
    blocks: [
      { callout: { title: '270 electoral votes', text: 'The moment a player reaches 270, the game ends and that player is appointed **President of the United States!**' } },
      { h: 'A tie' },
      { p: 'If the final two players each reach **269** votes, the game is a tie.' },
      {
        steps: [
          ['Everyone', 'is back in the game.'],
          ['', 'Each player starts in a state of their choosing, and all players **roll**. The highest roll wins the state.'],
          ['', 'After all **51** states and districts have been rolled for, count the votes.'],
          ['', 'The most votes wins and is appointed President. The votes do not have to add up to 270 this time.'],
        ],
      },
    ],
  },
];

// The dedication card from the box.
export const DEDICATION = {
  title: 'For Bapa',
  name: 'George “Bapa” Jones',
  role: 'Creator of the game · Est. 1960',
  story: 'In 1960, 12-year-old George got hooked on JFK’s run for the White House. So he hand-drew a map, wrote in the electoral votes and made up the rules as he went. He taught it to his siblings, then his kids, then his grandkids, one game night at a time.',
  quote: 'You don’t cheat fair.',
  ps: 'P.S. California is still worth the most votes.',
  signoff: 'Thanks for the game, Bapa.',
  from: 'Love, your family',
};
