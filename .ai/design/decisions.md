# Technical Decision Records — Slot Protocol: Rogue Pachinko

## ADR-001: Single-File Architecture

### Status
Accepted

### Context
The project requires a fully self-contained browser game deliverable via GitHub Pages with zero server-side component. All assets, logic, and styling must travel together.

### Decision
Deliver the entire game as a single `index.html` file (~7000 lines) containing inline CSS and JavaScript. No external dependencies, no CDN assets, no build step.

### Rationale
- **Zero deployment friction:** Drop a single file on GitHub Pages, done. No npm, no bundler, no asset pipeline.
- **Offline-capable:** Once loaded, works without network connectivity. Critical for uninterrupted gameplay sessions.
- **Version control friendly:** Entire game history visible in one file diff. Rollback is a single `git revert`.
- **No dependency hell:** No npm packages to audit, no CDN to trust, no breaking changes from upstream.

### Trade-offs
- **Code organization:** ~7000 lines in one file requires disciplined internal structuring (logical section comments, consistent naming).
- **No code splitting:** Browser downloads entire game on first load, even if player never reaches deep features.
- **GitHub Pages artifact:** The repo artifact is the game itself, not a conventional source structure.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Multi-file project with bundler | Adds build complexity, requires Node.js environment, harder to share/deploy via raw file URL |
| CDN dependencies | External failure points; breaks offline play; version drift risk |
| Webpack/Rollup output | One file at runtime but requires build step; harder for non-technical contributors to edit |

---

## ADR-002: Vanilla JavaScript + HTML5 Canvas

### Status
Accepted

### Context
The game requires real-time physics simulation, particle rendering, and game state management. Need maximum performance without framework overhead.

### Decision
Use vanilla JavaScript (ES6+) with HTML5 Canvas 2D context. No frameworks, no libraries.

### Rationale
- **Performance:** Direct canvas API access with no abstraction layer. Critical for maintaining 60fps with multiple physics objects, particles, and effects.
- **Simplicity:** Game logic maps naturally to imperative JS — no reactive framework mental model overhead.
- **Universal browser support:** ES6+ features (classes, arrow functions, destructuring) are supported in all modern browsers.
- **No bundle overhead:** Interpreted directly; no parse/bundle step for the browser.

### Trade-offs
- **Boilerplate:** No component system — manual DOM manipulation and state management required.
- **Reactivity:** State changes require explicit UI updates rather than declarative binding.
- **Type safety:** No TypeScript types catching errors at compile time.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| React/Vue/Svelte | Virtual DOM overhead incompatible with 60fps canvas game loop; overkill for single-file constraint |
| Three.js/PlayCanvas | 2D game doesn't need 3D rendering; adds ~150KB+ payload |
| Phaser.js | Framework conventions conflict with single-file architecture; adds ~500KB payload |
| TypeScript | Requires build step; compile-time checks outweigh benefit for a 7000-line single-file project |

---

## ADR-003: Singleton State Architecture (GS + PERSIST)

### Status
Accepted

### Context
The game requires two distinct state scopes: runtime game state (balls, score, board) and cross-run persistent state (achievements, unlocks, currency).

### Decision
Maintain two global singleton objects:

- **GS (GameState):** In-memory runtime state, reset on every new run. Fields: `screen`, `floor`, `score`, `balls`, `multiplier`, `board[]`, `floorObjective{}`, `payloadInventory[]`, `jackpotPool`, `frenzyActive`, `frenzyTimer`.

- **PERSIST:** localStorage-backed cross-run state. Fields: `reputation`, `lifetimeBreach`, `totalRuns`, `bestFloor`, `bestScore`, `unlockedPayloads[]`, `purchasedUpgrades{}`, `achievements[]`, `leaderboard[]`, `meta{}`.

