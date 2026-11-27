# v1 plan: engine prototype

Goal: a working **prototype** of the core loop. Prototype means plain Rock, Paper and Scissors Cards only, with no Rules. It's built test-first as a pure TypeScript engine. On top of the engine sit a RandomStrategy, a headless simulator, and a minimal text-level React page for playing a Run by hand.

Vocabulary: [`GLOSSARY.md`](../GLOSSARY.md). Architecture: [ADR 0001](./adr/0001-pure-engine-with-views.md). Loop diagram: [Game Loop doc](https://claude.ai/artifact/KnseH7itUrxRs3o3fLZevo).

## Rules being implemented

- **Run**: a Draft, then Matches back to back until a side reaches 0 HP. Both sides start at 10 HP, and the rules are the same for both. The game sets no Match limit.
- **Draft**: a Shared row of 3 Cards. Sides alternate picks, with a random side picking first, and the row refills after each pick until each side has 5 Cards.
- **Match**: shuffle, then each side draws 3. It's a best of three, so the first side to win 2 Rounds wins the Match. A Match still undecided after 5 Rounds is drawn.
- **Round**: both sides commit one Card from Hand in secret, then both Cards are revealed. The winning Throw deals its Card's Damage to the loser's HP. On a tie, no Damage is dealt and each side draws 1 replacement. Played Cards go to the Spent pile. If any side hits 0 HP, the Run ends at once.
- **End of Match**: Cards left unplayed in the Hand go back into the Deck.
- **Draw**: if the Deck runs out, draw whatever is left, shuffle the Spent pile back in (a public **Cycle** event), then draw the rest.
- **Reward**, after every Match that doesn't end the Run:
  - A Shared row of 3 options. Each slot is independently either a Card or an Upgrade.
  - The winner picks 1, then the loser picks 1 of the remaining 2, and the leftover option is discarded. After a drawn Match, a random side picks first.
  - **Upgrade**: the picking side chooses any Card it owns, in its Deck or Spent pile, to get +1 Damage.
  - A new Card goes into the Deck. _This is a default I've chosen; check it in playtesting._

### Config (with defaults)

| key                   | default      |
| --------------------- | ------------ |
| `startingHp`          | 10           |
| `draftSize`           | 5            |
| `rowSize`             | 3            |
| `handSize`            | 3            |
| `roundsToWinMatch`    | 2            |
| `roundCap`            | 5            |
| `rewardUpgradeChance` | 1/3 per slot |
| `baseDamage`          | 1            |

## Engine API (`src/engine`)

```ts
type Side = 'player' | 'opponent'
type Throw = 'rock' | 'paper' | 'scissors'
type Card = { id: CardId; throw: Throw; damage: number }
type RowOption = { kind: 'card'; card: Card } | { kind: 'upgrade' }

type Phase =
  | { kind: 'draft'; toPick: Side }
  | { kind: 'round'; matchNo: number; roundNo: number; committed: Partial<Record<Side, CardId>> }
  | { kind: 'reward'; toPick: Side }
  | { kind: 'ended'; winner: Side }

type Action =
  | { type: 'draftPick'; side: Side; option: number }
  | { type: 'commit'; side: Side; cardId: CardId }
  | { type: 'rewardPick'; side: Side; option: number; upgradeTarget?: CardId }

createRun(config: Config, seed: number): GameState
applyAction(state: GameState, action: Action): { state: GameState; events: GameEvent[] }   // throws on an illegal action
pendingSides(state): Side[]                       // who must act now (both sides during a Round)
legalActions(state, side): Action[]
publicView(state): PublicView
privateView(state, side): PrivateView
eventsFor(events, side): GameEvent[]              // ADR 0001
```

`GameState` holds the RNG state, so a seed plus a list of actions replays a Run exactly.

**Events**, each tagged with an audience (`public` or `{ side }`):

- `DraftRowDealt`, `DraftPicked`
- `MatchStarted`
- `CardDrawn`: private. The public version is `CardsDrawn { side, count }`.
- `CycleStarted`
- `CardCommitted { side }`: public, but carries no Card.
- `RoundRevealed`, `DamageDealt`, `RoundTied`
- `MatchEnded { winner | 'draw' }`
- `RewardRowDealt`, `RewardPicked`, `UpgradeApplied`
- `RunEnded`

**Views**:

- `PublicView` holds both sides' HP, Deck size, Spent pile (in order) and Hand size, plus Match and Round numbers, Round wins, the current row, phase, and whether each side has committed.
- `PrivateView` is a `PublicView` plus that side's own Hand and committed Card.

## Around the engine

- `src/ai`: `interface Strategy { chooseCommit(view); chooseDraftPick(view); chooseRewardPick(view) }`. It sees only `PrivateView` and filtered events. v1 ships `RandomStrategy`, which picks uniformly from the legal actions.
- `src/engine/runner.ts`: `playRun(config, seed, strategies)` drives `pendingSides` and `applyAction` until the Run ends, with an optional Match limit. It's shared by the sim and by tests.
- `src/sim`: `pnpm sim --runs 1000 --seed 1` runs Random against Random and stops each Run at 10 Matches. It reports the win rate per side, average Matches per Run, the stalled-Run rate, and average HP left for the winner.
- `src/ui`: a single React page with plain text and buttons. It shows both sides' HP, the row as buttons, your Hand as buttons, both Spent piles, and a log of the public history. You play a whole Run against RandomStrategy. It reads only `privateView` and `eventsFor`.

## Tooling

pnpm, Vite with React, strict TypeScript, Vitest and ESLint. An ESLint `no-restricted-imports` rule stops `src/engine/**` from importing `react`, `node:*` or `src/ui|ai|sim`.

## Slices (one issue each, test-first: types → failing tests → code)

1. **Scaffold**: the Vite, React and TS project, Vitest, the ESLint boundary rule, and a seeded RNG (`next`, `int`, `shuffle`) with determinism tests.
2. **A Round, end to end**:
   - Types, `createRun` with fixed hands (a test helper), secret commits, reveal, Throw comparison, Damage and ties.
   - `publicView`, `privateView` and `eventsFor` from the start.
   - A test that one side's commit never shows up in the other side's view or events.
3. **Match**:
   - Draw 3 and play the best of three, with tie replacement draws.
   - The 5-Round cap and drawn Match.
   - Unplayed Cards go back to the Deck.
   - The Run ends at 0 HP partway through a Match.
4. **Spent pile and Cycle**: the Spent pile, the reshuffle partway through a draw, and the public `CycleStarted` event. Includes a leak property test: for random seeds, no event or view for a side contains the other side's Hand or Deck order.
5. **Shared row and Draft**: alternating picks with a random first picker, a row that refills, ending when each side has 5 Cards, then the move into Match 1.
6. **Reward, Upgrade and the Run loop**:
   - A random Card or Upgrade in each slot.
   - Winner first, the loser picks from the 2 that remain, random order after a drawn Match.
   - Choosing the Upgrade target, and new Cards going into the Deck.
   - Then the next Match, until `RunEnded`.
7. **RandomStrategy, runner and simulator**: `legalActions`, `playRun`, and the sim command with its metrics. Includes a smoke test that 1,000 seeded Runs finish or stall without errors.
8. **Text UI**: the React page for playing a Run against RandomStrategy.

Slices 2 to 6 are one after another, because each builds on the last. Slice 7 needs slice 6. Slice 8 needs slice 7.

## Parked

- **AI**: Greedy and card-counting strategies.
- **Rule cards**: making this more than a prototype.
- **Balance**:
  - asymmetric R/P/S Damage
  - guaranteeing at least one of each Throw
  - a limited Pool, so that taking the last copy denies it
  - the third Reward option going to the winner
  - a random +1 Damage on each Reward
  - balancing Upgrades
- **Playtest note**: check draws by hand. Replenishing the Hand doesn't feel satisfying, and there's no sense of reward or progress.
- **Training Match** with an open view and a tracker.
- **Modes**: career or story with card unlocks, tournament multiplayer with swapping each round, and an endless roguelike.
- **Multiplayer**: the server sends only `privateView` and `eventsFor` (see ADR 0001).
