# Agent Invocation Log

## Metadata

| Field | Value |
|-------|-------|
| Timestamp | 2026-05-28T13:54:13-05:00 |
| Sprint | 0 |
| Phase | sprint_plan |
| Task | 3 - Generate sprint 1 plan |
| Agent | pi |
| Skill | _planner |
| Duration | 31.43s |
| Status | success |

## Prompt

```
You are a project manager. Based on the project goal and design, create the first sprint plan.

## Goal

# Slot Protocol — Rogue Pachinko

## 1. Project Vision

Slot Protocol is a single-file HTML5 canvas game combining pachinko/Plinko ball physics with Peggle-style peg clearing and roguelike meta-progression. Players drop balls from a positioned drop zone, bouncing through procedurally-generated peg boards to hit targets, trigger slot-machine rewards between floors, and progress through increasingly difficult floors. The aesthetic is cyberpunk hacker — neon cyan, magenta, and yellow on black.

## 2. Target Users

**End users:** Casual to mid-core gamers who enjoy physics-based arcade games (Peggle, Pachinko) with roguelike meta-progression hooks. Target audience values:
- Short session play (3–10 min per run)
- High score chasing with leaderboards
- Daily challenge replayability
- Meta-progression unlocks over time

## 3. Problem Statement

No single-page, browser-hosted peggame captured the Peggle/Pachinko formula with actual roguelike depth (floor progression, meta-currency, unlocks, payloads) and a cohesive cyberpunk visual identity. Existing browser Peggle clones are static one-shot games. This project delivers a full roguelike loop — multiple floors per run, earnings that persist across runs, unlockable payloads, upgrades, and skins — all in one 480×700 canvas without any server-side component.

---

## 4. Core Features

### 4.1 Must-Have

**Physics & Gameplay**
1. Ball physics with gravity (0.18 px/frame²), friction (0.995), velocity capping (MAX_VEL=14, hard clip=21), and delta-time normalization for frame-rate independence
2. 12 peg types: `node`, `ice`, `fiber`, `mirror`, `cache`, `honeypot`, `overload`, `crumbling`, `seismic`, `directional`, `teleport`, `speedboost` — each with unique visuals and bounce/scoring behavior
3. Two-phase collision detection: spatial band broad phase + circle-circle narrow phase
4. Ball drop zone with mouse-tracking aim position and dotted trajectory arc preview
5. Stuck ball recovery: if ball moves < 2px for 180 frames, apply random kick velocity
6. Slot collector zone at y=560 (height=50): 7 slots across 480px width, ball triggers slot effect on entry

**Peg Evolution System (5-state machine)**
7. Dormant → Normal → Glowing → Charged → (upgrade) → Explosive
8. Dormant pegs activate when ball comes within 40px — visual state transition from `#2A2A2A` to type default color
9. Evolution chain: normal hit transitions N→Glowing (×2 pts), next hit Glowing→Charged (+50% stored bonus), next hit detonates and releases stored bonus
10. EXPLOSIVE state (×3 self + ×1.5 adjacent on hit) unlocked via upgrade path

**Scoring & Multiplier**
11. Base peg hit: 50 pts × multiplier × (frenzyActive ? 3 : 1)
12. Cache peg: 200 + (multiplier × 50) pts + bonus breach credits
13. Seismic peg: +100 flat bonus
14. Chain multiplier: increments per consecutive peg hit (cap ×7, resets on ball exit)
15. Frenzy mode: ×3 on ALL scoring for 180 frames when comboCount ≥ 5 hits without ball exit
16. Chain timer: 30-frame window per hit, extended by 180 frames with AMPLIFY slot bonus

**Roguelike Structure**
17. Game states: `MENU → TUTORIAL → PLAYING → FLOOR_COMPLETE → SHOP → PLAYING → ... → RUN_END → MENU`
18. Floor objective system: types `standard`, `ghost`, `timelock`, `boss` with target/progress/label/timeLimit
19. Overflow penalty scaling: floor 1–2 (−1 life, "OVERFLOW"), floor 3 (−2, "BREACH"), floor 4 (−2 + 50% slowmo, "CRITICAL BREACH"), floor 5+ (−3, multiplier reset + jackpotPool × 0.8, "SYSTEM FAIL")
20. 5 lives per run, shown as dot indicators in HUD
21. Between-floors NetShop for purchasing payloads and upgrades with breachCredits

**Payloads (9 types in inventory system)**
22. `scrambler` (◎, common, 50cr) — reverses ball direction on first peg hit
23. `trojan` (◈, uncommon, 100cr) — spawns 2 clone balls on peg hit
24. `worm` (≡, rare, 200cr) — pierces through 4–7 pegs without bouncing
25. `logicbomb` (✷, rare, 250cr) — explodes nearby pegs when ball exits
26. `daemon` (✺, legendary, 500cr) — splits ball into 3 on impact
27. `ghost` (▣, rare, 175cr) — phases through 3–5 pegs, no bounce, no score
28. `cluster` (✦, legendary, 450cr) — splits into 3 mini-balls on first hit
29. `explosive` (✸, uncommon, 125cr) — explodes radius of pegs on hit
30. `slowmo` (◐, rare, 200cr) — 50% time dilation for ~5 seconds
31. Payload inventory: max 2 per type, consumed on next ball drop, queued via `currentPayloads[]`

