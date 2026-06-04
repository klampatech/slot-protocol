# Slot Protocol — Rogue Pachinko

> Living spec for the game. Updated as features ship. Source of truth: `index.html` (single-file build, 5018 lines as of Phase 2c (reserved-constant annotation)). All 9 payloads wired end-to-end, 6/6 daily modifiers via `modActive(id)`, 17 achievements, 11 peg types, 8 slot types, Phase 4 audio (Web Audio SFX + HTML5 BGM), in-game tooltips for every peg + slot anchored to the mouse. All Known Gaps closed. `MULTIBALL_THRESHOLD` is reserved for the future meta-progression system (design decision, not a bug) - see Known Gaps section.

## Change Log

- **Phase 2c (peg + slot tooltips)** — Added pretty in-game tooltips for all 11 peg types and 8 slot effects. New `C.PEG_TOOLTIPS` and `C.SLOT_TOOLTIPS` lookup tables in the constants, plus a single absolutely-positioned `<div id="tooltip">` styled with a colored name (per type color) and grey description, edge-clamped to the viewport. In both trigger paths the tooltip is anchored to the mouse (clientX/Y) the same way: (1) in-game — `canvas.mousemove` does peg hit-test (radius check with +3px margin) then slot hit-test (only over unlocked slots in the collector zone `y >= C.SY && y <= C.SY + C.SH`); (2) slot-selector — a single delegated `mousemove` listener on `#slot-selector` uses `e.target.closest('.slot-pos, .slot-pool-item')` to find the hovered element, then shows the same tooltip at `e.clientX/Y`. Three position-slot states with distinct text: occupied (shows the assigned slot's tooltip), unlocked-empty (yellow "Drop a slot here to fill this position"), locked (magenta "Drag a slot here to unlock this position", or grey "Locked this floor — rearrange only" when the floor's unlock budget is spent). `canvas.mouseleave` / `#slot-selector mouseleave` and any state change away from `SCR.P` hide the tooltip. Native `title` attribute kept on the divs for keyboard accessibility. New helpers: `showTooltip(header, desc, color, clientX, clientY)` and `hideTooltip()`. Net +169 lines in `index.html` (initial wireup) plus a -13 / +36 follow-up that replaced per-element `mouseenter`/`mouseleave` handlers in the slot-selector with the single delegated `mousemove` (matches the in-game pattern, anchors to mouse in both paths). Smoke checks: every peg/slot tooltip entry has non-empty name+desc, names match the runtime enums (NODE/CACHE/.../OVERLOAD and EMPTY/CREDITS/.../JACKPOT), `showTooltip` correctly sets display/innerHTML/position, `hideTooltip` resets display, both right-edge and bottom-edge clamping flip the tooltip to the opposite side of the cursor when near the viewport boundary, no per-element `mouseenter→showTooltip` handlers remain in source.

### Current Status (as of Phase 2c)

