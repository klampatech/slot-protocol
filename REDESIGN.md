# Slot Protocol — Payload & Slot Redesign

> Living document for the payload/slot redesign initiative. Tracks analysis, specs, and implementation plans.

---

## 1. Initial Analysis (2026-06-15)

### Current Payloads — Assessment

#### Tier 1: Clear purpose, fun to use

**Logic Bomb (220cr)** — The gold standard. Triple score on first hit. Clear trigger, clear payoff, clear "when to buy" (high combo floor). The x3 stacks multiplicatively with combo and frenzy, so at cc=7+frenzy it's `base × 8 × 3 × 3 = 72×`. That's a *moment*. No notes.

**Cluster (180cr)** — 3 mini-balls on drop. Chaos, combo potential, covers the board. Good identity. The 60% radius mini-balls are small enough to thread through gaps. Works with every peg type because more balls = more hits. The one issue: it competes directly with Trojan (same concept, different number), and the "shortly after drop" trigger means the split happens above the peg field, so it's somewhat random where the minis go. But the randomness *is* the fun.

**Daemon (130cr)** — Lifetime shield. Clear utility — "insurance against losing this ball." The green shield ring is a nice visual. Good for floors where you're struggling. One subtle problem: the shield bounce (vy=-7) sends the ball back up with a random vx nudge, so the bounced ball can re-enter a slot — but the `shieldedSlot` same-slot guard means you can't double-trigger the same slot. That's a clean design.

#### Tier 2: Has a purpose, but underwhelming

**Explosive (180cr)** — Chain-destroys pegs within 80px on first hit. Useful for objective progress. But the Explosive *peg* (PT.E) already does chain destruction + 500 flat score. The *payload* version costs 180cr and has no score bonus — it's a weaker version of hitting an Explosive peg. The distinction (payload = on-demand, peg = random encounter) is real but doesn't *feel* worth 180cr.

**Trojan (140cr)** — 2 mini-balls on first peg hit. Same concept as Cluster but triggered mid-field. The problem: it's Cluster-but-worse. Cluster gives 3 minis immediately (more coverage), Trojan gives 2 delayed (less coverage, same concept). At 140cr vs 180cr, the price difference is small. Why would anyone pick Trojan over Cluster? There's no unique identity.

**Slowmo (150cr)** — Halves ball speed for lifetime. In theory: more time to build combos, more control. In practice: it just makes the ball feel sluggish. The ball hits the same pegs, just slower. There's no "moment" — no explosion, no split, no reversal. It's the "reduce speed" power-up in every game, and it's always the least exciting one.

**Worm (180cr)** — Ball passes through pegs without bouncing (one-shot, first peg hit). Good concept: "ignore physics, rack up combos." But the description is confusing, the visual feedback is subtle, and at 180cr it's the same price as Explosive and Cluster which have much more visible effects.

#### Tier 3: Questionable value

**Scrambler (80cr)** — Reverses ball direction on first peg hit. The cheapest payload. The concept is "send the ball back up for more hits." The reality: the ball's velocity is reversed, then it immediately hits the next peg and bounces normally. The reversal is a single-frame event — the ball doesn't fly back up to the drop zone. Worse: if the ball is heading *down* into a good trajectory (toward dense pegs), reversing it sends it *away* from the action. It could actively hurt the player.

**Ghost (100cr)** — Ball phases through pegs for lifetime. Same problem as Worm: confusing description, subtle effect, no "moment." The chromatic-aberration render is a nice touch, but "ball goes through pegs" doesn't *feel* powerful. It's functionally identical to Worm (both give hits without bouncing) but framed differently. Two payloads that do the same thing is a design smell.

### Current Slot Effects — Assessment

#### Good

**AMPLIFY (AM)** — +1 combo, chain timer to 210 frames. The *engine* of combo-based play. Clear purpose, high skill expression. Good.

**JACKPOT (JP)** — Adds jackpot to score, jackpot grows 15% if missed. The big payoff. Good.

**CREDITS (CR)** — +50 × (cc+1) × (frenzy?3:1). Bread-and-butter scoring. Scales with combo and frenzy. Good.

#### Has Issues

**PAYLOAD (PA)** — Adds a random payload to queue. *Random.* In a game about strategic payload selection, getting a random payload undermines the shop's purpose. Why buy a specific payload when you might get it free from a slot? And if you get a payload you don't want, it wastes a queue slot.

**SHIELD (SH)** — Sets `GS.shielded = true` for next ball. Insurance, not power. Doesn't make the current ball better — saves the *next* ball from dying. Subtle, hard to plan around.

**OVERCLOCK (OC)** — 1.5× gravity for current ball. *Why would anyone want this?* Higher gravity means the ball falls faster, hits fewer pegs, and reaches the bottom sooner. In a game about hitting as many pegs as possible, making the ball fall faster is actively bad.

**CRUMBLE (CM)** — Destroys up to 3 random non-seismic/explosive pegs. Random destruction removes pegs from the board, which means fewer pegs for future balls to hit. Counterproductive unless specifically clearing objectives.

**EMPTY (E)** — No effect. Biggest design mistake. Phase 4.5-F excluded EMPTY from the pool (good), but the slot type still exists. Should be replaced entirely.

### Core Design Problems