### Rationale
- **Clear scope separation:** Runtime vs. persistent state is semantically distinct; separate objects enforce this boundary.
- **Simple serialization:** `PERSIST` object serializes directly to JSON for localStorage; `GS` never touches storage during gameplay.
- **Fast access:** Global singletons avoid prop-drilling through render functions or passing state through deep call stacks.
- **Easy reset:** `startNewRun()` reinitializes GS in-place; PERSIST remains untouched.

### Trade-offs
- **Global mutation:** State changes anywhere can affect anything; requires discipline to avoid hidden dependencies.
- **No time-travel debugging:** State mutations aren't tracked; harder to implement undo/replay.
- **Tight coupling:** Code assumes GS/PERSIST globals exist; no dependency injection.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Redux/MobX state container | Overkill for single-file game; adds store boilerplate; requires bundler |
| Class hierarchy with GameManager | Single game instance makes hierarchy unnecessary; adds instantiation overhead |
| Web Components state | DOM-based, not suited for canvas game state |
| Module pattern with imports | ES modules require either build step or CORS-enabled server for `import` statements |

---

## ADR-004: Two-Phase Collision Detection

### Status
Accepted

### Context
Ball physics require accurate circle-circle collision detection against 40+ pegs per frame at 60fps. Naive O(n) collision checks are acceptable but must be optimized.

### Decision
Implement two-phase collision detection:

1. **Broad phase (spatial band):** For each ball, filter candidate pegs by vertical proximity (ball.y ± (BALL_RADIUS + MAX_PEG_RADIUS + MAX_VEL)). Eliminates ~80% of pegs from consideration.

2. **Narrow phase (circle-circle):** Test only filtered candidates with exact distance check: `dist(ball, peg) < ball.radius + peg.radius`.

### Rationale
- **Performance:** Spatial band filter reduces collision tests from O(balls × pegs) to O(balls × pegs_in_band). For 1 ball and 50 pegs, typically tests 8–12 pegs per frame instead of 50.
- **Simplicity:** No spatial hash grid or quadtree needed for <100 pegs. Band filtering is O(1) per peg.
- **Frame-rate independence:** Band width accounts for max ball velocity (`MAX_VEL=14`), ensuring fast-moving balls don't tunnel through pegs.

### Trade-offs
- **Band tuning:** Band width must account for worst-case velocity. Too narrow → tunneling. Too wide → wasted checks.
- **No broad-phase optimization for many balls:** With 5 simultaneous balls, still processes each independently.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Spatial hash grid | Complexity overhead not justified for <100 pegs; grid cell sizing is fiddly |
| Quadtree | Same as spatial hash; overkill for static peg count |
| Brute force O(n) | Acceptable for 50 pegs but would degrade with extra pegs from modifiers; rejected for future-proofing |
| Swept collision | Ball trajectory interpolation for tunneling prevention; adds complexity, band width sufficient for MAX_VEL |

---

## ADR-005: Delta-Time Physics Normalization

### Status
Accepted

### Context
The game must run consistently across different refresh rates (60Hz monitors, 120Hz gaming displays, variable refresh rate) and frame rate drops.

### Decision
Calculate delta time on each frame and normalize physics to 60fps equivalent:

```javascript
const dt = (timestamp - lastTimestamp) / 1000;  // seconds
const dt60 = dt * 60;                             // "frames" at 60fps

// In Ball.update():
this.vy += GRAVITY * dt60;
this.vx *= Math.pow(FICTION, dt60);
```

### Rationale
- **Refresh rate independence:** Physics behave identically at 60Hz and 120Hz.
- **Frame drop resilience:** Slow frames apply proportionally more physics, preventing "bullet time" behavior.
- **Simplicity:** Single `dt60` multiplier; no separate update paths for different frame rates.

