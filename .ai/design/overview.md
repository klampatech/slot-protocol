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
