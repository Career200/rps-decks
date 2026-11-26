---
status: accepted
---

# Pure engine, with every reader going through a side's view

The game engine is a pure function, `applyAction(state, action) → { state, events }`, with no I/O, React or Node dependencies. Randomness comes from a seeded RNG whose state lives inside `GameState`, so a seed and the list of actions fully reproduce a Run. Nothing outside the engine reads the raw `GameState`. Strategies, the UI, the simulator's decisions and any future network layer receive only `privateView(state, side)`, which is `publicView(state)` plus that side's own Hand and committed Card.

**Events get the same split.** Each emitted Event carries an audience, either `public` or `{ side }`. Readers get `eventsFor(events, side)`, never the raw list. For example, a `CardDrawn { card: Rock }` for the Opponent is private to the Opponent. The other side sees only `CardsDrawn { side, count }`.

We chose this because the game depends on hidden information: hidden Hands, hidden Deck order, and secret commits within a Round. A mutable engine, or letting the AI read the full state, would be simpler at first. But every reader would then be one careless property access away from cheating. Multiplayer would also mean retrofitting information filtering into every call site. With this design the same filters serve the local AI, the UI and a future server, which only ever sends views and filtered events. Determinism under a seeded RNG also makes the engine testable test-first and lets the simulator reproduce any Run.

## Consequences

- Every new Event type has to declare its audience when it's introduced. A test asserts that `eventsFor(events, side)` never contains the other side's Hand or Deck contents.
- Hidden-information rules such as Deck order and simultaneous commit are enforced in exactly one place, the view and event projections. They are not repeated in each consumer.
