---
status: open
prototype: throwaway, not kept (a single-file HTML/JS build)
date: 2026-11-26
---

# 0001: Core game loop

## Question

Is a simultaneous-reveal RPS fight, played with a small deck, fun to play by hand? And which parts of [plan-v1](../plan-v1.md) does that depend on?

## Prototype

- A single HTML file of vanilla JS with no build step and no tests. It has been thrown away. This doc is the only record, and **Rules as run** below is detailed enough to rebuild it.
- It was built in parallel with plan-v1. It follows an earlier draft of the plan, then got changed during playtesting.
- **Scope:** one Run of 3 fights against hand-built Opponents, 15 Rule cards, a heuristic AI, and a three-band UI.
- **Left out:** no Draft, no save, no simulator. The engine isn't pure: it uses a global mutable state, and the AI reads the real Hand when it peeks.

## Rules as run

The prototype calls a Match a "fight", the Spent pile the "discard", and the Opponent the "enemy".

**Run**

- 3 fights in a fixed order. After winning fight 1 or 2, you're offered 3 random Cards. You either replace one of your Cards with one of them, or skip.
- Your Deck always stays at 5 Cards. Losing any fight ends the Run.

**Fight setup**

| Side         | HP                   | Deck (public)                                      |
| ------------ | -------------------- | -------------------------------------------------- |
| Player       | 10, reset each fight | Rock, Rock, Paper, Paper, Scissors                 |
| Pebble Kid   | 8                    | Rock ×3, Paper, Scissors                           |
| Paper Pusher | 10                   | Paper, Heavy Paper, Origami Shield, Rock, Scissors |
| The Shredder | 12                   | Shears, Twin Blades, Scissors, Boulder, Bandage    |

**Round**

- Both sides commit a Card in secret, then both are revealed.
- Resolution order:
  1. Spend the "next card +N" bonus.
  2. Reveal effects run.
  3. Work out the outcome. "Wins ties" only works if the other Card doesn't have it too.
  4. Win, loss or tie effects run.
  5. Damage: the loser takes `max(0, 1 + winner's bonuses − loser's armor)`.
  6. Played Cards go to the discard, or are exiled.
  7. Refill the Hand to 3, then extra draws, then forced random discards. The discards come after the refill so they actually cost something.
  8. Check for KO. A mutual KO counts as a loss for the player.

**Cards**

- Plain Cards deal 1 Damage. Rule Cards have triggers on win, loss, tie or reveal. The effects are:
  - +N Damage
  - armor for this Round only
  - heal, capped at max HP
  - draw
  - Opponent discards
  - peek at the next Hand
  - wins ties
  - exiles itself
  - next Card +N
- The Cards are Boulder, Glass Rock, Momentum, Pebble Storm, Feint, Origami Shield, Recycled Paper, Scout, Paper Cut, Heavy Paper, Shears, Bandage, Twin Blades, Rusty Scissors and Whetstone.

**AI**

- It predicts your Throw from your last 6 plays, adding 1 to each type's count to smooth the numbers. When it's peeking, it uses your actual Hand instead.
- It scores each Card in its Hand by expected value, then picks one using softmax at a temperature of 0.35.

**UI**

- Opponent zone: a stack of card backs, its Hand, its **static** full decklist, and its live discard. The decklist and discard are both sorted into R/P/S columns.
- In the middle: the clash, plus a strip showing every Round of this fight.
- Player zone: your Hand, your live draw pile and your discard.

## Diff against the plan

|              | plan-v1                                                                                | Prototype                                       |
| ------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Run          | Draft, then open-ended Matches until 0 HP                                              | 3 authored fights                               |
| HP           | Carries over the whole Run                                                             | Resets each fight                               |
| Match        | Best of 3 Rounds, capped at 5                                                          | HP race to a KO                                 |
| Hand         | Draw 3 per Match and refill only on a tie, so the choice shrinks 3 → 2 → 1             | Refill to 3 every Round                         |
| Deck size    | 5                                                                                      | 5                                               |
| Deckbuilding | Shared-row Draft. Rewards go winner first, then loser, include Upgrades, and add Cards | No Draft. Replace 1 Card or skip                |
| Opponent     | Symmetric mirror                                                                       | Authored decks with their own HP                |
| Cards        | Plain only                                                                             | 15 Rule cards                                   |
| AI           | Random                                                                                 | Counts your past plays and weights its choice   |
| Information  | Spent pile is public                                                                   | Full decklist and discard, both sorted by Throw |