### Trade-offs
- **Fractional positions:** Subpixel rendering may cause slight visual jitter on extreme frame drops.
- **Integer-dependent logic:** Some code assumes 60fps integer frame counts (e.g., stuck detection at 180 frames). These become time-based with sufficient accuracy.
- **MAX_VEL clipping:** Hard velocity cap applies per-frame; at 30fps, ball clips more aggressively, slightly altering behavior.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Fixed timestep with accumulator | Correct but adds complexity (render interpolation); overkill for single-file project |
| Lock to 60fps via setTimeout | Prevents benefiting from 120Hz displays; drops frames rather than running faster |
| Variable timestep (no normalization) | Inconsistent physics across refresh rates; breaks gameplay feel |

---

## ADR-006: CSS Overlay System for UI

### Status
Accepted

### Context
The game requires multiple distinct screens (menu, shop, floor-complete, achievements) layered over the canvas. Managing z-index and visibility is needed.

### Decision
Use HTML/CSS overlays positioned absolutely over the canvas. Each overlay (`#menu-overlay`, `#shop-overlay`, etc.) is a `<div>` with CSS styling, shown/hidden via JavaScript class toggling.

```css
#shop-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 480px; height: 700px;
  z-index: 1000;
  display: none;
}
#shop-overlay.visible { display: flex; }
```

### Rationale
- **Native browser UI:** Text rendering, scrolling, and input handling are handled by the browser, not manual canvas text measurement.
- **CSS animations:** Transitions, glow effects, and hover states use CSS, not manual frame-by-frame animation.
- **Accessibility:** Native HTML elements support browser accessibility features (focus, selection) better than canvas-drawn UI.
- **Separation of concerns:** Game canvas is visual only; HTML handles UI state.

### Trade-offs
- **Z-index management:** Multiple overlays require careful z-index ordering to avoid stacking conflicts.
- **DOM overhead:** 10+ overlay divs exist in DOM even when hidden; minor memory cost.
- **Styling divergence:** CSS styling must manually match canvas visual style; risk of inconsistency.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Canvas-only UI | Manual text rendering, hit detection, scrolling; reinventing browser UI for no benefit |
| React/Vue for UI only | Adds framework overhead while keeping canvas for game; mixed architecture complexity |
| ForeignObject (SVG in canvas) | Browser support inconsistencies; debugging nightmare |

---

## ADR-007: Procedural Peg Board Generation

### Status
Accepted

### Context
Each floor requires a unique peg layout. Generating 40+ peg positions with type distribution manually is infeasible.

### Decision
Implement `generateBoard()` function that:
1. Creates rows with staggered peg positions (odd rows offset by half-spacing)
2. Assigns peg types based on floor-weighted probability tables
3. Ensures teleport pegs are placed in pairs via `pairTeleportPegs()`
4. Adds extra peg rows via `addExtraPegs()` for stormy modifier and higher floors

### Rationale
- **Infinite replayability:** No two floors are identical; keeps roguelike feel fresh.
- **Scalable difficulty:** Peg density and dangerous peg frequency increase with floor number.
- **Single seed per run:** Board generation is deterministic; same floor number always produces same layout (after any RNG seeding is applied).
- **Type pairing enforced:** Teleport pegs are useless without partners; generation ensures functional layouts.

### Trade-offs
- **Procedural edge cases:** Some generated boards may have unintended "free path" or "impossible" trajectories.
- **No handcrafted puzzles:** Deterministic generation prevents designed experiences; purely emergent.
- **Peg count variability:** Different floor types may have significantly different peg counts, affecting difficulty.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Predefined board templates | Requires storing multiple layouts; limits replayability; increases file size |
| Player-drawn boards | Adds UI complexity; breaks roguelike flow |
| Seeded procedural generation | Would enable shareable seeds but adds complexity; current floor-seeded approach sufficient |

---

## ADR-008: 5-State Peg Evolution Machine

### Status
Accepted

### Context
Pegs should feel dynamic, not static. Repeated hits should produce escalating visual and mechanical effects.

### Decision
Implement peg evolution as a 5-state finite state machine:

