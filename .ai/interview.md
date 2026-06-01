# Project Interview

Check boxes and/or fill in blockquotes, then check the completion box at the bottom.

### Q1: Peg Collision — Double-Hit Guard

The spec states "no double-hit same peg in same ball's pass," but the peg evolution system (Dormant→Normal→Glowing→Charged→Explosive) requires multiple hits on the *same* peg across *different* ball passes. How should we define "same pass" for the double-hit guard: (a) per-ball-frame (ball can't hit same peg twice in one physics substep), or (b) per-ball-lifetime (ball can never hit the same peg twice at all)? This affects the `hitPegs` tracking strategy significantly. ---

> Answer: A. seems like the right call here to preserve the peg evolution system.

---

### Q2: Slot Collector — Single-Entry or Multi-Entry Per Ball?

When a ball enters the slot zone at y=560, does a single ball trigger exactly one slot effect (the one it physically collides with), or can multiple slots fire simultaneously if the ball passes through a boundary between two slots? Additionally, if the ball enters the slot zone at a gap between two defined slots, does nothing fire (dead zone) or is there a default behavior? ---

> Answer: Single ball triggers one slot effect.  Ball must land IN a slot completely to avoid the dead zone.

---

### Q3: Payload Interaction Priority

Nine payloads have overlapping or conflicting behaviors (e.g., `ghost` phases through pegs with no bounce, `worm` pierces through pegs without bouncing, `explosive` explodes pegs on hit, `cluster` splits into mini-balls on first hit). If a player queues multiple payloads on a single ball (e.g., `ghost` + `explosive`), what is the resolution order? Should we define a priority hierarchy (e.g., ghost > worm > explosive > cluster > others) or allow combinatorial stacking with defined interaction rules? ---

> Answer:  I could be fun to combine behaviors (within reason).  I'll let you run with this one

---

### Q4: Multi-Ball Physics — Collision Cascade Scope

The spec mentions "multiball mode" as a should-have feature, and payloads like `daemon` (splits into 3) and `cluster` (splits into 3 mini-balls) create multiple active balls. When multiple balls are in flight simultaneously, should ball-to-ball collision detection be enabled? If so, do balls repel each other, pass through, or merge on contact? This impacts both physics complexity and the "no physics desync" performance requirement. ---

> Answer:  Merging when the collide could be fun

---

### Q5: Jackpot System — Reel Mechanics Detail

The jackpot uses a "3-reel match" system with 15% growth per failed spin, but the spec doesn't define the reel symbols, spin duration, or win conditions beyond "all 3 reels match." Should the jackpot reels use the same 7 slot symbols (C, A, P, X, S, O, J) as the slot collector, or a separate symbol set? Additionally, is the jackpot a separate mini-game with player-controlled stop timing, or fully RNG with a fixed spin duration?

> Answer: You can use whatever symbols you want (you'll be making all the graphics anyway).  The jackpot spin is started by the player, but resolves randomly after.

---

- [x] All questions answered (check when complete)