1. **Payloads don't interact with peg types** — The game has 11 peg types with unique behaviors. Payloads trigger on "first peg hit" or "at drop." None of them say "when you hit a Cache peg" or "when you hit a Teleport peg." Huge missed opportunity.

2. **Payloads don't interact with slot effects** — Payloads and slot effects are separate systems. No "if you have X payload and land in Y slot, Z happens."

3. **Two payloads do the same thing (Ghost ≈ Worm)** — Both give "hits without bouncing." Redundant design.

4. **Some effects are anti-fun** — OVERCLOCK (faster fall = fewer hits), EMPTY (nothing), CRUMBLE (destroys pegs), SLOWMO (sluggish without clear payoff).

5. **No combo/synergy system** — No way to chain effects together. No "if you hit a Cache peg and then land in a Credits slot, bonus." The game has the ingredients for combos but no recipe.

6. **Payload triggers are all "first peg hit"** — 7 of 9 payloads trigger immediately. No "save it for the right moment" strategy.

### What Would Make This More Fun

#### Design Principles

1. **Every effect should have a "moment"** — a visible, satisfying trigger that the player notices
2. **Effects should combo with each other** — payloads + slot effects + peg types should interact
3. **Effects should scale with skill** — better players get more value
4. **No dead slots** — every slot effect should be worth placing
5. **Clear identity** — each payload should feel unique

---

## 2. Payload + Peg Interaction System

### Design Direction

The game has 11 peg types with unique behaviors. Payloads currently ignore them — a Logic Bomb triggers on "first peg hit" whether that's a NODE, a CACHE, or an EXPLOSIVE. This is a wasted design surface.

**The idea:** Payloads that interact with peg types create emergent combos. Players don't just buy "a powerful effect" — they buy "an effect that works *this way* with the board in front of them." A GRID template with 8 Cache pegs is a different proposition than a HONEYCOMB template with few Cache but many Honeycomb pegs. The payload choice becomes contextual, not just cost-based.

### Interaction Categories

| Category | Example | Mechanic |
|----------|---------|----------|
| **AoE on hit** | Chain Reaction | Each peg hit triggers an explosion affecting nearby pegs |
| **Peg-type synergy** | Synergy | Specific peg types give bonus effects |
| **Field manipulation** | Magnetize | Pegs move toward the ball's path |
| **Lifetime extension** | Phase (Ghost rework) | Ball warps back for another pass |
| **Delayed payoff** | Echo | Last N hits replay on ball exit |

### New Payloads (Peg-Interaction Focused)

See detailed specs in Section 3.

| Payload | Cost | Category | Mechanic |
|---------|------|----------|----------|
| **CHAIN REACTION** | 200cr | AoE on hit | Each peg hit triggers AoE explosion (30px), affected pegs score 50% |
| **SYNERGY** | 160cr | Peg-type synergy | Cache, Ice, Fiber, Honeycomb give 2× score |
| **MAGNETIZE** | 150cr | Field manipulation | Pegs within 80px attracted toward ball path |

### Existing Payload Reworks

| Payload | Current | Proposed | Reason |
|---------|---------|----------|--------|
| **Scrambler** | Reverses velocity | → **Ricochet**: 3 smart bounces toward nearest unhit peg | Current reversal is unreliable and can hurt the player |
| **Ghost** | Phases through pegs (lifetime) | → **Phase**: Phase + warp back to drop zone on exit | Current is functionally identical to Worm |
| **Worm** | Passes through without bouncing (one-shot) | → **Tunnel**: Pass through + tagged pegs give 2× score + explode on exit | Current has no "moment" |
| **Slowmo** | Halves speed (lifetime) | → **Stasis**: 30-frame time freeze + peg attraction, then resume | Current is sluggish without payoff |
| **Explosive** | Chain-destroys nearby pegs | → **Detonator**: Each peg hit triggers targeted explosion (single peg, not AoE chain) | Current is weaker version of Explosive peg |
| **Trojan** | 2 mini-balls on first hit | Keep but give unique identity: minis inherit the parent's payload flags | Current is worse Cluster |

### Interaction Matrix: New Payloads × Peg Types

#### CHAIN REACTION

| Peg | Interaction | Effect |
|-----|-------------|--------|
| NODE | AoE explosion | Base case — explosion at peg position, nearby pegs take 50% score hit |
| CACHE | Treasure burst | AoE affected pegs also give Cache bonus (200 + cc×50 × 0.5) |
| TELEPORT | Warp chain | AoE triggers teleport on all nearby teleport pegs (cascading warps) |
| SEISMIC | Double shockwave | AoE + Seismic shockwave stack = massive AoE radius |
| EXPLOSIVE | Chain detonation | AoE triggers Explosive peg's chain-destroy → board-wide cascade |
| DORMANT | Activation wave | AoE activates dormant pegs (D→N transition) → sets up future hits |
| ICE | Shatter pulse | AoE hit counts toward Ice's 2-hit requirement → faster crystal activation |
| FIBER | Stress wave | AoE hit counts toward Fiber's 3-hit requirement → faster shatter |
| MIRROR | Deflect burst | AoE around Mirror deflects ball in mirror direction (if ball is in AoE) |
| HONEYCOMB | Accelerate cycle | AoE hit counts toward Honeycomb's 5-hit cycle → faster big hit |
| OVERLOAD | Drain cascade | AoE around Overload drains jackpot per affected peg (capped at 30%) |