| State | Trigger | Visual | Mechanical Effect |
|-------|---------|--------|-------------------|
| DORMANT | Board init | `#2A2A2A` dim | Inactive until ball within 40px |
| NORMAL | Activation | Type default color | Standard bounce, 50pts |
| GLOWING | First hit | +glow filter, ×2 pts | Hit count +1 |
| CHARGED | Second hit | Brighter glow, pulsing | Stores 50% bonus, hit count +1 |
| EXPLOSIVE | Upgrade unlock | Red glow, particle aura | ×3 self + ×1.5 adjacent |

State transitions: DORMANT→NORMAL (ball proximity), NORMAL→GLOWING (first hit), GLOWING→CHARGED (second hit, stores bonus), CHARGED→detonate (third hit, releases stored bonus), NORMAL/GLOWING/CHARGED→EXPLOSIVE (with upgrade).

### Rationale
- **Clear player feedback:** Each state is visually distinct; players understand peg status at a glance.
- **Risk/reward mechanic:** Leaving a peg in CHARGED state means bigger payoff but requires ball to return.
- **Upgrade depth:** Explosive state is only unlocked via mastery path, giving long-term progression goal.
- **Performance:** Simple enum comparison; no complex behavior trees.

### Trade-offs
- **Visual complexity:** 5 states × 12 peg types = 60 visual variants; requires careful sprite/color design.
- **Hidden state:** DORMANT→NORMAL is proximity-triggered, not player-visible; players may not understand why peg "appears."
- **Explosive imbalance:** If too common, removes strategic choice; must be rare/expensive to unlock.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Binary hit/unhit state | Too simple; doesn't capture escalation feel |
| Continuous "charge" meter | Harder to read; less discrete feedback |
| Peg destruction on hit | Eliminates comeback mechanics; too punishing |

---

## ADR-009: Payload Inventory System

### Status
Accepted

### Context
Power-ups (payloads) must be purchasable, storable, and activatable without disrupting core gameplay flow.

### Decision
Implement inventory system with:
- **9 payload types** with distinct effects (scrambler, trojan, worm, logicbomb, daemon, ghost, cluster, explosive, slowmo)
- **Max 2 per type** in inventory
- **Queued consumption:** `currentPayloads[]` queue, consumed on next ball drop
- **One-time effect:** Each payload activates once per ball, then is consumed

### Rationale
- **Strategic depth:** Players choose which payloads to equip before dropping; decision matters.
- **Resource management:** Limited inventory (max 2 per type) creates scarcity; can't hoard all payloads.
- **Queue clarity:** `currentPayloads[]` shows exactly what the next ball will do; no ambiguity.
- **Balance:** Rarity tiers (common→uncommon→rare→legendary) with escalating costs prevent early-game dominance.

### Trade-offs
- **Inventory UI complexity:** Displaying multiple payload types with counts requires HUD space.
- **Payload stacking:** If multiple payloads of same type queued, effects should stack (e.g., two clusters = 6 mini-balls).
- **No payload cancellation:** Once queued, player cannot remove payload before ball drop.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Instant-use payloads (tap to activate mid-ball) | Adds input complexity; breaks physics immersion |
| Passive payloads (permanent upgrades) | Reduces strategic decision-making per drop |
| Payload combining/synergies | Complexity overhead; balance nightmare |

---

## ADR-010: Dynamic Slot Collector Unlocking

### Status
Accepted

### Context
The 7-slot collector provides rewards between floors. Not all slots should be available immediately.

### Decision
Slots unlock progressively based on floor number using formula:
```
slotUnlocked = GS.floor >= ((slotIdx % 5) + 1) * floorTier + 1
```

| Slot | Unlock Floor | Effect |
|------|--------------|--------|
| CREDITS (C) | 1 | +50×multiplier breach credits |
| AMPLIFY (A) | 2 | +1 multiplier, 180-frame chain timer |
| PAYLOAD (P) | 3 | Free ball charge |
| CRUMBLE (X) | 4 | Destroys 3 random pegs |
| SHIELD (S) | 5 | Next ball gets shielded bubble |
| OVERCLOCK (O) | 6 | 1.5× gravity for 5 seconds |
| JACKPOT (J) | 1+ | Payout based on pool size |