- **All 9 payloads wired and working end-to-end** (`daemon`, `logicbomb`, `explosive`, `scrambler`, `worm`, `trojan`, `ghost`, `cluster`, `slowmo`).
- **All 6 daily modifiers** centralized via `modActive(id)`; daily modal + run-end overlay both work.
- **17 achievements** tracked and toasted; **11 peg types**, **8 slot types**, **2 jackpot spins/floor**, **6 ball skins**, **3 board themes**.
- **Phase 4 audio** complete: Web Audio procedural SFX + 5 HTML5 BGM tracks (title, gameplay, slot-spin, ending, connection-lost), independent SFX/BGM mutes.
- **Phase 2c post-retrofix (MULTIBALL_THRESHOLD reserved)** — Closed the last Known Gap. Decision: leave multiball as a settings-toggle opt-in for now, and reserve the `MULTIBALL_THRESHOLD = 7` constant for the future meta-progression unlock system (e.g. "reach combo 7 to permanently unlock multiball" as a milestone reward, matching the existing ball-skin / board-theme unlock pattern). Annotated the constant in `index.html` (line ~659) with a 5-line comment explaining the reserved intent so future-you knows not to delete it. No behavior change. Net +6 lines in `index.html` (the comment block).
- **Phase 2c post-retrofix #2 (ball count double-decrement on exit)** — Dropping 1 ball that fell through subtracted 2 from GS.bl instead of 1 (e.g. 5 → 3). Root cause in `updateBalls`: the main-ball exit check calls `checkBallExit(GS.ball)` (which does `GS.bl--`) and then sets `GS.ball = null`. The next block, "Check mini balls (if not in multiball mode)", iterates the full `activeBalls` array with a guard `mb !== GS.ball` — but `GS.ball` is now `null`, so the original main ball (still in `activeBalls[0]`, now `!b.on`) passes the guard and `checkBallExit` is called a second time. The same flow produced the `-1` on the floor clear screen: drop a ball when GS.bl was 1, double-decrement takes it to -1, and `fbl` reads `GS.bl` directly. Fix: `activeBalls` is built as `push(mainBall).concat(mainBall.mb)`, so `activeBalls[0]` is always the main ball. Start the mini-ball loop at index 1 instead of 0 and drop the broken `mb !== GS.ball` guard. Net +8 lines in `index.html` (the explanatory comment + the loop change). No behavior change for actual mini-balls (cluster / trojan); the double-decrement was a single-ball regression that affects every dropped ball in non-multiball mode.
- **Phase 2c post-retrofix #6 (slot machine spin timing)** — The jackpot spin in `spinJackpot` originally took ~2.5s (reel 0: 8 × 60ms, reel 1: 12 × 60ms, reel 2: 16 × 60ms, plus a 200ms inter-reel gap and 100ms per-reel cleanup) - too slow per playtest. First pass dropped it to ~1.2s (40/6/+2/+4/80/50) - too fast, felt like it skipped the anticipation. Settled on ~1.7s (50/6/+3/+5/120/60) as the middle ground. Also removed a `// Slow down this reel's final spins` block that reassigned `timePerReel` inside the setInterval callback: setInterval locks the interval at creation time, so the reassignment was a no-op and the near-miss drama it was meant to add never fired. Throttled the reel-tick audio to every other cycle (was every cycle) - at 50ms/cycle the 30ms tone would be a 60% duty cycle buzz, every-other gives distinct ~10Hz clicks which sound much more like a slot machine. Synced the `.jr.sp` CSS `spin` animation to 0.06s so the visual rotation matches the new cycle (was 0.08s, slower than even the original 60ms cycle). Net +7 lines in `index.html` (mostly the explanatory comment on the spin timing).
- **Phase 2c post-retrofix #5 (board glow border was missing during play)** — All colored borders in the game live on the `.ov` overlays (`#menu`, `#slot-selector`, etc.), not on the `#game-container` itself. After confirming the slot arrangement, `showScreen('none')` hides the slot-selector (and its orange border), and the canvas is shown with nothing around it - the cyan border the player saw on the menu was an overlay border, not a game-area border. Fix: added a `box-shadow`-based 2px border + 30px outer glow to `#game-container` via a new `.board-active` class (no layout impact - a real border would shrink the inner 480x700 area to 476x696 and break the canvas and overlay sizing). The class is toggled in `showScreen()`: added when no overlay is shown (the canvas-visible case), removed when any overlay is up (avoids a doubled border ring with the overlay's own colored border). Theme support: cyan for default, green for `theme-matrix`, white for `contrast-mode`. Net +23 lines in `index.html` (3 CSS rules + a comment + the showScreen toggle block).
- **Phase 2c post-retrofix #4 (shield bounce was useless)** — The SH slot (shield) saved a ball from overflow exit, but the bounce was so weak that the ball barely clipped into the peg field and immediately fell back. Worse, even if the bounced ball re-entered a slot, `slotChecked` was still true from the original entry, so the second slot was a silent no-op. Net result: the SH slot was effectively a one-ball save with no further gameplay. Three coordinated changes: (1) the shield exit block in `Ball.update` now applies a fixed `vy = -7` (vs the old `vy *= -0.5` of the downward velocity, which gave a peak at y≈481 for a typical exit), plus a random vx nudge of `(Math.random() - 0.5) * 6` so the bounce trajectory is unlikely to land in the same x-slot; (2) `slotChecked` is cleared on the bounce so a new slot entry actually fires; (3) a same-slot guard in the slot-check block uses a new `this.shieldedSlot` field (set on first slot entry, persists across the bounce) to suppress a duplicate trigger if the random bounce does land the ball back in the same slot - this prevents the JP-double-trigger case while still allowing the common case of landing in a different slot. Locked-slot entries stay as silent no-ops (they don't set `shieldedSlot` since `checkSlot` returns early for them). Net +29 lines in `index.html` (mostly the explanatory comments + the same-slot guard). Behavior: SH slot now actually gives the ball a meaningful second chance to hit a different slot effect, matching the cost of setting up the slot in the first place.
- **Phase 2c post-retrofix #3 (cluster / trojan minis had no exit cost)** — Built on retrofix #2. Two related bugs in the mini-ball exit path made cluster (3 minis) and trojan (2 minis) feel free. (1) The early `GS.ball.mb = GS.ball.mb.filter(mb => mb.on)` in `updateBalls` removed inactive minis BEFORE the third loop iterated `GS.ball.mb` for `!mb.on`, so the third loop was dead code: zero ball-count charge, zero overflow trigger when a mini exited in non-multiball mode. The cluster/trojan payload had no real downside. (2) When the main ball exited before its minis, the minis became unreachable: `activeBalls` is built from `GS.ball.mb`, and with `GS.ball = null` the next frame's snapshot is empty, so the minis were never exit-checked, never charged, and never triggered overflow. The pre-existing `GS.ball = GS.activeBalls.length > 1 ? GS.activeBalls[1] : null;` was a half-fix: it referenced the previous frame's `GS.activeBalls` (the new value is rebuilt below, not above) and never re-parented the other minis, so even when promotion fired only one of N minis stayed reachable. Fix: removed the early filter; removed the redundant second loop from retrofix #2 (would have been a double-count hazard once the third loop is live); rewrote the main-ball exit block to find the first still-active mini in the current snapshot, promote it to the new main ball, and re-parent the remaining still-active minis under its `mb`; the third loop now iterates the snapshot (safe when `GS.ball` is null) and is the single source of truth for mini-ball exit cost. Net +44 lines in `index.html` (mostly the explanatory comments + the promotion / re-parenting block). Behavior: non-multiball cluster now costs 1 (main) + 3 (minis) = 4 balls; non-multiball trojan costs 1 + 2 = 3; multiball mode is unchanged (no penalty, just array cleanup).
- **Open Known Gaps**: none. The previous `MULTIBALL_THRESHOLD` entry is now closed - the constant is reserved for the future meta-progression unlock system (see Known Gaps section).
- **Recent fixes (this session)**: cluster payload wiring, slowmo physics scale, slowmo+ghost global-flag cleanup on last-flagged-ball exit, peg + slot tooltips.
- **Phase 2b post-retrofix #2 (slowmo + ghost global flags not clearing on ball exit)** — After fixing the cluster/slowmo wiring, in-browser testing showed the blue octagonal slow-mo tint persists on the board after the ball exits. Root cause: `dropBall` sets `GS.slowmoEffect = true` and `GS.ghostEffect = true`, and the only place those flags were ever reset was `startGame` — so the octagonal overlay (rendered at the `if (GS.slowmoEffect) { ... }` block in `render()`) stayed on the board until the next run. `ghostEffect` had the same shape but was effectively dead-flag (the per-ball `b.ghostMode` controls the chromatic-aberration render, not the global), so it was fixed for consistency. Fix: at the end of `updateBalls`, after `GS.activeBalls` is rebuilt, sweep the active ball list and recompute the globals — `GS.slowmoEffect = activeBalls.some(b => b.slowmoMode)` and same for ghost. So the tint flips off the frame the last flag-carrying ball leaves the play field, and stays on while any other slowmo/ghost ball is still on the board. Net +16 lines. Smoke checks: 1 slowmo ball drops → exits → `GS.slowmoEffect` clears; 2 slowmo balls drop → first exits, flag stays true → second exits, flag clears; slowmo physics still halves `dt60` (ratio 0.501); cluster still spawns 3 mini-balls.
- **Phase 2b post-retrofix (cluster + slowmo payload wiring)** — Closed the two Known Gaps surfaced in the Phase 2b retrospective. (1) `cluster` (item 43) is now wired in `dropBall`: added `if (pl.indexOf('cluster') !== -1) { newBall.cl = true; }` immediately after the trojan block, so the existing `Ball.update` split logic (`if (this.cl && this.mb.length === 0 && this.tr.length < 5)`) now actually fires and spawns 3 mini-balls (radius 60% of parent) with random velocities. (2) `slowmo` (item 45) now actually slows the ball: at the top of `Ball.update`, after `var dt60 = dt * 60;`, added `if (this.slowmoMode) dt60 *= 0.5;` so gravity, friction, and velocity application all run at half the time step. The blue octagonal tint overlay (gated on `GS.slowmoEffect`) and the dt60 scale are independent — the visual still draws even though `GS.slowmoEffect` is unrelated to physics. Smoke checks confirm: slowmo ball accumulates exactly 0.5× the per-frame vy of a normal ball (0.0898 vs 0.1791 at dt=1/60), and a cluster ball spawns 3 mini-balls (radius 4.2 = 7×0.6) on the first update with `cl` cleared. All 9 payload flag wirings verified. Net +15 lines in `index.html` (8 lines for the cluster block in `dropBall`, 7 lines for the slowmo dt60 scale in `Ball.update`, including surrounding blank lines).
- **Phase 2b retrospective (bugs found in slowmo + cluster)** — In-browser testing after Phase 2b PR5+PR6 surfaced two latent bugs in payloads that were assumed working before this session. (1) `cluster` (item 43) is not wired in `dropBall` — the Ball constructor initializes `this.cl = false` and `Ball.update` has the split logic at line 1604, but nothing ever sets `cl = true`, so the 3 mini-balls never spawn. (2) `slowmo` (item 45) draws the blue octagonal overlay but never actually slows the ball — `Ball.update` has no check for `this.slowmoMode` to reduce the effective `dt60` time step, so the ball physics run at full speed. The visual-only effect of slowmo and the no-op split of cluster both confirmed via dropBall smoke test (cluster `cl` flag never flips, slowmo render fires but `this.slowmoMode` has no physics effect). Both items moved to Known Gaps with concrete fix instructions for a follow-up session.
- **Phase 2b PR5+PR6 (worm + trojan payloads)** — Completed all 9 payloads. `worm` sets `newBall.worm = true` at drop; in `checkCols`, the physics block (position correction + velocity reflection, including the Mirror and Ice special cases) is wrapped in `if (!b.worm)`, so the ball passes straight through pegs while still registering hits (combo increments, `obj.prg++`, `p.hit()` runs) — letting the ball rack up combos without bouncing. `trojan` sets `newBall.trojanActive = true` at drop; on the ball's first peg hit, `Peg.hit()` spawns 2 mini-balls (mirror of `cluster`'s 3-ball pattern, 2 instead) with random velocities and 0.6× parent radius into `b.mb`, plays `Audio.playBonus()`, and spawns a `'TROJAN!'` float text. Both one-shot. Net +33 lines. 42/42 smoke tests pass. **All 9 payloads now wired end-to-end.**
- **Phase 2b PR4 (scrambler payload)** — Implemented `scrambler` payload: sets `newBall.scrambled = false` at drop time. On the ball's first peg hit, `Peg.hit()` reverses the ball's velocity (`b.vx = -b.vx; b.vy = -b.vy`), flips `b.scrambled = true` (one-shot), plays `Audio.playTeleport()`, and spawns a `'SCRAM!'` float text in orange. Works for both positive and negative velocities. Net +8 lines. 32/32 smoke tests pass. 2 payloads still TODO (`trojan`, `worm`).
- **Phase 2b PR3 (explosive payload)** — Implemented `explosive` payload: sets `newBall.explosive = true` at drop time. On the ball's first peg hit, `Peg.hit()` chain-destroys all non-Explosive pegs within 80px of the ball's position (one-shot per ball), spawns `createFrag` debris per destroyed peg, increments `obj.prg`, triggers screen shake 4 + white flash + `Audio.playExplosion()` + a `'BOOM'` float text. Implementation is inline in `Peg.hit` (not via `triggerExplosion()`) because the latter only spawns fragments without actually removing pegs — too weak for an 85cr payload. Net +14 lines (across both PR2 and PR3). 28/28 smoke tests pass. 3 payloads still TODO (`scrambler`, `trojan`, `worm`).
- **Phase 2b PR2 (logicbomb payload)** — Implemented `logicbomb` payload: sets `newBall.lbActive = true` at drop time. On the ball's first peg hit, `Peg.hit()` triples the current score (`GS.sc *= 3`), clears the one-shot flag, plays `Audio.playBonus()`, and spawns a yellow `'x3'` float text. Required changing `Peg.hit()` to accept the ball as a parameter and updating the single call site in `checkCols` to pass `p.hit(b)`. Stacks correctly with combo multipliers, frenzy, and the `double_pegs` daily mod (which halves the per-peg bonus but not the x3). Net +11 lines. 31/31 smoke tests pass. 4 payloads still TODO (`scrambler`, `trojan`, `worm`, `explosive`).
- **Phase 2b PR1 (daemon payload)** — Implemented `daemon` payload: sets `newBall.sh = true` at drop time and plays the existing `Audio.playShield()` cue. The shield ring render and the `Ball.update` shield consumption logic already key on the `sh` field, so no new rendering or update-path code was needed. Net +6 lines. 28/28 smoke tests pass. 5 payloads still TODO (`scrambler`, `trojan`, `worm`, `logicbomb`, `explosive`).
- **Phase 2a (daily challenge)** — Wired DAILY button to a real daily run (removed the alert stub + duplicate handler). All 6 daily modifiers now implemented via a centralized `modActive(id)` helper queried at the relevant code path: `fewer_pegs` in `genBoard` (-30% rows), `small_ball` in `dropBall` (radius 4.2), `fast_timer` in `checkDormantActivation` (radius 40→25), `multiplier` in `checkCols` (combo cap 7→4), `double_pegs` in `Peg.hit` (bonus halved), and `gravity` is now applied via `modActive` instead of a one-shot fn side-effect (which was being wiped by `startGame()`). Run-end overlay shows mod display and marks `PERSIST.daily.completed = true` so re-clicking DAILY the same day shows the "already completed" alert. Net +40 lines. 37/37 smoke tests pass.
- **Phase 1 (cosmetic consistency)** — Added 6th skin button (White) and 3rd theme button (NEON+ alias for default). Rewrote `updatePegTypeLegend` to iterate `C.PT` directly so the legend can never drift from the runtime enum again. Fixed Honeycomb legend label. Net +3 lines. 22/22 smoke tests pass.
- **Phase 0 (cleanup)** — Removed dead code: peg G enum entry, `GS.lockedSlots`, `PERSIST.stormyModifier` + `addExtraPegs()`, `PERSIST.unlockedBallSkins`/`unlockedBoardThemes` + dead `if`-wrappers in settings button handlers. Fixed slot-selector copy (click→drag). 53 lines removed. 26/26 smoke tests pass.