**Slot Collector (7 entries)**
32. CREDITS (C, floor 1): +50×multiplier breach credits
33. AMPLIFY (A, floor 2): +1 multiplier + 180-frame chain timer
34. PAYLOAD (P, floor 3): adds "free ball" charge to payload inventory
35. CRUMBLE (X, floor 4): destroys 3 random pegs on the board
36. SHIELD (S, floor 5): next ball gets shielded bubble
37. OVERCLOCK (O, floor 6): 1.5× gravity for 5 seconds
38. JACKPOT (J, floor 1): +100×multiplier to jackpot pool
39. Jackpot system: base = 500×floor, grows +15%/failed spin, 3-reel match wins, resets to base on win

**Meta-Progression**
40. PERSIST object in localStorage: `reputation`, `lifetimeBreach`, `totalRuns`, `bestFloor`, `bestScore`, `masteryPoints`, `purchasedUpgrades`, `meta{}` (skins, themes, titles, prestige), `achievements[]`, `leaderboard[]`, `dailyChallenge{}`
41. Rank system: Script Kiddie (0) → Script Kiddie+ (500) → Netrunner (1500) → Netrunner+ (4000) → Ghost (10000) → Phantom (25000) → Legend (60000)
42. 17 achievements tracked and toast-popupped on earn
43. Daily challenge: seeded RNG from date, 2 modifiers per day, one attempt tracked

**UI / Screens**
44. `#menu-overlay` — title screen with all stats, buttons: INITIATE BREACH, DAILY CHALLENGE, RESET PROGRESS, CONTRAST MODE, MASTERY, SKINS, ACHIEVEMENTS, LEADERBOARD
45. `#hud` — top bar: floor, score, jackpot, balls remaining + SHOP button
46. Objective progress bar below HUD (fills to target)
47. Multiplier display top-right with chain timer bar beneath
48. `#tutorial-overlay` — first-run how-to-play
49. `#tutorial-modal` — floor-specific tutorials (z-index 9997)
50. `#floor-overlay` — floor complete + jackpot slots
51. `#shop-overlay` — NetShop grid
52. `#runend-overlay` — game over with stats
53. `#achievement-toast` — bottom-right popup, auto-dismisses 3s
54. `#reset-overlay` — reset confirmation modal
55. `#gameover-interstitial` — pulsing "CONNECTION LOST" (z-index 9998)
56. Leaderboard, Achievements, Skins, Mastery overlay screens

**Effects & Feedback**
57. Particle system (collision particles, color-matched)
58. Fragment system (crumbling peg debris)
59. Shockwave system (seismic peg expanding ring)
60. Float text system (rising score/pickup numbers)
61. Screen shake + white flash on major events
62. Trail system on balls (last N positions, color by multiplier)

### 4.2 Should-Have
63. Ball trail colored by current multiplier (cyan→magenta→gold)
64. Screen shake on overload/seismic explosions
65. Ghost ball chromatic aberration effect during ghost payload
66. Slow-mo octagonal blue tint during slowmo
67. Shield ring (green) around shielded balls
68. Multi-ball mode (`multiballEnabled` flag)
69. Peg stormy modifier (additional rows from `addExtraPegs()`)

### 4.3 Nice-to-Have
70. Board theme skins (different background aesthetics)
71. Ball color skins (unlockable colors)
72. BGM system with crossfades between game states
73. WebGL canvas alternative for future hi-DPI performance

---

## 5. Technical Approach

### 5.1 Language & Framework
- **Vanilla JavaScript** + HTML5 Canvas. No frameworks. No build step.
- Single `index.html` file (~7000 lines): CSS + HTML markup + all JS inline
- Fonts: `'Courier New', Courier, monospace` for code aesthetic
- Canvas: 480×700px fixed, HiDPI-aware

