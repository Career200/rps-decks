# RPS Deckbuilder — v1 Prototype Plan

## Context
BRIEF.md: "Rock-paper-scissors deckbuilder. v1: minimal ruleset, one AI opponent, text-level UI. Emergent complexity from simple card rules. Stack: TypeScript, React + Vite, no backend." The repo is empty apart from the brief, so this is a greenfield build.

Decisions confirmed with the user:
- **Structure:** a short run of 3 fights. After each win, pick 1 of 3 cards (or skip).
- **Rounds:** simultaneous and hidden. Each side commits 1 card from hand, then both are revealed and resolved.
- **Win condition:** HP race.
- **Effects:** damage/stat modifiers, tie/loss triggers, and deck/hand manipulation. Type-shifting is out of scope.
- **AI:** weighted heuristic that counters the player's observed type frequencies.
- **Extras:** Vitest for the engine, localStorage save, and seeded RNG.

## Core rules (v1)
- Each side has **10 HP**, a **hand of 3**, and draws back to 3 at the end of every round. When the deck is empty, the discard pile is reshuffled into it (seeded).
- **Starter deck (9 cards):** 3× Rock, 3× Paper, 3× Scissors. Plain cards have power 1: the winner of a clash deals `power` damage to the loser.
- **Round resolution order:**
  1. Both cards are revealed.
  2. `onReveal` effects run (e.g. peek, discard).
  3. The RPS outcome is computed. Tie-override statuses can change it, e.g. "win ties".
  4. `onWin` / `onLoss` / `onTie` triggers run. These modify a pending damage packet.
  5. Damage is applied, with armor subtracted and a minimum of 0.
  6. Played cards go to discard (or exile).
  7. Both sides draw.
  8. HP is checked. Mutual KO counts as a loss for the player, to keep the rule simple.
- **Effect primitives** (small, composable, data-driven):
  - `bonusDamage(n)`
  - `armor(n)` (this round only)
  - `heal(n)`
  - `draw(n)`
  - `opponentDiscardRandom(n)`
  - `peekOpponentHand`
  - `winTies`
  - `exileSelf`
  - `nextCardBonus(n)` (a status carried into the next round)
- **Card pool (~15 reward cards), for example:**
  - Boulder: R, +2 dmg on win.
  - Origami Shield: P, armor 2 on loss.
  - Shears: S, onTie: win instead.
  - Scout: any type, onReveal: peek.
  - Recycled Paper: P, onLoss: draw 1.
  - Pebble Storm: R, onWin: opponent discards 1.
  - Bandage: S, onTie: heal 2.
  - Momentum: R, onWin: next card +1.
  - Glass Rock: R, +3 on win, exile self.
  - …and similar.

  Emergent complexity comes from these effects interacting with deck composition and hand reading, not from many rules.

## Architecture
The engine is pure TypeScript with no React imports. All state is serializable, and the RNG state lives inside the game state, so the reducer is deterministic and the whole state can be saved to localStorage as-is.

```
src/engine/
  types.ts      Card, Effect, Trigger, SideState, MatchState, RunState, Action
  rng.ts        mulberry32; next(state) -> [value, newState]; shuffle(arr, rng)
  cards.ts      card definitions (data) + starter deck + reward pool
  effects.ts    applyEffect(ctx, effect) — one switch over effect kinds
  match.ts      createMatch(seed, playerDeck, enemyDeck); matchReducer(state, action)
                actions: PLAY_CARD(cardId) -> enemy picks via ai -> resolveRound
  ai.ts         chooseCard(state): score = Σ_t P(player plays t) * value(card vs t)
                P from player's history + Laplace smoothing (uses actual hand if peeked);
                value = dmg dealt − dmg taken + small effect bonuses; softmax pick via rng
  run.ts        RunState: fight index (0..2), player deck, enemy roster (3 escalating
                decks), phases: 'match' | 'reward' | 'won' | 'lost'; runReducer
src/persist.ts  load/save RunState to localStorage (versioned key; drop on mismatch)
src/ui/
  App.tsx        top-level useReducer(runReducer), autosave effect, New Run button
  MatchView.tsx  HP bars as text, hand as buttons, enemy hand count, deck/discard counts
  RoundLog.tsx   scrolling text log of reveals/effects/damage
  RewardView.tsx pick 1 of 3 (or skip), shows current deck list
  EndView.tsx    run won/lost + seed
```

The engine appends readable log lines to `state.log` as it resolves, so the UI just renders that list. This makes the game text-first by construction.

The text-level UI uses a monospace font and plain buttons. There are no assets and no CSS framework.

## Implementation steps
1. Scaffold: `npm create vite@latest . -- --template react-ts`, then add Vitest. Scripts: `dev`, `build`, `test`.
2. Write `types.ts` and `rng.ts`, with a test showing that the same seed gives the same sequence.
3. Write `cards.ts`, `effects.ts` and `match.ts`, with tests for:
   - basic RPS outcomes
   - each effect primitive
   - trigger ordering
   - reshuffle on an empty deck
   - KO detection
   - determinism: the same seed and same actions give an identical final state
4. Write `ai.ts`, with tests showing it prefers the counter when the player's history is skewed, and that it is deterministic under a seed.
5. Write `run.ts`, with tests for the reward flow (deck grows, next fight starts) and for losing ending the run.
6. Build the UI views and `persist.ts` (save on every state change, resume on load).
7. Do a balance pass: play several runs and tune HP, powers and the enemy decks.

## Verification
- `npm test`: all engine tests pass.
- `npm run build`: no type errors.
- `npm run dev`: manually play a full run (3 fights, with rewards), reload mid-match to confirm resume, and start a new run with a fixed seed to confirm the shuffles reproduce.
- Optionally, drive a playthrough in Chrome via claude-in-chrome to check the UI end-to-end.