## 1. Project Vision

Slot Protocol is a single-file HTML5 canvas game combining pachinko/Plinko ball physics with Peggle-style peg clearing and roguelike meta-progression. Players drop balls from a positioned drop zone, bouncing through procedurally-generated peg boards to hit targets, trigger slot-machine rewards between floors, and progress through increasingly difficult floors. The aesthetic is cyberpunk hacker — neon cyan, magenta, and yellow on black.

## 2. Target Users

**End users:** Casual to mid-core gamers who enjoy physics-based arcade games (Peggle, Pachinko) with roguelike meta-progression hooks. Target audience values:
- Short session play (3–10 min per run)
- High score chasing with local leaderboards
- Daily challenge replayability
- Meta-progression unlocks over time

---

## 3. Core Features

### Physics & Gameplay
1. Ball physics with gravity (0.18 px/frame²), friction (0.995), velocity capping (MAX_VEL=14, hard clip=21), and delta-time normalization for frame-rate independence
2. 11 implemented peg types: `node`, `cache`, `teleport`, `seismic`, `explosive`, `dormant`, `ice`, `fiber`, `mirror`, `honeycomb`, `overload` — each with unique visuals and bounce/scoring behavior
3. Two-phase collision detection: per-ball iteration + circle-circle narrow phase
4. Ball drop zone (y=0..50) with mouse-tracking aim position, pulsing crosshair, and dotted trajectory arc preview
5. Stuck ball recovery: if ball moves < 2px for 180 frames, apply random kick velocity
6. Slot collector zone at y=560 (height=50): 7 slots across 480px width (~68.5px each), ball triggers slot effect on entry into an unlocked slot
7. Multiball mode (opt-in): up to 3 concurrent balls; main ball spawns mini-balls (cluster payload) that update independently and consume lives on exit