### Rationale
- **Progression pacing:** Early floors teach players with simple rewards; complex slots unlock as skill develops.
- **Persistent jackpot hook:** JACKPOT is always available but rare, creating ongoing incentive.
- **Build diversity:** PAYLOAD and SHIELD slots enable different playstyles at different floor thresholds.
- **Balanced risk:** CRUMBLE and OVERCLOCK unlock later when player can afford to lose pegs or handle chaos.

### Trade-offs
- **Slot RNG variance:** On floors 2-3, only 2-3 slots may trigger, reducing agency.
- **Late-game slot spam:** Floor 6+ has all slots active; more RNG but also more chaos/reward.
- **Formula complexity:** `((slotIdx % 5) + 1) * floorTier + 1` is opaque; documented but not intuitive.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| All slots available from floor 1 | Removes progression feeling; overwhelming for new players |
| Manual slot selection before drop | Adds UI complexity; breaks the "drop and hope" pachinko feel |
| Unlock via achievements | Additional unlock system adds scope; floor progression is sufficient |

---

## ADR-011: Stuck Ball Recovery System

### Status
Accepted

### Context
Balls can become lodged between pegs, stuck in corners, or trapped in slow oscillations, never exiting naturally.

### Decision
Implement stuck detection with automatic recovery:
```javascript
const STUCK_FRAMES = 180;
const STUCK_DIST_THRESHOLD = 2;

// In Ball.update():
if (dist(this.x, this.y, this.prevX, this.prevY) < STUCK_DIST_THRESHOLD) {
  this.stuckFrames++;
  if (this.stuckFrames >= STUCK_FRAMES) {
    // Apply random kick velocity
    const angle = Math.random() * Math.PI * 2;
    const kickStrength = 5 + Math.random() * 5;
    this.vx = Math.cos(angle) * kickStrength;
    this.vy = Math.sin(angle) * kickStrength - 3; // Bias upward
    this.stuckFrames = 0;
  }
} else {
  this.stuckFrames = 0;
  this.prevX = this.x;
  this.prevY = this.y;
}
```

### Rationale
- **Player experience:** Stuck balls ruin runs; automatic recovery prevents frustration without player intervention.
- **Threshold tuning:** 180 frames (3 seconds at 60fps) is long enough to be sure ball is truly stuck, short enough to not waste player time.
- **Random kick:** Avoids predictable escape path; maintains some roguelike uncertainty.
- **Upward bias:** `vy - 3` ensures ball continues moving, not just spinning in place.

### Trade-offs
- **Artificial rescue:** Some players may feel cheapened by "help" from the system.
- **Kick predictability:** Balls kicked upward may immediately re-stick if trajectory leads back.
- **No player notification:** Player doesn't know recovery occurred; may seem like ball "escaped naturally."

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Manual "unstick" button | Adds UI; interrupts flow; punishes unlucky layouts |
| Peg destruction on stuck | Too aggressive; removes legitimate board states |
| Timer-based ball removal | Loses ball with no reward; frustrating penalty for bad RNG |

---

## ADR-012: Multiplayer-Free Leaderboard System

### Status
Accepted

### Context
Players want competition and high score chasing. Full multiplayer (accounts, servers, anti-cheat) is out of scope.

### Decision
Implement local leaderboard stored in localStorage:
- **Top 10 scores** per run session
- **Fields:** `name`, `score`, `floor`, `date`
- **Submission:** Prompted on run end if score qualifies
- **No cross-player comparison:** Only personal high scores visible

### Rationale
- **Scope containment:** Local-only leaderboard is fully client-side; no server infrastructure.
- **Achievement feel:** Seeing "NEW HIGH SCORE!" provides dopamine hit without multiplayer comparison anxiety.
- **Anti-cheat irrelevant:** Local storage can be manipulated but only affects local player; no competitive integrity to protect.
- **Leaderboard submission:** At least 10% of runs may attempt entry (per success metrics), providing engagement hook.

