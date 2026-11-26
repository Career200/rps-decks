# RPS Deck

A rock-paper-scissors deckbuilder: players assemble a deck of throw cards and fight an opponent, with complexity emerging from simple card rules.

## Language

### Structure of play

**Run**:
One complete session of play: a Draft, then Matches back to back until a side reaches 0 HP. There is no fixed number of Matches, and the rules are the same for both sides.
_Avoid_: Game, campaign, session

**Match**:
One best-of-three fight within a Run: each side draws 3 Cards, and the first to win 2 Rounds wins. A Match still undecided after 5 Rounds is a drawn Match.
_Avoid_: Fight, battle, game

**Round**:
One simultaneous reveal within a Match: each side secretly commits one Card from its Hand, both are revealed, and the winning Throw deals its Damage. On a tie, no Damage is dealt and each side draws 1 replacement Card.
_Avoid_: Turn, exchange

**Opponent**:
The AI-controlled side, playing by exactly the same rules as the player.
_Avoid_: Enemy, bot, CPU

**HP**:
A side's health for the whole Run, starting at 10. Reduced only by Damage; a side at 0 HP loses the Run.
_Avoid_: Life, health

### Building the deck

**Pool**:
The source Cards are offered from during a Draft or Reward.
_Avoid_: Collection, catalogue

**Shared row**:
Three face-up options that both sides pick from in turn. Used by both the Draft and the Reward; in a Reward, an Upgrade can be one of the options.
_Avoid_: Market, shop, offer

**Draft**:
The opening phase of a Run: both sides pick from the Shared row, a random side first, until each has 5 Cards.
_Avoid_: Deckbuilding phase, setup

**Reward**:
The Shared row pick after each Match: the winner picks 1 of 3 options, then the loser picks 1 of the remaining 2. After a drawn Match a random side picks first.
_Avoid_: Loot, shop

**Upgrade**:
A Reward option that permanently adds +1 Damage to one of the picking side's Cards.
_Avoid_: Level-up, enhance

### Cards and piles

**Card**:
A single playable unit in a deck. Every Card is a Throw, with Damage and optionally a Rule.
_Avoid_: Move, action

**Throw**:
One of Rock, Paper or Scissors: the shape a Card takes when revealed. Rock beats Scissors, Scissors beats Paper, Paper beats Rock.
_Avoid_: Sign, type

**Damage**:
The amount of HP a Card removes from the opposing side, dealt only when its Throw wins a Round.
_Avoid_: Power, attack

**Rule**:
Extra behaviour printed on a special Card that modifies the basic Throw comparison or its outcome. Prototype Cards have no Rules.
_Avoid_: Ability, effect, modifier

**Deck**:
A side's face-down Cards still waiting to be drawn. Its contents can be deduced, but not its order.
_Avoid_: Library, draw pile

**Hand**:
The Cards a side has drawn and not yet played in the current Match. It is hidden from the other side, and at the end of a Match any unplayed Cards in it go back into the Deck.
_Avoid_: Available cards

**Spent pile**:
The Cards a side has played, kept in play order and visible to both sides. It lasts across Matches.
_Avoid_: Discard, graveyard

**Cycle**:
One pass through a side's Cards: when the Deck can't supply a draw, the Spent pile is shuffled back into it and a new Cycle begins, visible to both sides.
_Avoid_: Reshuffle, loop