### Peg Evolution System (5-state machine)
8. Dormant → Normal → Glowing → Charged → Explosive
9. Dormant pegs (grey #444466) activate when a ball comes within range — visual state transition activates on first hit and cycles through subsequent states
10. Evolution chain: normal hit transitions N→Glowing (cyan-white), next hit Glowing→Charged (yellow), next hit Explosive (pink) and releases stored bonus; visual glow scales with state
11. EXPLOSIVE state (×3 self + ×1.5 adjacent on hit; explosive pegs always detonate on contact regardless of state)

### Scoring & Multiplier
12. Base peg hit: 50 pts × (multiplier + 1) × (frenzyActive ? 3 : 1) — see `Peg.prototype.hit` for per-type overrides
13. Cache peg: 200 + (cc × 50) pts; toggles floor objective progress on destruction
14. Seismic peg: +100 flat bonus + shockwave + white flash + screen shake
15. Explosive peg: multiplies current score by 3, then triggers `triggerPegExplosion`
16. Honeycomb peg: 5-hit cycle, final hit = +500 + cc×150 + 6-fragment gold burst + 80px-radius peg attraction/destruction (non-seismic/explosive)
17. Overload peg: +75 pts, drains 10% of current jackpot (floor 500 minimum), screen shake, erratic bounce
18. Chain multiplier: increments per consecutive peg hit (cap ×7, resets on ball exit)
19. Frenzy mode: ×3 on ALL scoring for 180 frames when comboCount ≥ 5 hits without ball exit
20. Chain timer: 30-frame window per hit, extended by 180 frames with AMPLIFY slot bonus

### Roguelike Structure
21. Game states: `MENU → TUTORIAL → PLAYING → SLOT_SELECTOR → FLOOR_COMPLETE → SHOP → PLAYING → ... → RUN_END → MENU` (plus `DLY` overlay for daily challenge)
22. Floor objective system: floor target pegs = `[15,20,25,30][min(fl/3, 3)] + fl` — i.e. 16–18 on fl 1–3, 21–26 on fl 4–6, 26–34 on fl 7–9, 31+ on fl 10+
23. Overflow penalty: -3×floor score deduction, 15% jackpot drain, multiplier reset, 1s overload flag, screen shake
24. 5 lives per run, shown as ball indicators in HUD
25. Between-floors NetShop for purchasing payloads with breach credits (`floorScore / 10` per floor clear + lifetime breach credits)

### Slot Arrangement System (Player Agency Feature)
26. Before each floor, player arranges slots by drag-and-drop from a pool of 7 random slot effects
27. Player chooses which slot position to unlock each floor (max 7 total, 1 unlock per floor)
28. NO slots are pre-unlocked — player must choose which slot to unlock each floor; positions start locked
29. Locked positions are rendered with a `+` glyph, yellow dashed border, and a drop-target highlight on dragover
30. Dragging from the pool onto a locked position: unlocks that position (1-per-floor budget) AND assigns the slot
31. Dragging from the pool onto an unlocked position: swaps/assigns the slot, returns the prior occupant to the pool
32. Dragging from one unlocked position to another unlocked position: swaps the two slot types
33. Only unlocked slots appear on the game board and are active (locked slots are invisible on the play field)
34. Unlocked slots on the board are styled with colors matching their type (CR=green, AM=magenta, OC=yellow, SH=cyan, CM=orange, PA=purple, JP=magenta, E=grey)
35. Player can auto-arrange or manually choose slots for each position
36. Pool generates fresh 7 random slots each floor with weighted probabilities (JP 3%, OC 7%, SH 8%, CM 10%, AM 10%, PA 12%, CR 15%, EMPTY 35%)

### Payloads (9 types)
37. `scrambler` (50cr) — sets `newBall.scrambled = false` at drop; on the ball's first peg hit, `Peg.hit()` reverses the ball's velocity (`b.vx = -b.vx; b.vy = -b.vy`) so it bounces back the way it came, plays `Audio.playTeleport()`, and spawns a `'SCRAM!'` float text in orange
38. `trojan` (75cr) — sets `newBall.trojanActive = true` at drop; on the ball's first peg hit, `Peg.hit()` spawns 2 mini-balls (mirror of `cluster`'s pattern, 2 instead of 3) with random velocities and 0.6× parent radius into `b.mb`, plays `Audio.playBonus()`, and spawns a `'TROJAN!'` float text in red. One-shot per ball
39. `worm` (60cr) — sets `newBall.worm = true` at drop; in `checkCols`, the physics block (position correction + velocity reflection, including the Mirror and Ice special cases) is wrapped in `if (!b.worm)`, so the ball passes straight through pegs while still registering hits (combo, `obj.prg++`, `p.hit()`)
40. `logicbomb` (100cr, stored as one word) — sets `newBall.lbActive = true` at drop; on the ball's first peg hit, `Peg.hit()` does `GS.sc *= 3` (one-shot), plays `Audio.playBonus()`, and spawns a yellow `'x3'` float text
41. `daemon` (80cr) — sets `newBall.sh = true` at drop; the ball is shielded from overflow exit for its lifetime, plays `Audio.playShield()` on drop, and renders the existing animated green shield ring
42. `ghost` (70cr) — ball enters `ghostMode` for its lifetime, phases through pegs (no collision), enables chromatic-aberration render
43. `cluster` (90cr) — sets `newBall.cl = true` at drop (wired in `dropBall` after the trojan block). On the next `Ball.update` where `this.tr.length < 5` and `this.mb.length === 0`, the ball splits into 3 mini-balls (radius 60% of parent, random velocities) that update independently via the existing mini-ball update loop. `cl` is cleared after the split so the parent ball doesn't re-split. The mini-ball render code and the `updateBalls` mini-ball exit / life-cost flow were already in place from the cluster design — only the `dropBall` flag-set was missing, which is now fixed.
44. `explosive` (85cr) — sets `newBall.explosive = true` at drop; on the ball's first peg hit, `Peg.hit()` chain-destroys all non-Explosive pegs within 80px of the ball's position (one-shot), with screen shake 4, white flash, `Audio.playExplosion()`, and a `'BOOM'` float text
45. `slowmo` (55cr) — sets `newBall.slowmoMode = true` and `GS.slowmoEffect = true` at drop. `Ball.update` halves `dt60` (`if (this.slowmoMode) dt60 *= 0.5;`) right after computing it, so gravity, friction, and velocity application all run at half the effective time step for the ball's lifetime. The render code draws the blue octagonal tint while `GS.slowmoEffect` is true. The two are independent: the visual cue is gated on a global flag, the physics scale is gated on the per-ball `slowmoMode` flag.
46. Payload inventory: max 2 per type, consumed on next ball drop, queued via `GS.pl[]`. PAYLOAD slot effect also adds a random payload if room is available
47. **Note:** All 9 payloads now have end-to-end implementation: `daemon`, `logicbomb`, `explosive`, `scrambler`, `worm`, `trojan`, `ghost`, `cluster`, `slowmo`. Phase 2b is complete.