### Trade-offs
- **No real competition:** Players cannot compare against friends or global population.
- **LocalStorage manipulation:** Savvy users can edit their own scores; accepted as out-of-scope for cheating.
- **Storage limits:** localStorage has ~5MB limit; leaderboard entries are small but accumulate.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Global leaderboard via API | Requires server, auth, anti-cheat; out of scope |
| Firebase/Supabase backend | Adds external dependency; requires account creation |
| Steam leaderboards | Desktop-only; excludes browser players |

---

## ADR-013: Daily Challenge with Date-Seeded RNG

### Status
Accepted

### Context
Daily replayability hook needed; players should return daily for fresh challenge.

### Decision
Implement daily challenge system:
```javascript
function getDailySeed(dateString) {
  // dateString format: "YYYY-MM-DD"
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getDailyModifiers(seed) {
  // Apply seed to RNG, select 2 modifiers from pool
  seededRNG = mulberry32(seed);
  return [MODIFIERS[seededRNG() % MODIFIERS.length], 
          MODIFIERS[seededRNG() % MODIFIERS.length]];
}
```

### Rationale
- **Same challenge for all:** Date seeding ensures all players face identical conditions on a given day.
- **Shared experience:** Players can discuss "today's daily" like Wordle; community formation.
- **One attempt tracking:** `dailyChallenge.bestDailyScore` prevents replay; must complete run in one go.
- **No server needed:** Seed is deterministic; no validation required.

### Trade-offs
- **Date manipulation:** Players can change system date to access "future" challenges; minor exploit, acceptable scope.
- **Modifier imbalance:** Some modifier combinations may be extremely easy or hard; acceptable variance for daily format.
- **No leaderboard:** Can't compare daily scores between players; only personal best.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Weekly challenges | Less frequent; reduces daily habit hook |
| Server-side challenge rotation | Requires backend; out of scope |
| Player-generated seeds | Additional UI complexity; undermines "shared experience" feel |

---

## ADR-014: Particle/Fragment/Effect Systems

### Status
Accepted

### Context
Game requires visual feedback for collisions, explosions, and state changes. Static pegs without effects feel flat.

### Decision
Implement four parallel effect systems:

| System | Trigger | Visual | Lifetime |
|--------|---------|--------|----------|
| **Particles** | Peg hit, cache collect | 8-12 colored dots, radial burst | 30 frames |
| **Fragments** | Crumbling peg destroyed | 4-6 angular shards, gravity-affected | 45 frames |
| **Shockwaves** | Seismic peg detonation | Expanding ring, 0→80px radius | 20 frames |
| **Float text** | Score awarded | "+50" rising text | 60 frames |

Each system maintains its own array, updated and culled each frame. Pools of reusable objects avoid GC pressure.

### Rationale
- **Separation of concerns:** Each effect type has distinct physics (radial vs. gravity vs. expansion vs. float).
- **Object pooling:** Reuse effect objects to minimize garbage collection; critical for 60fps.
- **Configurable:** Each effect type has tunable parameters (count, speed, decay, color).
- **Visual hierarchy:** Shockwaves are rare/impactful; particles are common/minor; clear communication.

### Trade-offs
- **Performance ceiling:** Many simultaneous effects (multiple explosions) can spike CPU usage.
- **Memory overhead:** Four parallel arrays with 100+ objects adds memory pressure.
- **Synchronization:** Effects must be coordinated (explosion + shockwave + particles + screen shake); timing bugs possible.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Single unified effect system | Overly complex; different effects have fundamentally different update logic |
| No effects (text-only feedback) | Too flat; loses arcade "juice" feel |
| Canvas blur/glow filters | Performance-heavy; varies across browsers; not worth the cost |

---

## ADR-015: Achievement Toast System

### Status
Accepted

