I've added my comments where I've got something to say - starting with //?
# RPS Deckbuilder — throwaway prototype handoff

`proto/index.html` is a single file of vanilla JS with no build step. It was made only to playtest the game manually, has no tests, and should not be reused as code. The user's playtest verdict: "feels pretty good". This doc records the exact rules the prototype runs, so the real build (PLAN-v1/v2) can match them or deliberately change them.

## Run loop
1. A run is **3 fights** in a fixed order. Your deck carries over from fight to fight; HP does not.
2. After you win fight 1 or 2, the reward screen shows **3 distinct random cards** from the reward pool (15 cards).
   - Pick one, then choose which card in your deck it **replaces**, or skip.
   - Your deck therefore **always stays at 5 cards**.
3. Losing any fight ends the run (`lost`). Winning fight 3 wins the run (`won`).

## Fight setup
| | HP | Deck (5 cards, shown publicly in the UI) |
|---|---|---|
| You | 10 (reset each fight) | starter: Rock, Rock, Paper, Paper, Scissors |
| Pebble Kid | 8 | Rock ×3, Paper, Scissors |
| Paper Pusher | 10 | Paper, Heavy Paper, Origami Shield, Rock, Scissors |
| The Shredder | 12 | Shears, Twin Blades, Scissors, Boulder, Bandage |

- Both decks are shuffled and each side draws a **hand of 3**, which leaves 2 cards in the draw pile.
- If a side needs to draw from an empty deck, its discard pile is reshuffled into the deck. If the discard is also empty, that side draws nothing.

## Round (simultaneous, hidden)
You click a card. The AI picks its card without seeing yours. Then the round resolves in this order:
1. Each side's "next card +N" bonus is used up by the card it just played, and the bonus is cleared.
2. **Reveal** effects run: the player's first, then the enemy's.
3. **Outcome:** Rock beats Scissors, Scissors beats Paper, Paper beats Rock. On a tie, a card that "wins ties" wins, but only if the other card doesn't also have that ability.
4. **Triggers:** on a tie, both cards' `tie` effects run. Otherwise the winner's `win` effects and the loser's `loss` effects run.
5. **Damage** happens only when there's a winner. The loser takes `max(0, 1 + winner's damage bonuses − loser's armor)`.
   - The winner's damage bonuses are its "next card +N" bonus plus any "+N dmg" effects.
   - Armor only exists through `loss` effects and lasts for this round only.
6. Each played card goes to its owner's discard pile, or to an exile pile if the card exiles itself. Exiled cards are gone for the rest of the fight, so the deck is smaller until the fight ends.
7. Each side, the player first, then:
   - if its hand is down to 1 card (or 0), draws back up to 3 cards. Otherwise it doesn't draw, so a hand of 3 goes 3 → 2 → 1 → refill to 3;
   - draws any extra cards owed. **The hand can be 4 or more.** A big hand only shrinks as cards are played; it is never topped up past 3 again; //? what? I haven't encountered anything like that, and I don't think hand should grow above 3
   - discards cards at random if a discard was forced on it. This happens **after** the draw, so the side starts the next round with fewer cards.
   - if the hand is somehow empty after that (e.g. forced discards), it draws 3 so it always has a card to play.
   - If a peek was triggered this round, it becomes active now.
8. **KO check:** the player is checked first, so a mutual KO counts as a **loss**. //? reasonable to say that mutual KO should be possible in the full game

## Status effects (per side, last for one fight)
- `next`: bonus damage added to the side's next card, which uses it up whether that card wins, ties or loses.
- `peek`: during the next round, you see the opponent's hand face-up. If the AI is peeking, it uses your actual hand.
- `pending.draw` / `pending.discard`: extra draws and forced discards that are applied at step 7.

## Effects and cards
The base cards are Rock, Paper and Scissors. On their own they do 1 damage when they win and have no effects.

