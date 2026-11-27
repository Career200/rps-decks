# Prototype findings

Throwaway prototypes are how we test a design question by playing it before we build it properly. Each one gets a findings doc here, numbered in order like the ADRs: `NNNN-short-name.md`.

Prototypes are thrown away: their code is never merged, and their branches and worktrees get deleted. So each doc has to stand on its own. What we keep is the doc: what we tried, what playtesting showed, and what changes in the plan because of it. Choices that are actually settled go into `docs/adr/`. New terms go into `GLOSSARY.md`.

## Template

```markdown
---
status: open | folded-in | superseded
prototype: <what was built, in one line; it is thrown away afterwards>
date: YYYY-MM-DD
---

# NNNN: <the question in a few words>

## Question

What were we trying to find out? One or two sentences.

## Prototype

- What was built (tech, size), with no links to its code, because the code gets deleted.
- Its scope, and what it deliberately left out.

## Rules as run

The rules the prototype actually used, written precisely enough to
reproduce them. Use GLOSSARY terms. Mark anything that differs from the
current plan.

## Diff against the plan

|     | Plan | Prototype |
| --- | ---- | --------- |

## Findings

What the playtester said, quoted where possible. Keep a separate list
for each of these:

- **Felt good**: what to keep, and _why_ it worked.
- **Felt off**: what didn't work.
- **Unmeasured**: claims nobody has checked yet.

## Lessons

What changes in the plan because of this. Number each lesson and say
how sure we are of it.

## Open questions

Things still to decide. Note which ones a future prototype could answer.

## Feeds into

The plan sections, ADRs, glossary terms or issues this doc changes.
```

## Index

| #                          | Question                                    | Status |
| -------------------------- | ------------------------------------------- | ------ |
| [0001](./0001-gameloop.md) | Does the core fight loop feel good to play? | open   |