### 5.2 Architecture
```
index.html (single file)
├── CSS styles
├── SVG defs (particles, icons)
└── JavaScript
    ├── CONSTANTS & CONFIG (GRAVITY, FRICTION, MAX_VEL, PEG_TYPES, PAYLOADS, SLOT_TYPES, EVOLUTION_STATES, etc.)
    ├── GS (GameState singleton) — runtime game state
    ├── PERSIST (localStorage) — cross-run meta-progression
    ├── Ball class — x,y,vx,vy,radius,payloads[],trail[],hitPegs,per-payload state
    ├── Peg class — x,y,type,state,radius,hitsRemaining,bounceCoeff
    ├── Board generation functions — generateBoard(), pairTeleportPegs(), addExtraPegs(), setupObjective()
    ├── Physics — Ball.update(), checkCollisions(), handlePegHit(), detonateExplosivePeg(), checkDormantActivation()
    ├── Scoring — cascade multiplier, frenzy, comboCount, chainTimer
    ├── Slot system — triggerSlotCollected(), triggerOverflow(), initJackpotSlots(), getSlotX(), getSlotForX()
    ├── UI/HUD — updateHUD(), updateMultiplierDisplay(), updateChainTimerBar(), updateObjectiveBar()
    ├── Overlays — openShop(), openLeaderboard(), openAchievements(), openSkinsScreen(), openMasteryScreen()
    ├── Shop — buyItem(), buyRepItem(), applyUpgrade(), applyMasteryUpgrades()
    ├── Effects — playSound(), triggerShake(), triggerFlash(), spawnParticles(), spawnFragments(), spawnShockwave(), spawnFloatText()
    ├── Daily challenge — getDailySeed(), getDailyModifiers(), applyDailyModifiers()
    ├── Achievements — showAchievement(), unlockAchievement()
    ├── Game loop — requestAnimationFrame(gameLoop), drawLayers()
    └── Init — loadPersist() → startNewRun() → returnToMenu()
```

### 5.3 State Architecture
- **GS** (GameState singleton): in-memory runtime state, reset on every new run
  - Key fields: `screen`, `floor`, `score`, `balls`, `multiplier`, `board[]`, `floorObjective{}`, `payloadInventory[]`, `jackpotPool`, `frenzyActive`, `frenzyTimer`
- **PERSIST** (localStorage key `slotProtocolPersist`): survives across runs
  - Key fields: `lifetimeBreach`, `totalRuns`, `bestFloor`, `unlockedPayloads[]`, `purchasedUpgrades{}`, `achievements[]`, `leaderboard[]`, `dailyChallenge{}`, `meta{}`
- **Ball class instance fields:**
  - Position/velocity: `x, y, vx, vy`
  - State: `active, trail[], hitPegs, dropMultiplier`
  - Payload state: `ghostPhasing, wormPiercing, slowmoActive, clusterSplit, miniBalls[], shielded, isOverloaded, stuckFrames, teleportCooldown`

### 5.4 Configuration
- All constants defined as JS variables at top of script section (GRAVITY, FRICTION, MAX_VEL, MAX_BALL_SPEED, BALL_RADIUS, STUCK_FRAMES, STUCK_DIST_THRESHOLD, CHAIN_EXTEND, CHAIN_AMPLIFY, FRENZY_DURATION, MAX_MULTIPLIER, SLOWMO_DURATION, OVERCLOCK_DURATION, etc.)
- Physics delta-time: `dt60 = dt * 60` frames normalized
- Canvas dimensions: 480×700, SLOT_Y=560, SLOT_H=50, BOARD_TOP=110, BOARD_BOTTOM=480

### 5.5 Data Model

**Entities:**
- `Ball { x, y, vx, vy, radius=7, payloads[], active, trail[], hitPegs, dropMultiplier, ghostPhasing, wormPiercing, slowmoActive, clusterSplit, miniBalls[], shielded, isOverloaded, stuckFrames, teleportCooldown }`
- `Peg { x, y, radius, type, state, bounceCoeff, hitsRemaining, id }`
- `floorObjective { type, target, progress, label, timeLimit }`
- `PERSIST { reputation, lifetimeBreach, totalRuns, bestFloor, bestScore, hasSeenTutorial, unlockedPayloads[], unlockedUpgrades[], masteryPoints, purchasedUpgrades{}, achievements[], leaderboard[], dailyChallenge{lastPlayed, bestDailyScore, dailyAttempts}, meta{} }`
- `payloadDef { id, name, icon, color, rarity, cost, effect }`
- `slotDef { index, name, color, icon, unlockFloor, slotEffect }`

### 5.6 Platform & Deployment
- **Platform:** Browser (all modern browsers, desktop-primary)
- **Delivery:** Single `index.html` served via GitHub Pages at `https://klampatech.github.io/rogue-pachinko/`
- **No server-side component** — all state in localStorage
- **Storage:** localStorage key `slotProtocolPersist`
- **Zero dependencies** — fully self-contained HTML file

### 5.7 Observability
- Console error logging via try/catch on main loop
- No external analytics or telemetry
- Screenshot of game state for bug reports via native `browser_vision` tool

---

## 6. Testing & Validation Strategy