### Slot Collector Effects (8 types including Jackpot)
| Index | Enum | Name | Effect |
|-------|------|------|--------|
| 0 | E | EMPTY | No effect |
| 1 | CR | CREDITS | +50 × (cc+1) × (frenzy ? 3 : 1) score |
| 2 | AM | AMPLIFY | +1 combo (capped at MAXM=7), chain timer to 210 |
| 3 | PA | PAYLOAD | Adds random payload from the 9-type list (if `GS.pl.length < 2`) |
| 4 | CM | CRUMBLE | Destroys up to 3 random non-seismic/explosive pegs (contributes to objective progress) |
| 5 | SH | SHIELD | Sets `GS.shielded = true`; next ball is bounced back from `y > H+50` instead of dying |
| 6 | OC | OVERCLOCK | Sets `GS.gravityMult = 1.5`; lasts until ball exits |
| 7 | JP | JACKPOT | Adds current jackpot to score, increments `jackpotWins`/`jackpotWon`, regrows jackpot to `floor(500*fl*1.15)`, screen shake, achievement check |

48. Jackpot system: base = 500×floor, grows +15% per failed spin, 3-reel match wins, resets to base on win. Two jackpot spins granted per floor on floor clear.

### Meta-Progression
49. PERSIST object in localStorage: `lb` (lifetime breach), `lf` (last floor), `ls` (last score), `br` (lifetime breach credits), `ur` (unlocks — legacy), `pu` (payload unlocks — legacy), `ach[]`, `leaderboard[]`, `daily{}`, `streak`, `lastDay`, `tr` (total runs), `totalPegsHit`, `ballSaverCount`, `multiballEnabled`, `currentBallSkin`, `currentBoardTheme`, `audioMuted`, `bgmMuted`
50. 17 achievements tracked and toast-popped on earn
51. Daily challenge: `getDailySeed()` produces a per-date seed from `YYYY-M-D`; `getDailyModifiers()` returns 2 of 6 candidates (heavy gravity, sparse field, tiny ball, ticking clock, lower max combo, half-value pegs). All 6 modifiers are implemented via the centralized `modActive(id)` helper queried at the relevant code path; DAILY button shows a modal with the picked modifiers before launching the run; run-end overlay displays the mod list and marks `PERSIST.daily.completed = true` so a second DAILY click the same day shows the "already completed" alert

### Settings & Customization
52. Contrast mode toggle (replaces all peg colors with PC_CONTRAST palette: greys/whites/dim accent)
53. Multiball mode toggle (up to 3 balls concurrent, `MAX_BALLS=3`)
54. Sound FX toggle (independent of music)
55. Music/BGM toggle (independent of SFX)
56. Ball skins: Cyan, Magenta, Yellow, Green, Orange, White — all 6 buttons rendered in settings; freely selectable (no unlock gating)
57. Board themes: Neon (default), Neon+, Matrix (green) — 3 buttons rendered; 3 entries in `PERSIST.boardThemes` (`default`, `neon` alias for default, `matrix`)
58. Reset all data option with confirmation overlay

### UI / Screens
60. `#menu-overlay` — title with stats, buttons: INITIATE BREACH, DAILY, TUTORIAL, ACHIEVEMENTS, LEADERBOARD, SETTINGS. Background particle animation.
61. `#hud` — top bar: floor, score, jackpot, balls remaining + SHOP button
62. Objective progress bar below HUD (`HIT N PEGS` text + fill bar)
63. Multiplier display top-right with chain timer bar beneath
64. Payload indicator chips at the drop point (next-payload color + 4-letter label)
65. `#tutorial-overlay` — how-to-play
66. `#floor-overlay` — floor complete + jackpot slots + spin/continue/end buttons (2 jackpot spins per floor)
67. `#shop-overlay` — NetShop grid for payload purchases
68. `#runend-overlay` — game over with stats and new best indicator
69. `#achievement-toast` — bottom-right popup, auto-dismisses 3s
70. `#settings-overlay` — contrast mode, multiball, SFX, BGM, ball skin, board theme, peg type legend, reset
71. `#resetconfirm-overlay` — reset confirmation with warning
72. `#slot-selector-overlay` — player chooses which slot to unlock + arranges effects via native HTML5 drag-and-drop
73. Leaderboard, Achievements overlay screens