| Card | Type | Effect |
|---|---|---|
| Boulder | Rock | on win: +2 dmg |
| Glass Rock | Rock | on win: +3 dmg; exiles itself |
| Momentum | Rock | on win: next card +1 dmg |
| Pebble Storm | Rock | on win: opponent discards 1 |
| Feint | Rock | on tie: heal 1, draw 1 |
| Origami Shield | Paper | on loss: armor 2 |
| Recycled Paper | Paper | on loss: draw 1 |
| Scout | Paper | on reveal: peek at the opponent's next hand |
| Paper Cut | Paper | wins ties |
| Heavy Paper | Paper | on win: +1 dmg |
| Shears | Scissors | wins ties |
| Bandage | Scissors | on tie: heal 2 (cannot go above max HP) |
| Twin Blades | Scissors | on win: +1 dmg, draw 1 |
| Rusty Scissors | Scissors | on loss: opponent discards 1 |
| Whetstone | Scissors | on reveal: next card +1 dmg |

## AI
- **Predicting your type:** //? opponent throws felt somewhat random though - as if the current hand is more important than the prediction. On the other hand there were a couple of unexpected losses so maybe not entirely random...
  - Normally it looks at your last 6 plays, adds 1 to each type's count (smoothing), and treats the result as the chance you play Rock, Paper or Scissors.
  - When it is peeking, it uses the mix of types in your actual hand instead.
- **Scoring each card in its hand:** for each of your possible types, it weights the card's value by the chance you play that type, then adds them up.
  - If its card would win: `1 + next + card's +dmg`, plus 0.3 for each `win` effect.
  - If its card would lose: −1, plus 0.4 for each `loss` effect.
  - If it would tie: the win value if the card wins ties, otherwise 0. Either way, plus 0.4 for each `tie` effect.
  - Cards that exile themselves get −0.3. 
- **Choosing:** it samples a card using softmax with a temperature of 0.35. That makes it mostly greedy, with a little randomness.

## RNG
- One global mulberry32 generator, seeded per run. Deck shuffles, AI picks, reward offers and forced discards all draw from it.
- "Restart seed" replays the same shuffles only if you make the same plays.
- There is **no save**.

## UI
The screen has three bands, from top to bottom:
1. **Enemy zone:**
   - a deck pile drawn as a stack of card backs, with a count;
   - the hand face-down, or face-up while you're peeking;
   - a **static full decklist** in Rock / Paper / Scissors columns. It is deliberately *not* updated, so the counting is the player's job;
   - a live **discard** pile in Rock / Paper / Scissors columns.
2. **Clash area:** last round's two cards with the result and damage, plus a strip with every round of this fight.
3. **Your zone:** a deck pile, your hand (click a card or press keys 1–9), your live **draw-pile** contents, and your discard.

HP is shown as pips. Badges show `next +N`, `peeking` and exiled cards. The text log is a side panel.

//? the information shown rather plainly + a small deck resulted in the game feeling very guessable, in a good way. It felt as if there is a strategy for each opponent (or maybe several, but didn't playtest that long tbh)

## Changes from PLAN-v1 (made during playtesting)
- Decks have 5 cards instead of 9. With 5 cards and a hand of 3, the discard gets reshuffled about every 2 rounds, which keeps card counting manageable. And because 5 cards can't split evenly across 3 types, every deck is lopsided enough to play around.
- Rewards **replace** a card instead of adding one.
- Enemy decks are fixed 5-card lists instead of the starter deck plus extra cards.
- Enemy decklists are public.
- Forced discards and extra draws happen after the draw back to 3. Otherwise a forced discard would just be redrawn and do nothing.

## Known issues
- **Balance:** a bot that picks cards at random wins about 5% of runs. 70% of runs die at Paper Pusher, so the AI punishes predictable play hard. Nobody has yet measured how well a human who counts cards does. //? cannot prove or disprove it - did not play that many games
- **Momentum:** "next card +N" is wasted if the next card ties or loses. Undecided whether that's intended.
- **Untuned effects:** Origami Shield's armor 2 fully cancels any hit without a damage bonus. Feint and Bandage only fire on ties, so they are situational.