### 6.1 Unit Tests
- **Physics:** Ball.update() — verify gravity accumulation over N frames, friction decay, velocity capping at MAX_BALL_SPEED
- **Collision:** handlePegHit() — verify bounce reflection, scoring awarded, peg hit registered, no double-hit same peg in same ball's pass
- **Multiplier:** verify multiplier increments on consecutive hits, resets to ×1 on ball exit
- **Frenzy:** verify ×3 activation when comboCount >= 5, duration 180 frames, visual flag set
- **Slot unlock:** verify dynamic formula `GS.floor >= ((slotIdx % 5) + 1) * floorTier + 1` unlocks correct slots by floor
- **Jackpot growth:** verify 15% growth per failed spin, reset to base on win
- **Stuck detection:** verify random kick applied after STUCK_FRAMES of minimal movement
- **Peg evolution:** verify DORMANT→NORMAL on 40px approach, N→GLOWING on first hit, GLOWING→CHARGED on second hit, CHARGED→detonate on third hit
- **Payload inventory:** verify max 2 per type, queued consumption via currentPayloads

### 6.2 Integration Tests
- **Full floor run:** Drop 5 balls, verify floor completes when objective target is met
- **Shop flow:** complete floor → open shop → buy item → verify breachCredits deducted and item acquired
- **Run end flow:** lose all 5 balls → verify `#runend-overlay` shown → verify PERSIST fields updated (totalRuns, bestFloor, lifetimeBreach)
- **Achievement unlock:** meet achievement condition → verify toast shown AND ID appended to PERSIST.achievements[]
- **localStorage round-trip:** savePersist() → modify PERSIST in localStorage → loadPersist() → verify field equality

### 6.3 End-to-End / Functional Tests
- **Browser E2E:** Load `https://klampatech.github.io/rogue-pachinko/` in headless Chromium via Playwright/Puppeteer
- **Happy path:** Click INITIATE BREACH → click to drop ball → verify ball spawns and falls → verify peg collision → verify multiplier increments → verify ball enters slot → verify slot effect fires
- **Manual verification checklist:**
  - [ ] Click INITIATE BREACH → game starts (menu overlay hidden, HUD visible, peg board rendered)
  - [ ] Move mouse → aim arc follows cursor horizontally
  - [ ] Click → ball spawns at aim position and falls with gravity
  - [ ] Ball hits peg → bounce occurs AND peg hit counted AND score increases AND multiplier increases
  - [ ] Ball enters slot → slot effect fires AND corresponding visual/audio feedback
  - [ ] Objective filled → FLOOR_COMPLETE overlay shown AND jackpot slots appear
  - [ ] Click thru FLOOR_COMPLETE → SHOP overlay opens with purchasable items
  - [ ] Buy payload → balance deducted AND payload queued
  - [ ] Lose ball → ball count decreases
  - [ ] Lose all balls → RUN_END overlay shown
  - [ ] New high score → name entry shown
  - [ ] Reset called → PERSIST wiped AND menu stats zeroed

### 6.4 Performance Tests
- **FPS target:** Maintain 60fps on mid-range hardware (MacBook, Chrome)
- **Long run stability:** Run 50 consecutive floors in headless mode, verify no memory leaks (ball array cleanup, particle system culling)
- **Ball count stress:** Trigger multiball with 5 active balls simultaneously, verify no physics desync

### 6.5 Security Tests
- **localStorage manipulation:** Manually edit localStorage `slotProtocolPersist` with invalid JSON → verify `loadPersist()` has try/catch and fails gracefully to default state
- **localStorage overflow:** Fill PERSIST with >5MB → verify no browser crash
- **Payload injection:** Attempt to queue more than max-allowed payloads → verify enforcement in `dropBall()`

### 6.6 Test Execution
- **CLI:** Playwright tests run via Node.js `playwright` package
- **Test location:** `tests/` directory in repo with 45+ test files
- **CI:** N/A — single-file browser game, no current CI pipeline
- **Manual QA:** Hermes Squad playtest agents (Elmo, Bert, etc.) validate via Puppeteer/Playwright

### 6.7 Anti-Cheating Measures
- **Score validation:** Compare computed score (50 × multiplier × pegsHit × frenzyBonus) against displayed HUD score — must match within 1%
- **Floor completion logic:** Verify FLOOR_COMPLETE only triggers when floorObjective.progress >= floorObjective.target — not before
- **Ball count enforcement:** `ballsInPlay.length + balls <= GS.balls` invariant — verify no extra balls created
- **Slot lock enforcement:** Attempt to trigger slot before its unlock floor → should be invisible/no-op (slotIndex outside `unlockedSlots`)

---

## 7. Acceptance Criteria

### Happy Path — Core Gameplay
```
Given a new game started from the menu
When INITIATE BREACH is clicked
Then #menu-overlay is hidden, HUD is visible, board has 40+ pegs rendered
```

```
Given a ball has been dropped and is falling
When it collides with a normal node peg
Then bounce occurs (velocity direction changes), peg is registered as hit, score increases by 50 × multiplier
```