### Context
17 achievements need to be communicated to players when earned, without interrupting gameplay flow.

### Decision
Implement toast popup system:
```javascript
function showAchievement(id) {
  const ach = ACHIEVEMENTS[id];
  PERSIST.achievements.push(id);
  
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `<span class="ach-icon">${ach.icon}</span><span class="ach-text">${ach.name}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('fade-out'), 2700);
  setTimeout(() => toast.remove(), 3000);
}
```

CSS slide-in animation from right, auto-dismiss after 3 seconds.

### Rationale
- **Non-blocking:** Toast appears in corner; doesn't interrupt mouse tracking or gameplay.
- **Persistent record:** Achievement ID stored in `PERSIST.achievements[]`; survives page refresh.
- **Celebration feel:** Slide-in animation + icon creates moment of recognition.
- **Batch prevention:** Multiple achievements earned simultaneously queue sequentially.

### Trade-offs
- **Toast spam:** If many achievements earned at once (e.g., run-end achievements), queue becomes overwhelming.
- **Timing conflicts:** Toast may cover HUD elements briefly; z-index layering required.
- **No dismiss control:** Player can't manually dismiss; must wait 3 seconds.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Modal popup | Blocks gameplay; too intrusive for optional content |
| Achievement log screen only | Achievements feel less rewarding without immediate notification |
| Persistent banner | Clutters screen; too permanent |

---

## ADR-016: Cyberpunk Visual Theme via CSS/Canvas

### Status
Accepted

### Context
The game identity is "cyberpunk hacker" aesthetic with neon colors on dark backgrounds.

### Decision
Implement visual theme through:
- **CSS custom properties** for color palette:
  ```css
  :root {
    --cyan: #00FFFF;
    --magenta: #FF00FF;
    --yellow: #FFFF00;
    --dark-bg: #0A0A0F;
    --dim-pegs: #2A2A2A;
    --text-glow: 0 0 10px currentColor;
  }
  ```
- **Canvas glow effects:** `shadowBlur` and `shadowColor` for neon glow on pegs and balls.
- **Monospace typography:** `'Courier New', Courier, monospace` system font for code aesthetic.
- **No external assets:** All visuals generated via Canvas API and CSS; no images to load.

### Rationale
- **Instant load:** No image preloading; game renders immediately.
- **Consistent aesthetic:** CSS variables ensure color consistency across DOM and canvas.
- **Contrast mode:** `PERSIST.meta.contrastMode` toggle replaces neon with high-contrast white/grey on dark.
- **System font:** Courier New is universally available; no font loading latency.

### Trade-offs
- **Font limitations:** Courier New is basic; custom font would enhance aesthetic but adds load time.
- **Glow performance:** Canvas `shadowBlur` is expensive; may drop FPS on low-end hardware with many glowing objects.
- **Color accessibility:** Neon colors may be difficult for colorblind players; contrast mode provides alternative.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Custom web fonts (Google Fonts) | Adds network request; FOIT/FOUT; delays gameplay |
| SVG icons | Additional complexity; Canvas drawing sufficient for game elements |
| PNG sprites | Requires external assets; breaks single-file constraint |

---

## ADR-017: HiDPI Canvas Scaling

### Status
Accepted

### Context
Game canvas is 480×700 logical pixels. HiDPI displays (retina) render this at device pixel ratio > 1.

### Decision
Scale canvas for HiDPI while maintaining logical coordinate system:
```javascript
const canvas = document.getElementById('gameCanvas');
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
canvas.style.width = rect.width + 'px';
canvas.style.height = rect.height + 'px';