## Findings

**Felt good**

- Playtester verdict: "feels pretty good".
- **Counting.** Seeing exactly what's showing, with a small deck that can't split evenly across R/P/S, made the game "very guessable, in a good way". It gave the playtester the "oh okay that makes sense" moment, and it felt like each Opponent had a strategy to work out.
- **Effects.** They add anticipation and speculation on top of the counting.
- **A fresh puzzle each fight.** Because HP resets, each fight is its own problem.
- **Learning an Opponent.** What made each Opponent learnable was seeing its deck, not its name.

**Felt off**

- **No way to prepare.** Without a Draft or any build step aimed at the next Opponent, you can't get ready for a specific one.
- **Pace.** Each fight felt "a tad bit slow".
- **Envy of the Opponent's cards.** The Opponents had far more Rule cards than the player. Their lopsided decks made up for it, but the player envied them. That's acceptable while a human out-thinks the AI. If the AI improves, the player has to get stronger.
- **AI felt random.** The playtester said: "as if the current hand is more important than the prediction". Analysis backs this up. With +1 smoothing over 6 plays, the prediction stays close to a third for each Throw, so the gap between Card scores is about 0.3. At temperature 0.35, the favourite Card is only about 2–3× more likely than the next. What actually drives the AI's choice is the 3 Cards in its Hand, drawn from a lopsided public deck.

**Unmeasured**

- A bot playing at random wins about 5% of Runs, and about 70% of Runs die at Paper Pusher. Nobody has measured how well a human who counts Cards does.
- Hands bigger than 3 were never seen. Only Twin Blades, Recycled Paper and Feint draw extra.

## Lessons

1. **Refill the Hand to 3 every Round.** plan-v1's shrinking Hand makes the last Round of a Match forced, and it's what the plan's own playtest note complains about. _Confident._
2. **A 5-card Deck with a lopsided Throw mix is what makes counting work.** It reshuffles about every 2 Rounds. Keep `draftSize = 5`, and have Rewards replace Cards instead of growing the Deck. _Confident._
3. **Show the counting information in the UI.** Publish the decklist and group the Spent pile by Throw in `publicView`. This fits [ADR 0001](../adr/0001-pure-engine-with-views.md) as it stands. _Confident._
4. **What makes an Opponent readable is its deck, not how clever the AI is.** A simple Strategy plus an interesting deck is enough to play against. _Likely._
5. **Each Match is an HP race with fresh HP.** Keep "HP carries over the Run" as a config flag for a future hardcore mode, where heal effects would matter more. _Confident._
6. **Keep the Match engine separate from the Run mode.** The Match engine takes two Decks and a config for each side. A Run decides where Decks come from and what happens between Matches. Build authored Opponents first, because that's what was playtested and it's the smaller build. The Shared-row Draft comes later as a second Run type for endless or multiplayer play, with no changes to the engine. _Direction agreed; which comes first is a recommendation._
7. **Show the next Opponent's decklist on the Reward screen.** That turns choosing what to replace into preparing for that Opponent, which fixes "no way to prepare" at almost no cost. _To test._
8. **Bring a small set of Rule cards forward.** They're half of what felt good. Plain-card slices still come first. _Likely._

## Open questions

- **Mutual KO:** should it be a draw or a loss? It needs to be possible in the full game.
- **Pace:** lower HP, or more Damage from effects? Tune it with the simulator.
- **Player power:** should the starter Deck include 1–2 Rule cards? How should player strength scale as the AI improves?
- **Hand size:** normally 3. Should draw effects be allowed to push it over 3 temporarily?
- **Momentum:** is the bonus being wasted on a tie or loss intended?
- **Origami Shield:** armor 2 cancels any plain hit. Is it too strong?
- Could a **future prototype** answer these? For example: plain Cards only but with full counting information, to see how much of the feel comes from counting alone. Or a Draft-then-authored-Opponent hybrid.

## Feeds into

- [plan-v1](../plan-v1.md): Match rules, Hand refill, Reward replacing Cards, Run modes, the Rule cards to bring forward.
- [GLOSSARY](../../GLOSSARY.md): Run, Match, Reward and Draft need redefining. Draft becomes a later Run mode.
- [ADR 0001](../adr/0001-pure-engine-with-views.md): unchanged. `publicView` gains decklists and the Spent pile grouped by Throw.
- A possible new ADR: keeping the Match engine separate from Run modes.