```
Given the player hits 5 pegs in succession without ball exit
When the 5th peg is hit
Then frenzy mode activates (×3 on all scoring) for 180 frames, combo timer resets
```

```
Given a ball is in play and the combo count is ×4
When the ball exits via the slot zone (y >= SLOT_Y)
Then multiplier resets to ×1, comboCount resets to 0, slot effect fires for the entered slot
```

### Happy Path — Progression
```
Given floorObjective.progress >= floorObjective.target
When any ball triggers the exit
Then FLOOR_COMPLETE overlay displays, jackpot slot machine appears, score is totaled
```

```
Given FLOOR_COMPLETE is shown with jackpot reels stopped
When all 3 reels match
Then jackpotPool is awarded to score × multiplier, pool resets to jackpotBase
```

```
Given a floor has been completed
When the player clicks CONTINUE in FLOOR_COMPLETE
Then SHOP overlay opens, GS.balls is reset to 5, new board is generated for floor+1
```

```
Given a player has accumulated breachCredits in PERSIST
When the player opens the shop and clicks a payload with sufficient balance
Then breachCredits is deducted, payload is added to currentPayloads queue, HUD payload slots update
```

### Error Handling
```
Given PERSIST contains corrupted localStorage JSON
When loadPersist() is called
Then a default PERSIST object is created, game continues with fresh state, no crash
```

```
Given a ball becomes stuck (moves < 2px for 180 frames)
When the stuck detection threshold is reached
Then a random directional kick velocity is applied to the ball, stuckFrames resets
```

```
Given the player is on floor 1 and floor 4 slot (CRUMBLE) should not be visible
When triggerSlotCollected is called with slotIdx=3
Then no effect fires (slot not in unlockedSlots for this floor)
```

### Performance
```
Given a full runfrom floor 1 through floor 15 is played
When the game loop runs continuously
Then FPS stays above 55 (measured via requestAnimationFrame delta), no gradual frame drop
```

```
Given 5 balls are active simultaneously in multiball mode
When all 5 balls are processed each frame
Then no ball passes through pegs without collision detection (all within spatial band)
```

### Peg Evolution
```
Given a dormant peg exists on the board
When an active ball enters within 40px of it
Then the peg transitions from DORMANT to NORMAL state, color changes from #2A2A2A to type default
```

```
Given an EXPLOSIVE peg exists (via evolution upgrade)
When a ball hits it
Then ×3 score for this peg, ×1.5 bonus to all pegs within 60px radius, particles spawn
```

### Edge Cases
```
Given the player scores a jackpot on floor 1
When the jackpot is paid out
Then jackpotPool resets from 500 to 500×1 = 500 (floor 1 base)
```

```
Given the player's last ball (balls===1) exits the board
When the exit is detected
Then #gameover-interstitial shows immediately with "CONNECTION LOST" before RUN_END overlay
```

```
Given a ghost payload ball hits a normal peg
When it hits the peg
Then ball phases through, peg does NOT bounce, peg does NOT award score (ghost flag consumed)
```

### Visual
```
Given contrast mode is toggled from the menu
When contrast mode is activated
Then all neon colors are replaced with a white/grey on dark theme, stored in PERSIST.meta.contrastMode
```

---

## 8. Out of Scope

- Multiplayer / online leaderboard (local leaderboard only)
- Account system or cloud save
- IAP / real-money purchases
- Mobile touch gesture support (desktop-primary, clicks only)
- Audio track customization
- WASM / WebGL acceleration
- Procedural peg layout seed sharing between players

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Playable first run | New player completes floor 1 within 60 seconds of clicking INITIATE BREACH |
| Floor completion rate | Player with 5 runs averages floor 3+ |
| Daily retention | Daily challenge returns player next day |
| Leaderboard submissions | >10% of runs result in a leaderboard entry attempt |
| Meta-progression depth | Player reaches floor 10+ and unlocks 5+ payloads across runs |
| Spec completeness | This spec covers 100% of code paths in index.html |
| Physics feel | Ball trajectory arc from any drop position is stable (no flapping or tunneling) |
| Shop balance | No payload or upgrade is strictly dominant; all 9 payloads are viable |
| Jackpot hook | Jackpot pool grows measurably across 10 failed spins (confirm +15% growth) |


## Interview Answers

**Multi-Ball Physics — Collision Cascade Scope**: Merging when the collide could be fun