### Effects & Feedback
75. Particle system (collision particles, color-matched) — `parts[]` and `updateFX()`
76. Fragment system (crumbling peg debris) — `frags[]`
77. Shockwave system (seismic peg expanding ring) — `spawnShockwave()`
78. Float text system (rising score/pickup numbers) — `createFloat()`/`spawnFloatText()`
79. Screen shake (`triggerScreenShake(intensity)`) + white flash on major events
80. Ball trail system (last 10 positions)
81. Ghost ball chromatic aberration effect during ghost payload
82. Slow-mo octagonal blue tint overlay during slowmo payload
83. Mini ball rendering for cluster payload (radius 60% of parent)
84. **In-game tooltips**: `C.PEG_TOOLTIPS` (11 entries) and `C.SLOT_TOOLTIPS` (8 entries) provide a name and one-line description for every peg and slot type. A single absolutely-positioned `<div id="tooltip">` is shown on hover in two contexts, both anchored to the mouse (clientX/Y) the same way: (1) in-game pegs and the bottom slot-collector zone (gated on `GS.scr === C.SCR.P`) — `canvas.mousemove` does peg hit-test then slot hit-test; (2) slot-selector — single delegated `mousemove` listener on `#slot-selector` uses `e.target.closest('.slot-pos, .slot-pool-item')` to find the hovered element. Three position-slot states with distinct text: occupied (shows the assigned slot's tooltip), unlocked-empty (yellow "Drop a slot here to fill this position"), locked (magenta "Drag a slot here to UNLOCK this position" or grey "Locked this floor — rearrange only" when the floor's unlock budget is spent). Helper: `showTooltip(header, desc, color, clientX, clientY)` with viewport edge-clamping that flips the tooltip to the opposite side of the cursor when needed. Header color matches the type's color (`C.PC[t]` for pegs, `getSlotColor(st)` for slots). Native `title` attribute retained for keyboard accessibility.
85. Per-peg type render treatments: ice (crystal rays), fiber (striated gradient), mirror (radial gradient + arrow), honeycomb (hexagon + inner pattern), overload (pulsing + lightning bolt)
86. Menu background particles (CSS-driven, paused on overlay close)

### Audio
87. **Phase 4 audio engine** — Web Audio API procedural SFX (no external assets). Sounds: peg hit (pitch by combo), bonus chime, slot collect (varies by slot type), jackpot fanfare, overload buzz, button click, drop whoosh, achievement melody, shield activation, explosion noise, critical combo warning, floor complete sting, game over descending tones, drag pickup pop, drag drop thunk, teleport sound, reel tick
88. BGM (Phase 4 Music Port) — HTML5 `<audio>` element tracks: `title-screen.mp3`, `gameplay-bgm.mp3`, `slot-machine.mp3`, `ending-screen.mp3` (all looping) + `connection-lost.mp3` (one-shot sting for run end). SFX and BGM mutes are independent. BGM arms on first user gesture; track is selected via `bgmForScreen(id)` mapper

---

## 4. Technical Implementation

### Architecture
```
index.html (single file, ~4637 lines)
├── <style> (lines 7–306)  — overlay/HUD/theme CSS
├── <body> (308–570)       — HTML overlays + canvas + audio elements
└── <script> (572–4635)
    ├── var C (CONSTANTS)  — physics, colors, peg/slot enums
    ├── var GS (GameState) — runtime state, reset per run
    ├── var PERSIST        — localStorage persistence
    ├── var ACHIEVEMENTS   — 17 entries with inline check functions
    ├── var Audio          — Web Audio SFX + HTML5 BGM (Phase 4)
    ├── function Ball(x,y,vx,vy,payloads)        — class
    ├── function Peg(x,y,type,id)                — class
    ├── function genBoard()                      — board gen
    ├── function setupObj()                      — floor objective
    ├── function checkCols(b)                    — collision
    ├── function updateBalls(dt)                 — physics + lifecycle
    ├── function checkBallExit(b) / checkSlot()  — exit/slot handling
    ├── function triggerSlotCollected() / triggerOverflow()
    ├── function genSlots() / initSlotArrangement() / renderSlotSelector()
    ├── function handleSlotDrop() / handlePoolDrop() / unlockSlotPosition()
    ├── function autoArrangeSlots() / confirmSlotArrangement() / ensureSlotsArranged()
    ├── function spinJackpot() / fastSpinAllReels() / updateJackpotUI()
    ├── function spawnParticles/Fragments/Shockwave/FloatText/Ripple/Crystal/Pulse/CollisionFlash/EvolutionPulse()
    ├── function triggerScreenShake() / triggerWhiteFlash() / triggerPegExplosion() / triggerSeismic() / triggerExplosion()
    ├── function getDailySeed() / seededRandom() / getDailyModifiers() / startDailyChallenge()  — daily
    ├── function checkAchievements() / unlockAchievement() / showToast() / updateAchievementsUI()
    ├── function contrastToggle() / applyContrastMode() / multiballToggle() / soundToggle() / musicToggle()
    ├── function addToLeaderboard() / isNewHighScore() / updateLeaderboardUI() / submitHighScore()
    ├── function showScreen() / showHUD() / updateHUD() / updateRunEnd() / updateShop() / updatePegTypeLegend()
    ├── function render()        — ~650 lines of canvas drawing
    ├── function loop(ts)        — requestAnimationFrame main loop
    ├── function startGame()     — full reset + first floor init
    ├── function dropBall()       — launches Ball, applies payload flags
    ├── function initSettings() / updateBallSkinDisplay() / updateThemeDisplay() / applyBoardTheme()
    ├── function loadPersist() / savePersist()
    └── function audioInitOnce() / firstMoveStartTitleBgm()  — first-gesture audio
```