const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
```

All game coordinates remain in logical 480×700 space; only canvas buffer resolution increases.

### Rationale
- **Sharp rendering:** HiDPI displays show crisp pegs and text; no blur or pixelation.
- **Logical simplicity:** Game logic never needs to account for device pixel ratio; coordinates are always 480×700.
- **Automatic handling:** `window.devicePixelRatio` adapts to any display; no user settings needed.

### Trade-offs
- **Memory overhead:** Canvas buffer is `width × height × 4 bytes × dpr²`. At 2x DPR, 480×700 becomes 960×1400 buffer — ~5MB vs ~1.3MB.
- **Performance cost:** Larger canvas buffer requires more GPU memory bandwidth.
- **CSS scaling edge cases:** Some browsers handle subpixel rounding differently; may cause 1px rendering artifacts.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Fixed 1x canvas (no scaling) | Blurry on HiDPI displays; poor quality |
| Separate HiDPI assets | Requires image assets at 2x resolution; breaks single-file constraint |
| User toggle for HiDPI | Unnecessary complexity; automatic handling preferred |

---

## ADR-018: Tiered Overflow Penalty System

### Status
Accepted

### Context
Ball exit without triggering any slot (overflow) should have escalating consequences as floors progress.

### Decision
Implement floor-scaled overflow penalties:

| Floors | Penalty | Name | Effect |
|--------|---------|------|--------|
| 1-2 | -1 life | "OVERFLOW" | Standard life loss |
| 3 | -2 life | "BREACH" | Double life loss |
| 4 | -2 life + 50% slowmo | "CRITICAL BREACH" | Slow gameplay, warning visuals |
| 5+ | -3 life + multiplier reset + jackpot drain | "SYSTEM FAIL" | Major setback, jackpot pool ×0.8 |

### Rationale
- **Escalating stakes:** Higher floors should feel more punishing; consequences ramp up.
- **Jackpot preservation:** Floor 5+ drains jackpot pool, creating tension around the growing reward.
- **Slowdown as warning:** CRITICAL BREACH slowmo communicates urgency without being just another number.
- **Clear naming:** "OVERFLOW", "BREACH", "SYSTEM FAIL" are cyberpunk-flavored and memorable.

### Trade-offs
- **Complexity:** Four tiers require conditional logic throughout overflow handling.
- **Punctuated equilibrium:** Late floors become extremely punishing; one overflow can end run.
- **Player frustration:** SYSTEM FAIL may feel cheap if jackpot drains despite good play.

### Alternatives Rejected
| Alternative | Reason for Rejection |
|-------------|---------------------|
| Flat -1 life penalty | Too forgiving at high floors; removes tension |
| Progressive only (no slowmo) | Doesn't communicate severity; text-only feedback weak |
| No jackpot drain | Jackpot becomes irrelevant at high floors; no stakes |

---

## Summary

| ADR | Title | Key Trade-off |
|-----|-------|---------------|
| 001 | Single-File Architecture | Code organization vs. deployment simplicity |
| 002 | Vanilla JS + Canvas | Boilerplate vs. performance |
| 003 | GS + PERSIST Singletons | Global mutation vs. simplicity |
| 004 | Two-Phase Collision | Band tuning vs. O(n) simplicity |
| 005 | Delta-Time Normalization | Fractional positions vs. frame-rate independence |
| 006 | CSS Overlays | Z-index management vs. native UI |
| 007 | Procedural Board Gen | Edge cases vs. infinite replayability |
| 008 | 5-State Peg Evolution | Visual complexity vs. player feedback |
| 009 | Payload Inventory | UI complexity vs. strategic depth |
| 010 | Dynamic Slot Unlocking | RNG variance vs. progression pacing |
| 011 | Stuck Ball Recovery | Artificial rescue vs. roguelike uncertainty |
| 012 | Local Leaderboard | No real competition vs. scope containment |
| 013 | Date-Seeded Daily Challenge | Date manipulation vs. shared experience |
| 014 | Effect Systems | Performance ceiling vs. arcade juice |
| 015 | Achievement Toasts | Toast spam vs. celebration feel |
| 016 | Cyberpunk Theme | Glow performance vs. aesthetic |
| 017 | HiDPI Scaling | Memory overhead vs. visual quality |
| 018 | Tiered Overflow Penalties | Player frustration vs. escalating stakes |
