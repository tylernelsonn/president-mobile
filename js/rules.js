// The Presidente rules, from the group's rules document (Presidente.docx).
// Blocks: p = paragraph, ex = italic example, sheet = scoresheet example, list = bullet list.

const PLAYERS = ['Zak', 'Syd', 'Angela', 'Kristie'];

export const RULES = [
  {
    id: 'setup', title: 'Set up',
    blocks: [
      { p: 'Start by picking your party and taking the respective colored pieces. Lay out board and roll to see who goes first. Whoever wins gets to randomly draw from the state deck. Then in a clockwise order each player will draw a card. Whatever state you draw, you will place a piece of your color on that state. Then the scorekeeper will write down the electoral votes that the state holds, along with a dot by the votes (the dot represents a new state acquired). Now let the election begin!' },
      { sheet: { head: PLAYERS, rows: [['•19', '•3', '•28', '•40']] } },
    ],
  },
  {
    id: 'rolling', title: 'Rolling',
    blocks: [
      { p: 'Whoever won the roll off above, will start the game by rolling both dice. The scorekeeper will then subtract the number that player rolls from the players starting votes, unless they roll a 7 in which case see the seven rule below. (Zak rolls an 8 so he is now at 11). The scorekeeper writes the new score below the old one but doesn’t put a dot next to it. Then the player to his left rolls and repeats the process.' },
      { p: 'When a player rolls out of their state (rolls their number or more) the player then gets to place a new piece on a state that is touching the one they are in, placing them in the new state. The Scorekeeper then writes down the number of votes that state is worth below the previous number and places a dot next to it. Extra numbers do not carry over to the new state. (Syd rolls a 5 and needed 3, the extra two from the roll do not carry over the new state.)' },
      { sheet: { head: PLAYERS, rows: [['•19', '•3', '•28', '•40'], ['11', '•10', '25', '30'], ['•7', '1', '19', '28']] } },
    ],
  },
  {
    id: 'seven', title: 'Seven rule',
    blocks: [
      { p: 'When a player rolls a 7, the scorekeeper does not subtract 7 from the players votes, instead the player draws a new card from the deck. The player then places a new piece on whatever state the card says, and the scorekeeper writes down the number of votes for the new state.' },
      { p: 'If a player draws a state that they already acquired, the player stops drawing and is now placed in that state but doesn’t get any more votes for it. If a player draws a state that another player has already acquired, the player continues to draw until they get a state that hasn’t been claimed, or one of their previously acquired states. The player then must roll out of the state again. The scorekeeper will not put a dot next to the number in this situation.' },
      { ex: 'A player draws Wyoming while in New York. The player places a new piece in Wyoming and will begin to roll out of the state on their next turn. The player then on his next turn rolls another 7 and draws New York, sending them back to the state to begin rolling out of that state again.' },
    ],
  },
  {
    id: 'vacation', title: 'Vacation cards',
    blocks: [
      { p: 'When drawing, there are 3 cards that are not states. These cards are Mexico, Canada, and a stay where you are card. Each one of these cards makes you lose your next 4 turns. For Mexico and Canada, you will place a new piece in the respective country. When the 4 turns are over the player then rolls. If they roll anything but a 7 then they leave the country. If it is the stay where you are card, then you reset the state to all its votes and begin attempting to roll out of the state again.' },
      { p: 'If in Canada they can place a piece into any free state that is touching Canada, including Alaska. If in Mexico, they may place a piece into any free state that is touching Mexico, including Hawaii. If the player rolls a 7, then they will draw another card and go to its respective state/country. The scorekeeper for this will write down where they go (M for Mexico, C for Canada, and S for stay where you are) and then 4 x’s below, signifying the loss of the next 4 turns.' },
      { p: 'Once you have been to one of those countries, you are allied with the country. When you are allied with a country, you may choose to go back to the country if it will lead you to a free state. If you re-enter the country, you lose 4 turns again. You cannot choose to go into the country if you are not allied with it. You must draw the card to get into the country. If Mexico and Canada are drawn and they were taken from a previous round, you don’t get to go to the country because it is already allied, instead keep drawing.' },
      {
        sheet: {
          head: PLAYERS,
          rows: [['•19', '•3', '•28', '•40'], ['11', '•10', '25', '30'], ['•7', '1', '19', '28'], ['2', 'M', '9', 'S'],
            ['', 'x', '', 'x'], ['', 'x', '', 'x'], ['', 'x', '', 'x'], ['', 'x', '', 'x']],
        },
      },
    ],
  },
  {
    id: 'stuck', title: 'Stuck',
    blocks: [
      { p: 'You will get to a point when there is no state next to you that you can go into. If you have states that connect to a state that is open, then you must roll to get out of the state you are in, going back to a state you own, all the way until you reach the free state. If you do not have a path of states you own, then you are stuck.' },
      { p: 'When stuck, you must roll in hopes for a 7 to draw a card. After you roll out of a state and are still stuck, you get four turns to roll for a 7. After you are stuck for the four turns, you then get to draw a card as if you were to roll a 7.' },
      { p: 'If in Mexico or Canada, then you must enter a state you own along their borders, roll out of the state, and then begin the stuck 4 turns. If you do not own a state along the country, then you may stay in the country, and begin the stuck 4 turns while being able to roll.' },
      { p: 'Once you have been to the country, you are now allied with the country. When you are allied with a country, you may choose to go back to the country if it will lead you to a free state. If you re-enter the country, you lose 4 turns again. If in a country and you don’t want to take a free state, you don’t have to if you already own another state along the border. You may simply re-enter the state you already own. Then if you get out of that state and are stuck you begin the stuck 4 turns. You cannot go back and forth between a country you own and a single state you own. Once you re-enter the state, you must begin the stuck rule if your intentions are to not get the free state.' },
      { ex: 'A player is in Canada and has taken their 4 turns. Maine is the only state open, but they do not want to get Maine. They choose to go into Washington, that they already have. They roll out of Washington and are now stuck, so they begin the stuck 4 turns.' },
    ],
  },
  {
    id: 'tricky', title: 'Tricky states',
    blocks: [
      { p: 'There are a few states that don’t have clear states that are connected to it. Here they are and what they connect to.' },
      {
        list: [
          ['Alaska', 'Hawaii, the West Coast, and Canada'],
          ['Hawaii', 'Alaska, the West Coast, and Mexico'],
          ['D.C.', 'Maryland, Virginia, and West Virginia'],
          ['Four Corners', 'The Four Corners are all touching, so Utah is touching New Mexico and Arizona is touching Colorado.'],
          ['New England', 'New Jersey does not connect to Connecticut. New York separates the two.'],
        ],
      },
    ],
  },
  {
    id: 'end-round', title: 'End round',
    blocks: [
      { p: 'The round ends when all the states are taken. Once this occurs, the scorekeeper then tallies up all the votes for each person. To do this the scorekeeper adds up all the numbers with a dot next to them for the person (all players scores added together should add up to 538). The player with the least votes will then be eliminated. The eliminated players pieces will be taken off the board.' },
      { p: 'The player with the highest score will then go first for the next round, going in a clockwise order from them. You then will re-shuffle all the cards back into the deck. To start the next round, the player may choose from one of the states he owns that are connected to where he ended. (Ended in Utah but owns Nevada too, and California is now open, so they start the next round in Nevada in hopes to get California.)' },
      { p: 'If ending in a state and still stuck after someone is eliminated, you must roll out of the state of your choosing that is connected before starting the stuck 4 rule. You can start in Mexico or Canada if you own it and are connected to it where you ended. When starting in the country you must still lose another 4 turns to start the round. It is not considered a connecting state if it is connected through the country. If ending the round in Mexico or Canada (even if you have more turns to lose), you can start at any state that is connecting through it, or start in the respective country, losing the 4 turns to start the round.' },
      { p: 'If a round ends with a tie for last place, the players that are tied will roll, and whoever rolls the lowest will be eliminated.' },
    ],
  },
  {
    id: 'new-round', title: 'New round',
    blocks: [
      { p: 'The new round continues play just as before until all the states are taken again. When all states are taken again, the scorekeeper counts the votes, and a player is eliminated. The players pieces are taken off the board and you do all the necessary steps to prepare for the new round.' },
    ],
  },
  {
    id: 'end-game', title: 'End game',
    blocks: [
      { p: 'To end the game, a player must reach a total vote count of 270. As soon as a player reaches this number of votes, the game ends, and the player is appointed President of the United States!!!' },
    ],
  },
  {
    id: 'tie', title: 'Tie',
    blocks: [
      { p: 'Yes, there is a possibility of a tie. If the final two players each reach a vote count of 269 then the game will result in a tie. In the event of a tie, EVERYONE is back in the game. You then start at a state of your choosing and all players roll. Highest roll wins the state. After all 51 states/district have been rolled for, you count the votes and the player with the most votes wins the game and is appointed President. The votes do not have to add up to 270 in this occasion.' },
    ],
  },
  {
    id: 'house', title: 'Added in the app',
    blocks: [
      { p: 'A round also ends early as soon as a player is mathematically eliminated: when their votes plus every vote still free are less than every other player’s votes. That player is eliminated, and any states still free stay free for the next round.' },
    ],
  },
];