### Key Constants (`C`)
- Canvas: 480×700px
- Physics: Gravity 0.18, Friction 0.995, Max Velocity 14, Hard Clip 21
- Geometry: Ball Radius 7, Peg Radius 8, Drop Zone y=0..50 (DZY=50), Board y=110..480 (TOP=110, BOT=480), Slots y=560..610 (SY=560, SH=50), Peg Spacing 50
- Slots: 7 positions (SC=7), each ~68.5px wide (SW=480/7)
- Chain: Chain Timer 30 frames, Frenzy Duration 180 frames, Max Multiplier 7
- Stuck: 180 frames at <2px movement
- Multiball: MAX_BALLS=3 (hard cap in `dropBall`: parent + active mini-balls). `MULTIBALL_THRESHOLD=7` constant is reserved for the future meta-progression unlock (not enforced; toggle is opt-in via settings)
- Visual: RIPPLE_LIFETIME 25, PORTAL_LIFETIME 60, FLASH_LIFETIME 15

### `GS` Slot State Variables
| Variable | Type | Description |
|----------|------|-------------|
| `unlockedSlots` | Array | Indices of unlocked positions [0-6], starts empty each run |
| `canUnlockThisFloor` | Boolean | True if player can unlock 1 more slot this floor (`unlockedSlots.length < 7`) |
| `slotsArranged` | Boolean | True if player has confirmed slot arrangement |
| `slotArrangement` | Array | Slot type per position [index] = ST enum |
| `slotPool` | Array | Available slot effects to assign (7 fresh random per floor) |