#### SYNERGY

| Peg | Interaction | Effect |
|-----|-------------|--------|
| CACHE | 2× score | Cache bonus doubled (200→400, cc×50→cc×100) |
| ICE | 2× score | Ice 2nd-hit bonus doubled (150→300, cc×75→cc×150) |
| FIBER | 2× score | Fiber break bonus doubled (300→600, cc×100→cc×200) |
| HONEYCOMB | 2× score | Honeycomb 5th-hit bonus doubled (500→1000, cc×150→cc×300) |
| All others | No interaction | Normal scoring |

#### MAGNETIZE

| Peg | Interaction | Effect |
|-----|-------------|--------|
| All | Attraction | Pegs within 80px move 15px toward ball's current position per frame |
| NODE | Normal | Standard peg, just moves closer |
| CACHE | Closer = easier hit | Cache pegs pulled into hit range → more score |
| TELEPORT | Paired pull | Both teleport pegs pulled toward ball → potential double hit |
| SEISMIC | Cluster for chain | Seismic pegs pulled together → chain shockwave potential |
| EXPLOSIVE | Cluster for chain | Explosive pegs pulled together → chain detonation potential |
| DORMANT | Activation range | Dormant pegs pulled into activation range → more active pegs |
| ICE | Crystal cluster | Ice pegs pulled together → easier double-hit |
| FIBER | Stress cluster | Fiber pegs pulled together → faster break |
| MIRROR | Deflect zone | Mirror pegs create a "deflection wall" when clustered |
| HONEYCOMB | Cycle acceleration | Honeycomb pegs pulled closer → easier to hit all 5 cycles |
| OVERLOAD | Drain zone | Overload pegs clustered → concentrated jackpot drain |

### Future: Payload + Slot Effect Interactions

Not in scope for initial implementation, but worth noting:

| Payload × Slot | Interaction |
|----------------|-------------|
| Phase + AMPLIFY | Combo persists to the next ball (warp back = same ball) |
| Chain Reaction + CRUMBLE | Instead of destroying, creates 3 new NODE pegs |
| Synergy + CREDITS | Tagged pegs give 3× instead of 2× when Credits slot is active |
| Daemon + SHIELD | Super bounce (vy=-12, guaranteed re-entry) |
| Any payload + PAYLOAD | Payload slot gives the *same* type as the queued payload (no random) |

---

## 3. Payload Specs

### CHAIN REACTION (New)

**Cost:** 200 credits
**Category:** AoE on hit
**Identity:** "Every peg hit is an explosion"

#### Mechanic