**Jackpot System — Reel Mechanics Detail**: All questions answered (check when complete)
You can use whatever symbols you want (you'll be making all the graphics anyway).  The jackpot spin is started by the player, but resolves randomly after.

**Peg Collision — Double-Hit Guard**: A. seems like the right call here to preserve the peg evolution system.

**Slot Collector — Single-Entry or Multi-Entry Per Ball?**: Single ball triggers one slot effect.  Ball must land IN a slot completely to avoid the dead zone.

**Payload Interaction Priority**: I could be fun to combine behaviors (within reason).  I'll let you run with this one


## Design

# Slot Protocol — Rogue Pachinko: High-Level Design Overview

## 1. Overview

Slot Protocol is a single-file HTML5 canvas game that combines pachinko/Plinko ball physics with Peggle-style peg clearing and roguelike meta-progression. Players drop balls from a mouse-positioned drop zone, bouncing them through procedurally-generated peg boards to hit targets, trigger slot-machine rewards between floors, and progress through increasingly difficult floors.

**Why this exists:** No single-page, browser-hosted peg game currently captures the Peggle/Pachinko formula with genuine roguelike depth (floor progression, meta-currency, unlocks, payloads) and a cohesive cyberpunk visual identity. Existing browser Peggle clones are static one-shot games. This project delivers a full roguelike loop — multiple floors per run, persistent earnings across runs, unlockable payloads, upgrades, and skins — all in one self-contained HTML file with zero server dependency.

**Target audience:** Casual to mid-core gamers who enjoy physics-based arcade games with roguelike meta-progression, valuing short sessions (3–10 min), high score chasing, daily replayability, and long-tail unlock systems.

---

## 2. Architecture

The entire game lives in a single `index.html` file (~7000 lines) with inline CSS and JavaScript. The architecture follows a flat, singleton-driven model organized into logical modules within one script block.

```
index.html
├── CSS Styles (neon cyberpunk theme, overlay layouts)
├── SVG Defs (particle shapes, icon sprites)
└── JavaScript Modules (logical sections)
    ├── CONSTANTS & CONFIG
    ├── GS (GameState singleton) — in-memory runtime state
    ├── PERSIST (localStorage singleton) — cross-run meta-progression
    ├── Entity Classes
    │   ├── Ball
    │   └── Peg
    ├── Board Generation
    ├── Physics Engine
    ├── Scoring & Multiplier System
    ├── Slot Collector & Jackpot
    ├── UI / HUD Management
    ├── Overlays (menu, shop, floor-complete, run-end, etc.)
    ├── Shop & Purchase Flow
    ├── Effects (particles, fragments, shockwaves, float text)
    ├── Daily Challenge
    ├── Achievements
    ├── Game Loop & Rendering
    └── Initialization
```

### State Management

Two parallel state systems govern the game:

| System | Scope | Persistence | Key Fields |
|--------|-------|-------------|------------|
| **GS** (GameState) | Single run | In-memory only | screen, floor, score, balls, multiplier, board[], floorObjective, payloadInventory, jackpotPool, frenzyActive |
| **PERSIST** (localStorage) | Across runs | `slotProtocolPersist` key | reputation, lifetimeBreach, totalRuns, bestFloor, bestScore, unlockedPayloads, purchasedUpgrades, achievements, leaderboard, meta{} |

---

## 3. Key Components

### 3.1 Physics Engine

**Responsibility:** Simulate ball movement, gravity, friction, and peg collisions with frame-rate independence.

- **Ball physics:** Gravity (0.18 px/frame²), friction (0.995), velocity capping (MAX_VEL=14, hard clip=21), delta-time normalization (`dt60 = dt * 60`)
- **Two-phase collision detection:** Spatial band broad phase + circle-circle narrow phase
- **Ball.update():** Applies gravity, friction, velocity capping, stuck detection (< 2px for 180 frames → random kick)
- **checkCollisions():** Broad-phase spatial bands filter candidate pegs; narrow-phase circle-circle tests actual overlap
- **handlePegHit():** Computes bounce reflection, awards score, registers peg hit, triggers peg evolution state transitions
- **Peg evolution (5-state machine):** Dormant → Normal → Glowing → Charged → Explosive, with visual state transitions and score bonuses

### 3.2 Board Generation

**Responsibility:** Procedurally generate peg boards that scale with floor difficulty.

- **generateBoard():** Creates rows of pegs with type distribution weighted by floor number
- **pairTeleportPegs():** Ensures teleport pegs are placed in pairs for functional gameplay
- **addExtraPegs():** Adds extra peg rows for stormy modifier and higher floors
- **setupObjective():** Configures floor-specific objectives (standard, ghost, timelock, boss) with targets, progress tracking, and time limits

### 3.3 Scoring & Multiplier System

**Responsibility:** Track player score, chain multipliers, frenzy mode, and overflow penalties.

- **Base scoring:** 50 pts × multiplier × (frenzyActive ? 3 : 1)
- **Chain multiplier:** Increments per consecutive peg hit (cap ×7, resets on ball exit)
- **Frenzy mode:** ×3 on all scoring for 180 frames when comboCount ≥ 5
- **Chain timer:** 30-frame window per hit, extendable by 180 frames with AMPLIFY slot bonus
- **Overflow penalties:** Scale by floor (−1 life → −3 + multiplier reset + jackpot drain)
- **Peg-specific bonuses:** Cache (+200 + multiplier × 50), Seismic (+100 flat), Explosive (×3 self + ×1.5 adjacent)

### 3.4 Slot Collector & Jackpot

**Responsibility:** Provide mid-run rewards through a 7-slot collector at the board bottom, and between-floor jackpot mini-game.

- **Slot collector (y=560, height=50):** 7 slots across 480px width; ball must enter completely to trigger
- **Dynamic slot unlocking:** `GS.floor >= ((slotIdx % 5) + 1) * floorTier + 1`
- **Slot effects:** CREDITS, AMPLIFY, PAYLOAD, CRUMBLE, SHIELD, OVERCLOCK, JACKPOT
- **Jackpot system:** Base = 500 × floor, grows +15% per failed spin, 3-reel match wins, resets on payout

### 3.5 Payload System

**Responsibility:** Provide consumable power-ups that modify ball behavior.

- **9 payload types:** scrambler, trojan, worm, logicbomb, daemon, ghost, cluster, explosive, slowmo
- **Inventory:** Max 2 per type, consumed on next ball drop, queued via `currentPayloads[]`
- **Payload effects:** Direction reversal, clone spawning, piercing, phasing, splitting, radius explosions, time dilation
- **Rarity tiers:** common → uncommon → rare → legendary, with escalating cost

### 3.6 UI / HUD Management

**Responsibility:** Render game state information and manage overlay screens.

- **HUD:** Floor, score, jackpot, balls remaining, SHOP button
- **Objective progress bar:** Fills toward floor target
- **Multiplier display:** Top-right with chain timer bar beneath
- **Overlay screens:** Menu, tutorial, floor-complete, shop, run-end, achievements, leaderboard, skins, mastery, reset confirmation
- **Achievement toasts:** Bottom-right popup, auto-dismisses after 3 seconds

### 3.7 Effects System

**Responsibility:** Provide visual feedback for game events.

- **Particle system:** Collision particles color-matched to peg type
- **Fragment system:** Crumbling peg debris
- **Shockwave system:** Seismic peg expanding ring
- **Float text:** Rising score/pickup numbers
- **Screen shake + white flash:** Major events (overload, seismic explosions)
- **Ball trails:** Last N positions, colored by multiplier (cyan → magenta → gold)

### 3.8 Meta-Progression

**Responsibility:** Track cross-run achievements, ranks, and persistent unlocks.

- **Rank system:** Script Kiddie → Script Kiddie+ → Netrunner → Netrunner+ → Ghost → Phantom → Legend (based on reputation threshold)
- **17 achievements:** Tracked and toast-popuped on earn
- **Daily challenge:** Seeded RNG from date, 2 modifiers per day, one attempt tracked
- **Mastery system:** Upgrade points spent on persistent bonuses
- **Meta unlocks:** Skins, themes, titles, prestige

---

## 4. Data Flow

### Game Loop

```
requestAnimationFrame(gameLoop)
    │
    ├── dt = frame delta time
    ├── dt60 = dt * 60 (frame-rate normalization)
    │
    ├── Physics Update
    │   ├── Ball.update(dt60) for each active ball
    │   ├── checkCollisions(ball)
    │   │   ├── Broad phase: spatial band filter
    │   │   ├── Narrow phase: circle-circle test
    │   │   └── handlePegHit(ball, peg)
    │   │       ├── Bounce reflection
    │   │       ├── Score update
    │   │       ├── Peg state evolution
    │   │       └── Payload effect application
    │   └── checkDormantActivation(ball)
    │
    ├── Effects Update
    │   ├── Update particles, fragments, shockwaves, float text
    │   └── Cleanup expired effects
    │
    ├── Game State Transitions
    │   ├── Check floor completion (objective.progress >= target)
    │   ├── Check ball exit (y >= SLOT_Y)
    │   │   ├── triggerSlotCollected(ball)
    │   │   ├── cascade multiplier
    │   │   └── triggerOverflow() if no slot hit
    │   └── Screen state transitions (PLAYING → FLOOR_COMPLETE → SHOP → ...)
    │
    └── Render
        ├── drawLayers()
        │   ├── Background
        │   ├── Pegs (state-colored)
        │   ├── Ball trails
        │   ├── Balls
        │   ├── Effects (particles, fragments, shockwaves)
        │   ├── Slot collector zone
        │   └── Trajectory preview arc
        └── updateHUD()
```

### State Transitions

```
MENU → TUTORIAL → PLAYING → FLOOR_COMPLETE → SHOP → PLAYING → ... → RUN_END → MENU
```

Key transition triggers:
- **PLAYING → FLOOR_COMPLETE:** `floorObjective.progress >= floorObjective.target` AND ball exits
- **FLOOR_COMPLETE → SHOP:** Player clicks CONTINUE
- **SHOP → PLAYING:** Player clicks START (balls reset to 5, new board generated)
- **PLAYING → RUN_END:** `balls === 0` (all balls lost)
- **RUN_END → MENU:** Player clicks RETURN TO MENU

### Persistence Flow

```
loadPersist() → PERSIST object populated from localStorage
    │
    ├── On game start: Apply mastery upgrades, meta unlocks
    ├── On payload purchase: Deduct breachCredits, add to inventory
    ├── On achievement unlock: Append to achievements[], trigger toast
    └── On run end: Update totalRuns, bestFloor, bestScore, lifetimeBreach
            │
            └── savePersist() → JSON.stringify → localStorage.setItem()
```

---

## 5. Technology Choices

### HTML5 Canvas (2D Context)

**Rationale:** The game requires real-time rendering of dynamic physics objects (balls, pegs, particles, effects) at 60fps. HTML5 Canvas 2D provides direct pixel manipulation with minimal overhead, no DOM rendering cost per frame, and native support for the visual effects needed (gradient trails, glow effects, particle systems). The 480×700 fixed canvas size ensures consistent gameplay across devices.

### Vanilla JavaScript (ES6+)

**Rationale:** Zero dependencies is a hard requirement. Vanilla JS provides all necessary capabilities — classes, closures, arrays, typed operations — without build steps or framework overhead. The single-file constraint eliminates module bundling complexity. ES6+ features (classes, arrow functions, destructuring, template literals) are universally supported in modern browsers.

### localStorage

**Rationale:** Persistent cross-run state (meta-progression, achievements, leaderboard, daily challenge) requires client-side storage with no server component. localStorage provides simple key-value persistence (5MB+ quota) that survives browser restarts. The `slotProtocolPersist` key stores a single JSON object containing all meta-progression data. Error handling (try/catch on parse) ensures graceful degradation on corrupted data.

### CSS Transitions & Positioning

**Rationale:** Overlay screens (menu, shop, floor-complete, etc.) use CSS absolute positioning with z-index layering for clean screen transitions. CSS transitions handle fade-in/fade-out effects. The cyberpunk aesthetic is achieved through CSS custom properties, text-shadow for neon glow, and border styling — no external assets required.

### requestAnimationFrame

**Rationale:** The game loop uses `requestAnimationFrame` for smooth, browser-synced rendering. Delta-time calculation (`dt = now - lastFrame`) enables frame-rate independent physics via `dt60 = dt * 60` normalization, ensuring consistent behavior across 60fps, 120fps, and variable refresh rate displays.

### Font: Courier New (monospace)

**Rationale:** The cyberpunk hacker aesthetic demands a monospace code aesthetic. Courier New is a system font available on all platforms, requiring no web font loading. The monospace spacing aligns with the terminal/hacker visual identity and ensures consistent character width for HUD text alignment.

---

## Constraints & Non-Goals

- **Single file delivery:** All code in one `index.html` (~7000 lines). No build step, no bundler, no external assets.
- **Zero server dependency:** No API calls, no cloud saves, no analytics. Pure client-side.
- **Desktop-primary:** Mouse-driven input only. No mobile touch gesture support.
- **No multiplayer:** Local leaderboard only. No account system.
- **No IAP:** Free, self-contained game.
- **HiDPI-aware:** Canvas scales for retina displays while maintaining logical 480×700 coordinate space.


## Instructions

Create a sprint document with:
1. Sprint Goal - One sentence describing the objective
2. Tasks - Specific, actionable items with nested sub-tasks
3. Definition of Done - Clear criteria for completion

Focus on getting a minimal working version. Use markdown formatting with NESTED task checkboxes. Each top-level task has sub-tasks indented with 2 spaces, with the skill name followed by a colon:

## Tasks

- [ ] Set up project and implement core functionality
  - [ ] js-coder: Initialize project, implement the main logic, and write tests
  - [ ] _reviewer: Validate implementation works correctly

- [ ] Add remaining features and polish
  - [ ] js-coder: Implement remaining features with tests
  - [ ] _reviewer: Validate all features work end-to-end

CRITICAL sprint sizing rules:
- Keep sprints lean: aim for 2-4 top-level tasks. Each task should be a meaningful chunk of work, NOT a single function or file
- Each task has exactly ONE coder sub-task and ONE _reviewer sub-task. Do NOT add separate code review, test-writing, or design sub-tasks
- The coder writes implementation AND tests together in one sub-task
- Sub-tasks format: "- [ ] skill-name: description"
- End each task with exactly ONE "_reviewer" sub-task for validation
- Available skills: js-coder, cli-designer, _reviewer

IMPORTANT: Write the complete sprint document directly to this file path: /Users/kylelampa/Development/slot-protocol/.ai/sprints/01-initial.md
Do not create any other files. Do not output any summary or commentary. Just write the sprint plan to that exact path.
```

## Response

```
Sprint plan written to `/Users/kylelampa/Development/slot-protocol/.ai/sprints/01-initial.md`
```