### Peg Types (`C.PT`) — 11 entries, all with implemented behavior
| Idx | Enum | Name | Color | Effect |
|-----|------|------|-------|--------|
| 0 | N | Node | Cyan (#00fff2) | Standard bounce, 50 × (cc+1) pts (default for all unspecified pegs) |
| 1 | C | Cache | Yellow (#ffff00) | +200 + cc×50 pts; contributes to objective on crumble/explosion |
| 2 | T | Teleport | Purple (#9944ff) | Swaps position with first unpaired teleport peg, plays portal FX, +bonus pts |
| 3 | S | Seismic | Orange (#ff6600) | +100 flat, shockwave, white flash, screen shake 3 |
| 4 | E | Explosive | Red (#ff2244) | Score ×3, triggers `triggerPegExplosion` (chain damage) |
| 5 | D | Dormant | Grey (#444466) | First hit activates (D→N) and emits evolution pulse; then cycles 5-state |
| 6 | I | Ice | Light Blue (#88ddff) | First hit freezes (low bounce); second hit = +150 + cc×75 + ice crystal FX |
| 7 | F | Fiber | Orange-Red (#ff8844) | Hits scale 75/150/225; 3rd hit breaks for +300 + cc×100 + shatter debris, removed from board |
| 8 | M | Mirror | White (#ffffff) | Deflects ball horizontally with stored `mirrorDir` (±1 random), +100 + cc×25 |
| 9 | H | Honeycomb | Gold (#ffcc00) | 5-hit cycle, 5th hit = +500 + cc×150 + 6-frag burst + 80px radius peg attract/destroy |
| 10 | O | Overload | Pink (#ff4488) | +75 pts, drains 10% jackpot (floor 500), screen shake 2, erratic bounce |

### Slot Types (`C.ST`)
| Idx | Enum | Name | Icon | Effect |
|-----|------|------|------|--------|
| 0 | E | Empty | - | No effect |
| 1 | CR | Credits | $ | +50 × (cc+1) × (frenzy ? 3 : 1) score |
| 2 | AM | Amplify | + | cc +1 (capped), chain timer to 210 frames |
| 3 | PA | Payload | ? | Adds random payload (if `GS.pl.length < 2`) |
| 4 | CM | Crumble | # | Destroys up to 3 random non-seismic/explosive pegs |
| 5 | SH | Shield | ^ | `GS.shielded = true` for next ball |
| 6 | OC | Overclock | * | `GS.gravityMult = 1.5` for current ball |
| 7 | JP | Jackpot | ★ | Score += jackpot; reset jackpot to `floor(500*fl*1.15)` |

### Board Generation (`genBoard`)
- Rows: `7 + floor(fl/3)` (7–10+)
- Columns: `floor((480-60)/50)` (8), offset by half-spacing on odd rows
- Type probabilities (per peg, before row 0 / special handling):
  - Explosive: `0.01 + fl*0.003`
  - Seismic: `0.015 + fl*0.008`
  - Cache: `0.02 + fl*0.008`
  - Teleport (row > 0): `0.04 + fl*0.015`
  - Dormant: `0.04`
  - Ice (fl ≥ 3): `0.02 + fl*0.005`
  - Fiber (fl ≥ 5): `0.015 + fl*0.004`
  - Mirror (fl ≥ 7): `0.01 + fl*0.003`
  - Honeycomb (fl ≥ 9): `0.008 + fl*0.002`
  - Overload (fl ≥ 11): `0.005 + fl*0.001`
- Teleport pegs are paired in spawn order
- Stormy modifier (legacy): adds 1–3 extra peg rows (overlap-checked at 80% spacing)

### Collision (in `checkCols`)
- Per-ball: iterates all pegs, skipping pegs in `ball.hp` (per-ball hit tracking) and dormant-inactive pegs
- Resolution: position correction along normal, then reflection: `v -= 2*dot*n*bounceCoeff`
- Mirror peg: replaces standard reflection with horizontal-deflect formula using `p.mirrorDir`; minimum `|vx| = 3`
- Ice (post-freeze): bounce coefficient drops to 0.3, sets `b.slow = true` for 500ms
- On hit: `Peg.hit()` runs, `GS.obj.prg++`, `GS.pegsHit++`, `PERSIST.totalPegsHit++`, combo chain update, frenzy check at cc≥5, max-combo celebration at cc≥7

### Run Lifecycle
- `startGame()` — resets per-run GS state, increments `PERSIST.tr`, calls `genBoard()` → `setupObj()` → `initSlotArrangement()` (which shows the slot-selector)
- `contb` (CONTINUE on floor complete) — increments floor, resets 5 balls, regenerates board, opens slot selector
- `endb` (END RUN) — switches BGM to `connection-lost`, shows run-end overlay
- `retb` (RETURN TO MENU) — credits `floor(GS.sc/10)` to `PERSIST.br`, updates `lf`/`ls`, runs achievement check, prompts leaderboard name if new high score, saves
- Game over (from `updateBalls`): when all balls gone + `bl <= 0` + `obj.prg < obj.tgt` → plays game-over sound, switches BGM, shows run-end

### Audio Architecture (Phase 4)
- `Audio` is a plain object (not a class). Initializes on first user gesture (`audioInitOnce` / `firstMoveStartTitleBgm`).
- SFX: Web Audio API oscillators + noise bursts, gain envelope, optional sub-tone. Throttled peg hits via `lastPegSound`/`lastCriticalSound` timestamps.
- BGM: HTML5 `<audio>` elements wired in `initBgm()`. `playBgm(id)` switches tracks (no-op if same), pauses other tracks. `bgmForScreen(id)` returns a track id, `'continue'`, or `null` to map current screen → appropriate track.
- SFX and BGM mutes are independent; both persisted in `PERSIST.audioMuted`/`PERSIST.bgmMuted`.

---

## 5. Acceptance Criteria

### Core Gameplay
- [x] Click INITIATE BREACH → game starts, HUD visible, board has 40+ pegs
- [x] Ball drops and falls with gravity arc
- [x] Ball hits peg → bounce occurs, score increases, multiplier increments
- [x] 5 consecutive peg hits → frenzy mode activates (×3) for 180 frames
- [x] Ball exits via unlocked slot → multiplier resets, slot effect fires
- [x] Ball exits via locked slot position → no effect (slot not active; position not in `unlockedSlots`)
- [x] Objective filled → FLOOR_COMPLETE overlay shown with jackpot spin UI

### Slot Unlock Mechanic
- [x] Floor 1: NO slots unlocked, player must unlock 1 slot to start
- [x] Drag slot from pool to locked position → unlocks AND assigns slot (consumes 1 unlock budget)
- [x] Drag slot to unlocked position → swaps/assigns the slot
- [x] ONLY 1 slot can be unlocked per floor (enforced via `canUnlockThisFloor`)
- [x] Only unlocked slots visible on game board (locked positions are not rendered in `render()`)
- [x] Only unlocked slots trigger slot effects on ball entry (`isSlotUnlocked` gate in `checkSlot`)
- [x] After all 7 unlocked, player can only rearrange existing slots
- [x] Slot selector shows 7 fresh random slots each floor (weighted: JP 3%, OC 7%, SH 8%, CM 10%, AM 10%, PA 12%, CR 15%, EMPTY 35%)

### Progression
- [x] FLOOR_COMPLETE → CONTINUE → SLOT_SELECTOR appears
- [x] Slot arrangement: drag slots to unlock, drag to rearrange, auto-arrange, confirm
- [x] SHOP opens between floors, purchases deduct credits, max 2 payloads queued
- [x] RUN_END shows stats, NEW BEST! indicator if `GS.sc >= PERSIST.ls`
- [x] Leaderboard name prompt on new high score (guarded by `GS.lbHandled` to prevent re-prompt)

### Effects
- [x] Screen shake on seismic/explosive/overload pegs
- [x] White flash on seismic pegs, max-combo hits, and jackpot
- [x] Particles spawn on peg hits (color-matched to peg type)
- [x] Float text appears for score/bonuses (per-peg-type labels)

### Audio
- [x] Peg hit sound varies with combo level
- [x] Slot collect sound varies with slot type
- [x] BGM switches per screen (title / gameplay / slot-spin / ending)
- [x] SFX and BGM mutes are independent and persisted

### Known Gaps / TODO
- [x] **`cluster` payload is not wired in `dropBall`** (RESOLVED). Added `if (pl.indexOf('cluster') !== -1) { newBall.cl = true; }` to `dropBall` immediately after the trojan block. Smoke check confirms: dropping a cluster ball sets `newBall.cl = true`; on the first `Ball.update` (where `tr.length < 5` and `mb.length === 0`), the ball splits into 3 mini-balls (radius 4.2 = 7×0.6) with random velocities and `cl` is cleared so the parent doesn't re-split. Mini-ball render, exit/life-cost flow, and the chromatic-aberration-free purple ball render were all already in place — only the flag-set was missing.
- [x] **`slowmo` payload draws the octagonal overlay but does NOT slow the ball** (RESOLVED). Added `if (this.slowmoMode) dt60 *= 0.5;` at the top of `Ball.update` immediately after `var dt60 = dt * 60;`. Smoke check confirms: a slowmo ball at rest, given one update at dt=1/60, accumulates vy ≈ 0.0898 (vs 0.1791 for a normal ball — exactly 0.5× because gravity's only contribution in one frame is `0.18 * dt60`, no friction term has compounded yet). The visual octagonal overlay (gated on `GS.slowmoEffect`) and the physics scale (gated on `this.slowmoMode`) are independent, as they should be. Note: `this.slow` further down in `Ball.update` is still the ice peg's 500ms transient slow — unchanged.
- [x] **`GS.slowmoEffect` / `GS.ghostEffect` global flags not cleared on last-flagged-ball exit** (RESOLVED). The blue octagonal slow-mo overlay (`if (GS.slowmoEffect) { ... }` in `render()`) was gated on a global flag that `dropBall` set to `true` and only `startGame` ever reset, so it stayed on the board after the slowmo ball exited. `GS.ghostEffect` had the same shape (set on drop, never cleared) but was effectively dead-flag — the chromatic-aberration render keys on the per-ball `b.ghostMode`. Fix: end of `updateBalls`, after `GS.activeBalls` is rebuilt, sweep the active ball list and set `GS.slowmoEffect = activeBalls.some(b => b.slowmoMode)` and `GS.ghostEffect = activeBalls.some(b => b.ghostMode)`. Net +16 lines. Smoke check: 1 slowmo ball drops → exits → flag clears; 2 slowmo balls → first exits, flag stays true → second exits, flag clears.
- [x] **`MULTIBALL_THRESHOLD`** (RESOLVED, reserved for meta-progression). Constant is now annotated in `index.html` as reserved for the future meta-progression unlock system (e.g. "reach combo 7 to permanently unlock multiball as a milestone reward, like the existing ball-skin / board-theme unlock pattern"). Not enforced today. Multiball remains opt-in via the settings toggle, and the only active constraint is the `MAX_BALLS=3` cap in `dropBall` (parent + active mini-balls). When the meta-progression system is built out, wire this constant to a one-time unlock toast + `PERSIST.multiballUnlocked = true` flag, then the settings toggle becomes a clean "already unlocked; turn on/off" affordance.