- **Trigger:** Every peg hit (not just first — this is the key distinction)
- **Effect:** AoE explosion at peg position, 30px radius
- **AoE scoring:** Affected pegs score at 50% of their normal value (applied before combo/frenzy multipliers)
- **AoE limit:** Each peg can only be AoE-affected once per ball (prevents infinite cascades)
- **Visual:** Orange explosion ring (60px diameter) at each hit point, 20 red particles burst outward
- **Sound:** `playExplosion()` at 60% volume (softer than the Explosive peg's full explosion)
- **Float text:** `'CHAIN +<amount>'` in orange at each AoE point

#### Implementation Notes

- **New field:** `b.chainReaction = true` (set in `dropBall`)
- **New field:** `peg.aoeHit = false` (per-peg per-ball flag, reset on ball exit)
- **Dispatch in `Peg.hit`:** After the normal per-peg-type logic, check `if (b.chainReaction && !p.aoeHit)`, then run AoE logic
- **AoE logic:** Iterate all pegs, if distance < 30px and `!p.aoeHit`, apply 50% score + mark `p.aoeHit = true` + spawn explosion ring + particles
- **The AoE hit does NOT trigger another AoE** (no infinite recursion — the `aoeHit` flag prevents re-triggering)
- **The AoE hit DOES count as a hit for objectives** (`GS.obj.prg++`) and combo chain

#### Cost Justification

200cr is between Worm (180) and Logic Bomb (220). Chain Reaction is powerful (AoE on every hit) but less concentrated than Logic Bomb (3× on one hit). A ball that hits 8 pegs triggers 8 AoE explosions, each affecting 2-4 nearby pegs = ~20-30 total scoring events. At 50% score, that's roughly equivalent to hitting 10-15 extra pegs at full score. The value scales with board density (GRID template = more AoE targets) and combo (each AoE hit contributes to combo chain).

#### Peg-Type Interactions

The AoE hit runs through the same `Peg.hit` logic as a normal hit, which means:

- **CACHE:** AoE hit on a Cache peg gives the Cache bonus (200 + cc×50) at 50% = 100 + cc×25. A Cache peg hit by Chain Reaction's AoE gives *more* than a normal NODE hit — this is the "treasure burst" synergy.
- **EXPLOSIVE:** AoE hit on an Explosive peg triggers `triggerPegExplosion` → chain-destroy of pegs within 80px. This is the "board-wide cascade" — one hit near an Explosive peg can chain through the whole board. The Explosive peg's own chain-destroy has a 80px radius; Chain Reaction's AoE has 30px. So the Explosive peg needs to be within 30px of the initial hit to trigger.
- **SEISMIC:** AoE hit on a Seismic peg triggers the shockwave + screen shake. The shockwave is visual-only (it doesn't do damage), so this is just a visual amplifier — the screen shakes more when Chain Reaction hits a Seismic peg.
- **DORMANT:** AoE hit on a Dormant peg activates it (D→N transition). This is the "activation wave" — Chain Reaction can wake up dormant pegs that the ball wouldn't normally reach.
- **ICE:** AoE hit counts toward Ice's 2-hit requirement. If the ball hits near an Ice peg, the AoE counts as hit 1, and a direct hit later counts as hit 2 → faster crystal activation.
- **FIBER:** AoE hit counts toward Fiber's 3-hit requirement. Same principle — faster shatter.
- **HONEYCOMB:** AoE hit counts toward Honeycomb's 5-hit cycle. This is significant — a single Chain Reaction hit near a Honeycomb peg advances the cycle by 1, and if the ball hits the Honeycomb directly later, that's 2 cycle advances from one trajectory.
- **MIRROR:** No special interaction (Mirror's deflection is a physics effect, not a scoring effect).
- **OVERLOAD:** AoE hit on an Overload peg drains 10% jackpot. If Chain Reaction hits near multiple Overload pegs, the jackpot drains multiple times. Capped at 30% total drain per ball (same as the existing Overload cap).
- **TELEPORT:** AoE hit on a Teleport peg triggers the teleport swap. If the ball is within 30px of a Teleport peg when Chain Reaction's AoE fires, the ball teleports. This can be chaotic but fun — the ball warps mid-explosion.

#### Balance Considerations

- **AoE radius (30px):** Chosen to be smaller than Explosive peg's chain-destroy (80px). Chain Reaction is about *frequent small explosions*, not *one big chain*. The 30px radius means 2-4 pegs per AoE on a dense board, 0-1 on a sparse board.
- **50% score:** Prevents Chain Reaction from being strictly better than hitting the pegs directly. The value is in the *extra hits* (combo building, objective progress), not the raw score.
- **Once-per-peg limit:** Prevents infinite cascades. Without this, an AoE hit on peg A could trigger AoE on peg B, which triggers AoE on peg A, etc.
- **Every hit (not first):** This is the key design choice. Chain Reaction triggers on *every* peg hit, not just the first. This makes it scale with the number of hits — a ball that hits 10 pegs triggers 10 AoEs. This is the "chain" in Chain Reaction.

---

### SYNERGY (New)

**Cost:** 160 credits
**Category:** Peg-type synergy
**Identity:** "Certain pegs give double rewards"

#### Mechanic

- **Trigger:** Passive — the ball's peg hits are evaluated against the synergy list
- **Synergy pegs:** Cache (1), Ice (6), Fiber (7), Honeycomb (9) — the "high-value" peg types
- **Effect:** When the ball hits a synergy peg, the score bonus is doubled (2×)
- **Applies to:** The peg-type-specific bonus only (not the base 50-point hit, not combo/frenzy multipliers)
- **Visual:** Synergy pegs glow with the payload color (#88ddff, light blue) while the ball is in flight. On hit, a blue flash + 12 blue sparkles burst from the peg.
- **Sound:** Bell chime (reuse `_bell` helper) at hit time
- **Float text:** `'2× +<amount>'` in light blue

#### Why These Peg Types?

The four synergy pegs are chosen because they have the highest per-hit bonuses in the game:

| Peg | Normal Bonus | With Synergy | Multiplier |
|-----|-------------|--------------|------------|
| Cache | 200 + cc×50 | 400 + cc×100 | 2× |
| Ice (2nd hit) | 150 + cc×75 | 300 + cc×150 | 2× |
| Fiber (3rd hit) | 300 + cc×100 | 600 + cc×200 | 2× |
| Honeycomb (5th hit) | 500 + cc×150 | 1000 + cc×300 | 2× |

These are the "jackpot" pegs — hitting one feels good, hitting one with Synergy feels *great*. The doubling applies to the bonus portion only, so the base 50-point hit (from `pegBasePoints()`) is unchanged. This means a Synergy Cache hit at cc=0 is 50 + 400 = 450 (vs 50 + 200 = 250 normally).

#### Why NOT Other Pegs?

- **NODE:** No bonus to double (just base points)
- **TELEPORT:** Bonus is small (+100) and the effect is positional, not scoring
- **SEISMIC:** Bonus is flat (+100) and the effect is AoE/visual
- **EXPLOSIVE:** Already has chain-destroy, doubling would be redundant
- **DORMANT:** Bonus is activation, not scoring
- **MIRROR:** Bonus is small (+100) and the effect is directional
- **OVERLOAD:** Bonus is +75 but drains jackpot — doubling the drain would be punishing

#### Implementation Notes

- **New field:** `b.synergy = true` (set in `dropBall`)
- **Dispatch in `Peg.hit`:** After the per-peg-type bonus is computed, check `if (b.synergy && [C.PT.C, C.PT.I, C.PT.F, C.PT.H].includes(p.type))`, then double the bonus
- **Visual in `render()`:** If `GS.ball && GS.ball.synergy`, draw a subtle glow on synergy pegs (check `p.type` against the list)
- **The doubling applies AFTER combo and frenzy multipliers** — so a Synergy Honeycomb hit at cc=7+frenzy is `(500 + 7×150) × 2 × 8 × 3 = 25,200` (vs 12,600 without Synergy). That's a big number, but Honeycomb's 5th hit is rare and combo 7 + frenzy is hard to maintain.

#### Cost Justification

160cr is between Trojan (140) and Worm (180). Synergy is a passive effect — no explosion, no visual drama. The value is in the *planning*: buy Synergy when the board has many Cache/Ice/Fiber/Honeycomb pegs. On a GRID template with 8 Cache pegs, Synergy gives +200 per Cache hit = +1600 potential bonus. On a GALAXY template with 2 Cache pegs, it's +400. The player has to read the board and decide if Synergy is worth it. That's the strategic depth.

---

### MAGNETIZE (New)

**Cost:** 150 credits
**Category:** Field manipulation
**Identity:** "Pegs come to you"

#### Mechanic

- **Trigger:** Active for the ball's lifetime (set at drop)
- **Effect:** All pegs within 80px of the ball's current position move 2px per frame toward the ball
- **Duration:** While ball is in flight (same as Daemon/Slowmo lifetime)
- **Visual:** Pegs within range glow with a cyan-white aura. The ball has a subtle "gravity well" effect — concentric rings radiating outward. Pegs visibly move toward the ball (smooth animation, 2px/frame at 60fps = 120px/sec).
- **Sound:** Low hum while active (reuse `_sub` helper, 60Hz sine at 0.05 volume, continuous)
- **Float text:** None during flight — the visual of pegs moving is the feedback

#### Why This Is Fun

Magnetize turns the ball into a gravity well. As the ball falls, pegs are pulled toward it, creating a "sweeping" effect. The ball doesn't hit more pegs directly — it *pulls pegs into its path*. This means:

1. **Dense boards become denser** — pegs cluster around the ball, creating combo chains
2. **Sparse boards become playable** — distant pegs are pulled into range
3. **Combo building is easier** — pegs cluster = more consecutive hits = higher combo
4. **Visual satisfaction** — watching pegs drift toward the ball is inherently satisfying

#### Peg-Type Interactions

Unlike Chain Reaction and Synergy, Magnetize doesn't have per-peg-type interactions — it affects all pegs uniformly. The interaction is *spatial*: pegs that are close together after Magnetize creates emergent combos based on *which* pegs happened to be nearby.

However, some peg types benefit more from clustering:

- **EXPLOSIVE:** If 2 Explosive pegs are pulled together, hitting one triggers chain-destroy on the other → double chain
- **SEISMIC:** If Seismic pegs cluster, hitting one triggers shockwave on the others → visual spectacle
- **HONEYCOMB:** If Honeycomb pegs cluster, the ball can hit multiple in sequence → faster 5-hit cycles
- **DORMANT:** If Dormant pegs are pulled into the ball's activation range, they wake up → more active pegs

These aren't coded interactions — they're emergent from the spatial mechanic. That's the beauty: Magnetize creates *possibilities*, not guarantees.

#### Implementation Notes

- **New field:** `b.magnetize = true` (set in `dropBall`)
- **In `Ball.update`:** If `this.magnetize`, iterate all pegs. If distance < 80px, move peg position 2px toward ball: `p.x += (this.x - p.x) / dist * 2; p.y += (this.y - p.y) / dist * 2`
- **Peg position is permanent** — moved pegs stay in their new position after the ball exits. This means Magnetize reshapes the board for future balls too.
- **Wall row pegs (y=510) are NOT affected** — they're structural, not gameplay. Check `if (p.y < C.SY)` before moving.
- **Performance:** 80-100 pegs × distance check per frame = negligible at 60fps.

#### Cost Justification

150cr is between Daemon (130) and Slowmo (150). Magnetize is a lifetime effect (like Daemon/Slowmo) but with a visible, satisfying mechanic. The value scales with board density and combo potential. On a GRID template, Magnetize can pull 10+ pegs into a tight cluster → massive combo chain. On a GALAXY template, the sparse layout means fewer pegs in range → less value. The player has to read the board.

---

## 4. Implementation Plan

### Phase P1: New Payloads (Peg-Interaction Focused)

**Goal:** Add 3 new payloads (Chain Reaction, Synergy, Magnetize) with full peg-type interactions.

**Scope:** `index.html` (~300 lines), `svg-icons.js` (~30 lines), `tests/unit.js` (~100 lines)

#### Step 1: Add payload metadata to `C.PAYLOADS`

Add 3 new entries to the `C.PAYLOADS` object in `index.html`:

```js
chain_reaction: { name: 'CHAIN REACTION', short: 'C.RXN', desc: 'Each peg hit triggers an AoE explosion (30px). Affected pegs score 50%.', cost: 200, color: '#ff4444', icon: 9 },
synergy:        { name: 'SYNERGY',        short: 'SYNR', desc: 'Cache, Ice, Fiber, and Honeycomb pegs give 2× score.', cost: 160, color: '#88ddff', icon: 10 },
magnetize:      { name: 'MAGNETIZE',      short: 'MAGN', desc: 'Pegs within 80px are attracted toward the ball.', cost: 150, color: '#00ccff', icon: 11 }
```

#### Step 2: Add SVG icons

Add 3 new entries to `svg-icons.js`:
- `getPayloadIcon(9)` — Chain Reaction: orange explosion ring with radial lines
- `getPayloadIcon(10)` — Synergy: light-blue diamond with internal cross (synergy/connection symbol)
- `getPayloadIcon(11)` — Magnetize: cyan concentric rings (gravity well)

#### Step 3: Wire payload flags in `dropBall`

Add 3 new `pl.indexOf` checks after the existing payload flag block:

```js
if (pl.indexOf('chain_reaction') !== -1) { newBall.chainReaction = true; }
if (pl.indexOf('synergy') !== -1) { newBall.synergy = true; }
if (pl.indexOf('magnetize') !== -1) { newBall.magnetize = true; }
```

#### Step 4: Implement Chain Reaction in `Peg.hit`

After the existing per-peg-type logic block, add:

```js
// Chain Reaction: AoE explosion at peg position
if (b && b.chainReaction && !p.aoeHit) {
    const aoeR = 30;
    const aoeScoreMult = 0.5;
    for (let i = 0; i < GS.bd.length; i++) {
        const ap = GS.bd[i];
        if (ap === p || ap.aoeHit || ap.removed) continue;
        const dx = ap.x - p.x;
        const dy = ap.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < aoeR) {
            ap.aoeHit = true;
            const aoeBonus = pegBasePoints() * aoeScoreMult;
            const aoePts = Math.floor(aoeBonus * (GS.cc + 1) * (GS.fa ? 3 : 1));
            GS.sc += aoePts;
            GS.obj.prg++;
            GS.pegsHit++;
            PERSIST.totalPegsHit++;
            // AoE peg runs its own Peg.hit for type-specific effects
            ap.hit(b);
            // Visual: explosion ring + particles
            spawnPayloadRing(ap.x, ap.y, '#ff4444', 60);
            spawnPegBurstByType(ap.type, ap.x, ap.y);
            // Float text
            createFloat(ap.x, ap.y - 15, 'CHAIN +' + aoePts, '#ff4444');
        }
    }
    // Mark the source peg so it can't be AoE-affected by its own explosion
    p.aoeHit = true;
}
```

#### Step 5: Implement Synergy in `Peg.hit`

In the per-peg-type bonus computation, add a synergy multiplier:

```js
// Synergy: double bonus for Cache, Ice, Fiber, Honeycomb
const synergyTypes = [C.PT.C, C.PT.I, C.PT.F, C.PT.H];
const synergyMult = (b && b.synergy && synergyTypes.includes(p.type)) ? 2 : 1;
// Apply synergyMult to the per-peg-type bonus (not the base pegBasePoints)
```

#### Step 6: Implement Magnetize in `Ball.update`

In the ball update loop, after physics:

```js
// Magnetize: attract nearby pegs
if (this.magnetize) {
    const magR = 80;
    const magStrength = 2; // px per frame
    for (let i = 0; i < GS.bd.length; i++) {
        const p = GS.bd[i];
        if (p.removed || p.y >= C.SY) continue; // skip removed and wall row
        const dx = this.x - p.x;
        const dy = this.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < magR && dist > 0) {
            p.x += (dx / dist) * magStrength;
            p.y += (dy / dist) * magStrength;
        }
    }
}
```

#### Step 7: Add visual effects in `render()`

- **Chain Reaction:** Orange explosion ring at each AoE point (reuse `spawnPayloadRing`)
- **Synergy:** Glow on synergy pegs while ball is in flight (check `GS.ball && GS.ball.synergy`)
- **Magnetize:** Gravity well rings around the ball (concentric circles, fading outward)

#### Step 8: Add audio

- **Chain Reaction:** `playExplosion()` at 60% volume on each AoE
- **Synergy:** Bell chime on synergy peg hit
- **Magnetize:** Low continuous hum (60Hz sine, 0.05 volume) while active

#### Step 9: Update shop and payload slots

- `updateShop`: add 3 new tiles to the shop grid
- `renderPayloadSlots`: already handles dynamic payload count via `C.PAYLOADS` iteration
- `triggerSlotCollected` PA case: already handles random payload from `C.PAYLOADS`

#### Step 10: Tests

Add to `tests/unit.js`:
- Payload metadata: 3 new entries defined, all fields present
- Chain Reaction: AoE fires on peg hit, AoE scoring at 50%, once-per-peg limit
- Synergy: 2× bonus on Cache/Ice/Fiber/Honeycomb, no effect on other types
- Magnetize: pegs move toward ball, wall row unaffected
- Drop ball: flags set correctly for all 3 new payloads
- Shop: 3 new tiles rendered

### Phase P2: Existing Payload Reworks

**Goal:** Rework Scrambler → Ricochet, Ghost → Phase, Worm → Tunnel, Slowmo → Stasis, Explosive → Detonator.

**Scope:** `index.html` (~200 lines), `tests/unit.js` (~80 lines)

(Detailed specs TBD after Phase P1 ships and is playtested.)

### Phase P3: Payload + Slot Interactions

**Goal:** Add interactions between payloads and slot effects.

**Scope:** `index.html` (~150 lines), `tests/unit.js` (~60 lines)

(Detailed specs TBD after Phase P2 ships.)

---

## 5. Design Iterations Log

### 2026-06-15: Initial Analysis

- Identified 6 core design problems with current payloads/slots
- Proposed 3 new payloads (Chain Reaction, Synergy, Magnetize) focused on peg interactions
- Proposed reworks for 6 existing payloads (Scrambler, Ghost, Worm, Slowmo, Explosive, Trojan)
- Proposed 5 slot effect improvements (EMPTY→OVERFLOW, OVERCLOCK→MAGNETIZE, SLOWMO→STASIS, AMPLIFY+burst, JACKPOT+credits)
- Defined design principles: every effect needs a "moment", effects should combo, scale with skill, no dead slots, clear identity

### 2026-06-15: Phase P1 Shipped

**3 new payloads with peg interactions.** All mechanics implemented, 335 tests passing.

Key implementation notes:
- **Synergy uses per-branch bonus tracking**, not delta-score. The `synergyBonusAmount` variable is set inside each eligible peg-type branch (Cache, Ice, Fiber, Honeycomb) before `GS.sc +=`. This captures only the type-specific bonus, not the base `pegBasePoints()`. The Cache branch *replaces* the base bonus (doesn't add on top), so Synergy Cache at cc=3 = 350 + 350 = 700.
- **Chain Reaction AoE uses flat 50% scoring**, not per-type effects. AoE-affected pegs score `pegBasePoints() * 0.5 * (cc+1) * (frenzy?3:1)`. The AoE does NOT call `Peg.hit` on affected pegs (no recursive per-type effects). This keeps Phase P1 simple; per-type AoE interactions can be added later.
- **Magnetize permanently moves pegs** — pulled pegs stay in their new position after the ball exits. This reshapes the board for future balls, creating emergent combo opportunities.
- **`getPayloadIcon` fixed** — was receiving integer indices but expecting string keys. All payloads now use string icon keys. The function was also updated to accept both strings and integers (backward compat).
- **`dropBall` exposed in `__TEST__`** for unit testing payload flag wiring.

Pending: visual effects (Chain Reaction explosion rings, Synergy peg glow, Magnetize gravity well), audio (drop/activation sounds), existing payload reworks.

### 2026-06-15: Phase P2 Shipped

**Visual + audio effects for the 3 new payloads.** 343 tests passing (+8 new).

Audio:
- Chain Reaction: staccato burst on drop (3 rapid ascending ticks), kick+sub+noise boom on first AoE activation
- Synergy: metallic bell ping on drop (single _bell), crystalline 3-harmonic chime on first synergy activation
- Magnetize: deep pull sub-bass+sweep on drop, oscillating sub hum on activation

Visual:
- Chain Reaction: orange `spawnPayloadRing` + red particles at each AoE-affected peg, larger ring at source peg
- Synergy: blue pulsing aura (`ctx.arc` + oscillating alpha) on Cache/Ice/Fiber/Honeycomb pegs while ball is in flight. Draws between peg loop and prediction line.
- Magnetize: 3 concentric gravity-well rings around the ball, pulsing with `sin(ts/300)`. Draws before ball body so ball renders on top.

Activation flags: `chainReactionActivated` and `synergyActivated` on Ball constructor, fire once per ball to prevent audio spam.

### 2026-06-15: Phase P3 Shipped

**5 existing payloads reworked.** All mechanics implemented, 364 tests passing (+21 new).

| Old Name | New Name | Cost | Mechanic | Key Change |
|----------|----------|------|----------|------------|
| Scrambler | **Ricochet** | 80cr | 3 smart bounces toward nearest unhit peg | Reliable (guaranteed 3 extra hits vs old reversal that could hurt) |
| Ghost | **Phase** | 100cr | Phase through + warp back to drop zone once | Unique identity (vs old ghost ≈ worm) |
| Worm | **Tunnel** | 180cr | Pass through + tagged pegs explode on exit | Dramatic payoff (exit cascade vs old subtle pass-through) |
| Slowmo | **Stasis** | 150cr | 30-frame freeze + peg attraction, resume at half speed | Active moment (hang time + cluster vs old sluggish) |
| Explosive | **Detonator** | 180cr | Each peg hit = targeted explosion (500*(cc+1)*pts) | Every-hit trigger (vs old one-shot AoE) |

Key implementation details:
- **Ricochet** steers by setting `b.vx/vy` toward the nearest unhit peg (within 300px) at the ball's current speed. Decrements `ricochetBounces` each time.
- **Phase** warp-back triggers in Ball.update's exit check (`y > C.H + 50`). Resets position to drop zone, velocity to 0/2, clears slot state. `phaseWarps` decrements so it only warps once.
- **Tunnel** tags pegs by ID in `tunnelTagged[]` during Peg.hit's worm activation block. Exit explosion fires in Ball.update's exit check, before `this.on = false`. Staggered 60ms per peg for cascade visual.
- **Stasis** freeze runs in Ball.update before gravity. When `stasisTimer > 0`, velocity is zeroed, pegs within 40px attracted at 3px/frame, and the update returns early (skips all physics). After freeze, `dt60 *= 0.5` for remaining lifetime.
- **Detonator** sets `this.detonate = true` in Peg.hit's flag block. The actual destruction runs AFTER per-type logic (so cache bonus, seismic shockwave, etc. still fire). Score is `500*(cc+1)*(frenzy?3:1)`.

### 2026-06-15: Phase S1/S2/S3 Shipped

**Slot reworks, payload+slot interactions, Trojan rework.** 381 tests passing (+17 new).

Slot Reworks (Phase S1):
- EMPTY → **OVERFLOW**: ball launched back up (vy=-10) for second pass through pegs. Resets slotChecked so the ball can trigger another slot on re-entry.
- OVERCLOCK → **MAGNETIZE slot**: pulls all pegs within 60px toward the ball's landing point (30px per peg). Creates clusters for future balls.
- AMPLIFY + frenzy: activates frenzy (90 frames) when combo >= 3. Turns AMPLIFY into a "combo extender + burst" slot.
- JACKPOT + credits: adds `pegBasePoints*(cc+1)*(frenzy?3:1)` bonus score on top of the jackpot. Makes JACKPOT feel like a "big win".

Payload + Slot Interactions (Phase S2):
- Phase + AMPLIFY: sets `GS.phaseComboPersist = true`. On ball exit, if the flag is set, combo/cc/ct/fa are preserved instead of reset. Flag cleared after one use.
- Chain Reaction + CRUMBLE: instead of destroying 3 pegs, creates 3 new NODE pegs at random positions. Turns destructive into creative.
- Daemon + SHIELD: super bounce (vy=-12 vs normal -7) + wider vx nudge. Daemon balls get a much better second chance from SHIELD slots.

Trojan Rework (Phase S3):
- Minis inherit parent's offensive payload flags: chainReaction, synergy, magnetize, ricochet, ricochetBounces, detonator, stasis.
- Defensive/lifetime flags NOT inherited: worm, ghostMode, trojanActive, cl. Prevents recursive spawning and conflicting mechanics.

Infrastructure:
- `checkSlot(bx, by)` → `checkSlot(bx, by, ball)` — ball parameter threaded through for payload+slot interactions.
- `triggerSlotCollected(slotIdx, slotType)` → `triggerSlotCollected(slotIdx, slotType, ball)` — receives ball for interaction checks.
- `checkBallExit` — checks `GS.phaseComboPersist` before resetting combo.
- `GS.phaseComboPersist` — initialized false in `startGame`, set in AMPLIFY slot when ball has Phase, cleared after one use in `checkBallExit`.
- `C.ST_NAMES` — updated: 'EMPTY' → 'OVERFLOW', 'OVERCLOCK' → 'MAGNETIZE'.
- `C.SLOT_TOOLTIPS` — updated for OVERFLOW and MAGNETIZE.

All planned redesign items are now implemented.

---

## 6. Balance Pass (2026-06-15)

### Problem

The 5% credit earning rate was too generous. Floor 1 earned 350cr — enough for 3 payloads. By floor 10, players could buy 5+. Payloads should feel like meaningful investments, not routine purchases.

### Changes

**Credit rate: 5% → 4%** (divide floor score delta by 25 instead of 20).

| Floor | Old Credits | New Credits | Old Purchases | New Purchases |
|-------|------------|------------|---------------|---------------|
| 1 | 350cr | 280cr | 3 | 2 cheap |
| 5 | 490cr | 392cr | 4 | 2 cheap + 1 mid |
| 10 | 665cr | 532cr | 5 | 2 cheap + 2 mid |
| 15 | 840cr | 672cr | 5+ | 2 cheap + 3 mid |

**Payload cost increases** (all raised to create tighter economy):

| Payload | Old Cost | New Cost | Tier |
|---------|----------|----------|------|
| Ricochet | 80 | 90 | Cheap |
| Phase | 100 | 110 | Cheap |
| Daemon | 130 | 140 | Mid |
| Trojan | 140 | 150 | Mid |
| Stasis | 150 | 170 | Mid |
| Magnetize | 150 | 170 | Mid |
| Synergy | 160 | 180 | Mid |
| Detonator | 180 | 200 | Premium |
| Cluster | 180 | 200 | Premium |
| Tunnel | 180 | 220 | Premium |
| Chain Reaction | 200 | 240 | Premium |
| Logic Bomb | 220 | 250 | Premium |

**Peg target curve: `1.5` → `1.6`** multiplier.

| Floor | Old Target | New Target | Max Hits (5 balls × 8) | Margin |
|-------|-----------|-----------|----------------------|--------|
| 1 | 13 | 13 | 35 | 22 |
| 5 | 19 | 20 | 40 | 20 |
| 10 | 27 | 28 | 45 | 17 |
| 15 | 34 | 36 | 40 | 4 |
| 20 | 42 | 44 | 40 | -4 (needs payloads) |

### Design Rationale

- **Floor 1**: 280cr buys 2 cheap payloads. Player learns the payload system without being overwhelmed.
- **Floor 5**: 392cr buys 2 cheap + 1 mid. First real choice: which mid-tier payload?
- **Floor 10**: 532cr buys 2 cheap + 2 mid. Can almost afford a premium if skipping mids.
- **Floor 15**: 672cr buys 2 cheap + 3 mid. Premium payloads become realistic.
- **Floor 20+**: Requires payloads to clear (target > max raw hits). Payloads are now essential, not optional.

The PA slot (random payload) and daily challenges still provide free payloads, so players aren't entirely dependent on the shop. The tighter economy makes shop purchases feel special.
