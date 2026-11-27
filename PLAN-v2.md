# PLAN-v2 — TDD sequencing

### Public API (the test seam)
Tests import only from `src/engine/index.ts`, plus `src/engine/testing.ts` for fixtures.

```ts
// match
createMatch(opts: { seed: number; playerDeck: CardId[]; enemyDeck: CardId[];
                    hp?: number; handSize?: number }): MatchState
legalActions(s: MatchState, side: Side): PlayAction[]          // one per card in hand
step(s: MatchState, player: PlayAction, enemy: PlayAction): MatchState  // resolves 1 round; throws on illegal
view(s: MatchState, side: Side): SideView   // own hand, opp hand only if peeked, hp, counts, history, log
result(s: MatchState): 'ongoing' | 'player' | 'enemy'

// ai
chooseAiAction(v: SideView, rng: RngState): [PlayAction, RngState]

// run
createRun(opts: { seed: number }): RunState
stepRun(r: RunState, a: RunAction): RunState
  // RunAction = { kind:'play', cardUid } | { kind:'pickReward', cardId | null } | { kind:'newRun', seed }
  // phase: 'match' | 'reward' | 'won' | 'lost'; 'play' calls AI internally

// persist
serialize(r: RunState): string
deserialize(s: string): RunState | null   // null on corrupt / version mismatch

// cards
CARDS: Record<CardId, CardDef>; STARTER_DECK: CardId[]; REWARD_POOL: CardId[]
```

Test helper, in `testing.ts`:

```ts
scenario()
  .player({ hand: ['shears'], deck: [...], hp: 5, statuses })
  .enemy({ hand: ['rock'] })
  .seed(1)
  .build()  // -> MatchState
```

This builds a valid state directly so tests don't depend on the shuffle, and `play(s, 'shears', 'rock')` resolves a round by card id.

### Step 0: Skeleton (no behaviour)
- Scaffold Vite react-ts and add Vitest.
- Write `types.ts` and an `index.ts` that exports all the signatures above as stubs that `throw new Error('not implemented')`.
- Write `testing.ts`, the scenario builder.
- Run `npm test` and confirm the harness runs.
- Commit: "API skeleton".

### Slices (each one: write failing tests → implement → green → commit)
1. **RNG and determinism:**
   - The same seed gives the same sequence.
   - `createMatch` deals `handSize` cards and is deterministic per seed.
2. **Plain clash:**
   - R>S, S>P, P>R, and ties.
   - The winner deals power damage.
   - The played card goes to discard and both sides draw back to the hand size.
3. **Legality:**
   - `legalActions` equals the hand.
   - `step` throws on a card not in hand.
4. **Deck cycle:** when the deck is empty, the draw reshuffles the discard (seeded).
5. **KO and result:**
   - At HP ≤ 0, `result` returns the winner.
   - Mutual KO gives `'enemy'`.
   - `step` after a match is over throws.
6. **Effects, one sub-slice each**, each tested with a named card through `play()`:
   - bonusDamage
   - armor
   - heal (capped at max HP)
   - winTies
   - draw
   - opponentDiscardRandom
   - peek (`view` exposes the opponent's hand)
   - exileSelf (the card is not in the discard)
   - nextCardBonus (status carries over one round, then expires)
7. **Trigger ordering:** a test that pins down the resolution order, e.g. peek happens before discard, and armor is applied after bonusDamage.
8. **View hiding:** the opponent's hand is hidden unless peeked, and counts are always visible.
9. **AI (property tests):**
   - It always returns a legal action.
   - It is deterministic per rng state.
   - After the player plays Rock 5 times, it picks Paper ≥70% of the time across 200 seeds, given a hand containing Paper.
   - With a peeked hand, it prefers a guaranteed winner.
10. **Run flow:**
    - A win moves to `reward` with 3 distinct options.
    - A pick adds the card to the deck and starts the next fight.
    - Skip is allowed.
    - A loss leads to `lost`, and winning fight 3 leads to `won`.
    - `newRun` resets the run.
11. **Persist:**
    - The serialize/deserialize round trip is equal.
    - It returns null on garbage input or a version mismatch.
12. **UI (thin, not TDD'd):**
    - `App` holds `useReducer(stepRun)` and autosaves.
    - Views render `view()` and `state.log` as text.
    - A single smoke test with React Testing Library is optional.
13. **Balance pass:** a manual playtest, then tune HP, powers and the enemy decks.

### Verification
- `npm test` is green after each slice.
- `npm run build` reports no type errors.
- `npm run dev`: play a full 3-fight run, reload mid-match to confirm the save resumes, and use the same seed to confirm the shuffles are reproducible.
