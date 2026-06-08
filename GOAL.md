# Slot Protocol — Rogue Pachinko

> Living spec for the game. Updated as features ship. Source of truth: `index.html` (single-file build, ~5850 lines as of Phase 5). All 9 payloads wired end-to-end, 6/6 daily modifiers via `modActive(id)`, 17 achievements, 11 peg types, 8 slot types, Phase 4 audio (Web Audio SFX + 3 active HTML5 BGM tracks: title / gameplay / ending — the `connection-lost.mp3` and `slot-machine.mp3` files are no longer in rotation), in-game tooltips for every peg + slot anchored to the mouse. Phase 4.5 economy-balancing pass complete (PR1 + A through Q): credit double-dip fixed (5% of floor-delta), peg-target rescaled (`12 + fl*1.5`), per-peg floor-scaled scoring, payload costs rebalanced twice (50–120 → 80–220, luxury tier), unique slot-pool with EMPTY excluded, daily-mod hard-tier dedup, chain timer +20%, explosive-peg scoring rewrite, jackpot 2/3 partial match, slot-machine result banner + reel-state cleanup, continuous BGM through runs, "CONNECTION LOST" end screen. All Known Gaps closed. **Phase 5 mobile compatibility shipped** (scale-to-fit + canvas pointer events + slot-selector tap-to-place + tap feedback CSS + orientation lock); see the change-log entry below. `MULTIBALL_THRESHOLD` is reserved for the future meta-progression system (design decision, not a bug) — see Known Gaps section.

## Change Log

- **Phase 2c (peg + slot tooltips)** — Added pretty in-game tooltips for all 11 peg types and 8 slot effects. New `C.PEG_TOOLTIPS` and `C.SLOT_TOOLTIPS` lookup tables in the constants, plus a single absolutely-positioned `<div id="tooltip">` styled with a colored name (per type color) and grey description, edge-clamped to the viewport. In both trigger paths the tooltip is anchored to the mouse (clientX/Y) the same way: (1) in-game — `canvas.mousemove` does peg hit-test (radius check with +3px margin) then slot hit-test (only over unlocked slots in the collector zone `y >= C.SY && y <= C.SY + C.SH`); (2) slot-selector — a single delegated `mousemove` listener on `#slot-selector` uses `e.target.closest('.slot-pos, .slot-pool-item')` to find the hovered element, then shows the same tooltip at `e.clientX/Y`. Three position-slot states with distinct text: occupied (shows the assigned slot's tooltip), unlocked-empty (yellow "Drop a slot here to fill this position"), locked (magenta "Drag a slot here to unlock this position", or grey "Locked this floor — rearrange only" when the floor's unlock budget is spent). `canvas.mouseleave` / `#slot-selector mouseleave` and any state change away from `SCR.P` hide the tooltip. Native `title` attribute kept on the divs for keyboard accessibility. New helpers: `showTooltip(header, desc, color, clientX, clientY)` and `hideTooltip()`. Net +169 lines in `index.html` (initial wireup) plus a -13 / +36 follow-up that replaced per-element `mouseenter`/`mouseleave` handlers in the slot-selector with the single delegated `mousemove` (matches the in-game pattern, anchors to mouse in both paths). Smoke checks: every peg/slot tooltip entry has non-empty name+desc, names match the runtime enums (NODE/CACHE/.../OVERLOAD and EMPTY/CREDITS/.../JACKPOT), `showTooltip` correctly sets display/innerHTML/position, `hideTooltip` resets display, both right-edge and bottom-edge clamping flip the tooltip to the opposite side of the cursor when near the viewport boundary, no per-element `mouseenter→showTooltip` handlers remain in source.

- **Phase 3 (visual overhaul v2 — Blade Runner 2049 direction)** — Replaced the clipart-feel SVG icon set and plain Courier typography with a coherent visual system. Color palette unchanged. Six subsystems, all in `index.html` and `svg-icons.js`. 1. **Typography** — added Google Fonts `@import` for `Orbitron` (titles, HUD labels, button text, jackpot digits) + `Share Tech Mono` (body / stat lines), with `Courier New` fallback. Tabular numerals on score/jackpot/balls/multiplier so digits don't jitter. 2. **Icon system** — rewrote every entry in `svg-icons.js` (11 peg types, 8 slot types, 9 payload types, 13 UI icons) as neon-line-art: 1.5–1.75px stroke, no fills, two-tone outlines in the type color. Added new icons: `UI_PLUS` (unlocked-empty slot affordance), `UI_UNLOCK` (locked slot), `UI_GEAR` / `UI_CALENDAR` / `UI_QUESTION` / `UI_MEDAL` / `UI_TROPHY` / `UI_DOLLAR` / `UI_FLAG` / `UI_RUNS` for the menu buttons + stat rows. Dropped the `ST_ICONS: ['-', '$', '+', '?', '#', '^', '*', '★']` ASCII array (the source of the ^ and * clipart characters in the slot selector) — slot selector now uses `SVG_ICONS.getSlotIcon(type)` everywhere. The locked-position "?" is now a dashed `UI_UNLOCK` glyph, the unlocked-empty "+" is a dashed `UI_PLUS`, and the pool items show the new icon set. 3. **Component polish** — buttons get a thin inset highlight (`box-shadow inset 0 0 0 1px <accent>`) + soft outer glow that intensifies on hover (12% → 24%). Shop cards get a top accent stripe + corner brackets. Achievement cards get a left-edge accent stripe + corner brackets (yellow for unlocked, grey for locked) + an idle shimmer keyframe gated on `prefers-reduced-motion`. The SHOP button is upgraded to Orbitron. 4. **In-game pegs** — added a `drawPegShape(type, x, y, r, color, st)` helper invoked from `render()` for the 6 basic types (N/C/T/S/E/D) that previously rendered as plain flat circles. Every peg now has a visual identity on the board at rest: NODE has a specular dot at 10 o'clock, CACHE has a center cross, TELEPORT has an inner ring + inward chevron, SEISMIC has 4 cardinal ticks, EXPLOSIVE has 4 long axes + 4 short diagonals, DORMANT has a dashed outline + center dot. The 5 special types (I/F/M/H/O) keep their existing elaborate at-rest + hit-treatment. 5. **Ambient FX** — single `body::after` pseudo-element adds a 3px-period scanline overlay (rgba 0,0,0,0.08 — intentionally low contrast) and an inset 200px CRT vignette. Fixed positioning covers the viewport, `pointer-events: none` so it never blocks clicks, z-index 999 above overlays; tooltip z-index bumped to 1000 to stay above. Disabled via `@media (prefers-reduced-motion: reduce)`. 6. **Minor cleanup** — slot-selector intro copy now reads "Drag a slot onto an unlocked position to assign it. Drag onto a locked position to unlock it. 1 unlock per floor." (dropped the misleading "click locked slots to unlock" half). `index.html` +158 / -22 net (one CSS block added at end of style, one `drawPegShape` helper added before the peg loop, one `injectMenuIcons` IIFE added at init). `svg-icons.js` rewritten end-to-end (+142 lines).

- **Phase 4.5 PR1 (economy audit + 5 fixes)** — Audit pass on the run economy (score, credits, peg-target curve, payload costs, slot effects) after Phase 3. Top 5 fixes shipped: (A) credit double-dip fix in `loop()` floor-clear (now pays the *delta* from `GS.lastFloorScore`); (B) peg-target rescale (tier table `[15,20,25,30]+fl` → linear `12 + Math.floor(fl*1.5)`, new targets fl 1/5/10/12 = 13/19/27/30); (C) payload cost rebalance v1 (50-120 spread, cost aligned with power); (D) Crumble objective-count fix (one `GS.obj.prg++` per Crumble, not per destroyed peg); (E) Shield tooltip clarification. The original PR1 plan deferred 5 items (F-J) for follow-up. Full details below.
- **Phase 4.5-F (unique pool + no EMPTY as a choice)** — In `initSlotArrangement`: excluded `C.ST.E` (EMPTY) from the pool roll, added a re-roll loop for unique picks. 100% of pools now contain 3 unique useful types (verified via 100k Monte Carlo). EMPTY still in `C.ST` enum for defensive coverage but unreachable through normal play. New pool weights (useful only): JP 4% / OC 10% / SH 12% / CM 15% / AM 15% / PA 18% / CR 26%.
- **Phase 4.5-G (Explosive peg scoring rewrite)** — Removed `GS.sc *= 3` and redundant bonus*3 from `Peg.hit` PT.E branch and `triggerPegExplosion`. New flat bonuses: self `500 * (cc+1) * (frenzy?3:1)`, adjacent `100 * (cc+1) * (frenzy?3:1)`. Float text changed from `'x3!'` to `'BOOM +<amount>'`. Explosive PAYLOAD (chain-destroy, paid 180cr) unchanged; Logic Bomb PAYLOAD (lifetime x3, paid 220cr) unchanged.
- **Phase 4.5-H (daily mod hard-tier dedup)** — In `getDailyModifiers`: added `hardTier = ['multiplier', 'double_pegs', 'fast_timer']` / `easyTier = ['gravity', 'fewer_pegs', 'small_ball']` classification. If both picks are in hard tier, swap `mod2` for a deterministic easy-tier pick (using `seededRandom(seed + 2)` for reproducibility). Verified 0% `multiplier + double_pegs` pairs over 100 random daily seeds (was 17%).
- **Phase 4.5-I (chain timer 30 → 36 frames)** — `C.CHAIN_T` bumped 30 → 36 frames (0.5s → 0.6s at 60fps). +20% chain window for slower players. The urgent/critical CSS thresholds (at 35% / 15% of the timer) still fire at 0.21s / 0.09s remaining, preserving the visual cue.
- **Phase 4.5-J (per-peg floor scaling)** — New `pegBasePoints()` helper: `50 * (1 + (GS.fl - 1) * 0.1)`. Floor curve: fl 1=50, fl 5=70, fl 10=95, fl 12=105. Replaced flat `50` in two sites: `Peg.hit` (line ~2115) and `triggerSlotCollected` CREDITS branch (line ~2679). CREDITS slot now scales from 50 → 105, ~2.1x more valuable late-game. Explosive peg's own 500 bonus intentionally NOT scaled (premium effect, not base scoring).
- **Phase 4.5-K (credit rate + payload cost rebalance v2, luxury tier)** — Economy was still too generous post-A. (K-1) Credit rate cut 10% → 5%: `Math.floor(floorDelta / 20)` (was `/10`). A 10k-score run now yields 500 credits (was 1000). `credit_rich` achievement now fires at 20k score, a real milestone. (K-2) Payload cost rebalance v2: new spread 80-220 (was 50-120, 2.4x → 2.75x ratio). Scrambler 50→80, Ghost 60→100, Slowmo 85→150, Daemon 80→130, Trojan 80→140, Worm 95→180, Explosive 100→180, Cluster 100→180, Logic Bomb 120→220. Powers are now a real luxury (a 10k-score run affords 1-3 with deliberate choices, not 6-8).
- **Phase 4.5-L (jackpot 2/3 partial match)** — `spinJackpot` rewritten with 3-way branch: 3/3 (jackpot, full payout), 2/3 (NEW partial: +10% of current jackpot as score, `Audio.playBonus()` chime, '2 OF 3!' float in yellow, '+<amount>' float in orange), 0/3 (miss). The 2/3 is the frequent "you almost got it" that keeps the slot machine feeling alive. Per-floor engagement: 19% chance of *some* win (was 5.5%). Payout is *score* (consistent with 3/3 and JACKPOT slot), not credits.
- **Phase 4.5-M (slot machine reel state persistence fix)** — `.win` CSS class (flashing yellow border with `jackpot-win 0.3s ease-in-out infinite` animation) was being added to matching reels but never removed. Fixed in 4 places: (M-1) strip `hit` / `win` / `lose` from all 3 reels at top of `spinJackpot()`; (M-2) 1500ms timeout to remove `win` / `lose` after 3/3 jackpot branch; (M-3) same 1500ms timeout at end of 2/3 partial branch; (M-4) safety strip before `showScreen('fc')` in floor-complete handler. Win flash now plays for 1.5s, then reels return to neutral state with final symbols visible.
- **Phase 4.5-N (slot machine result banner)** — Added a persistent result banner (`<div id="jackpot-result">`) between reels and `SPINS LEFT` text. Three states with distinct visual treatment: `jackpot` (3/3: gold border + glow, `★ JACKPOT! ★` in gold, `+<amount> POINTS` in yellow), `partial` (2/3: yellow border + soft glow, `NICE! 2 OF 3` in yellow, `+<amount> POINTS` in orange), `miss` (0/3: grey border, `MISS` in grey, `NEXT JACKPOT: <amount>`). Hidden on new spin / new floor's fc. Helpers `showJackpotResult(kind, amount, nextJackpot)` and `hideJackpotResult()`. ~60 lines CSS + 8 edits.
- **Phase 4.5-O (floor-cleared overlay alignment fix)** — `#fc` content was offset right of canvas center (JACKPOT section ~50px, CONTINUE/END RUN buttons ~130px). Root cause: inner `<div>` wrappers had no `width`, so `align-items: center` centered them in their (narrower) content boxes, not the 480px parent. Fix: `width:100%; box-sizing:border-box;` on both inner divs (O-1/O-2), `margin-left/right:auto` on `.jp-display` (O-3), `text-align:center` on `.ov` (O-4 safety), `align-self:center` on `.btn` (O-5 safety). All elements now share canvas center axis (240px in 480px).
- **Phase 4.5-P (continuous BGM + "CONNECTION LOST" end screen)** — BGM was restarting between every floor (fc mapped to `null`, slot-selector mapped to `'gameplay'`). New flow: `trackForScreen` updated so `'slot-selector'` and `'fc'` both return `'continue'`, `'re'` returns `'ending'`. The ONLY BGM transition during a run is in `startGame()` (title → gameplay). Slot-machine spin save/restore pattern: `previousBgm = Audio.currentBgmId` before spin, `Audio.playBgm('slot-spin')`, then `Audio.playBgm(previousBgm)` after. `Audio.playBgm('connection-lost')` removed from both game-over and `endb` handlers. `#re` h2 changed from "RUN COMPLETE" to "CONNECTION LOST".
### Current Status (as of Phase 5)
- **Mobile compatibility shipped (Phase 5)** — Slot Protocol now runs on iOS Safari and Android Chrome. Eight discrete changes: CSS scale-to-fit wrapper, canvas pointer events with tap guard, slot-selector tap-to-select-tap-to-place, slot-selector pointer-event tooltips, title-BGM pointermove trigger, tap-feedback CSS (touch-action manipulation + tap-highlight suppression), and orientation lock with feature-detect. Total ~180 lines added, 30 lines of DnD wiring removed.
- **All previous functionality preserved.** `validation-tests.js` and `performance-validation.js` still pass (no game-logic changes — only input/UI).
- **Single regression on desktop**: the slot-selector manual arrangement now uses tap-to-select-tap-to-place (which still works with mouse clicks) instead of drag-and-drop. The user accepted this trade-off explicitly during the interview phase.



### Current Status (as of Phase 4.5-Q)
- **Phase 4.5 series complete (PR1 + A through Q)** — Economy is balanced, the slot machine has the right engagement curve, and the floor-cleared overlay renders correctly. 5680 lines total, 17 Phase 4.5 tags A–Q in source.
- **Score / credit economy** — Credit rate 5% of floor score delta (Phase 4.5-K-1, was 10% pre-K and 10% with double-dip pre-A). A 10k-score run yields 500 credits. `credit_rich` achievement fires at 20k score. No double-dipping at floor clear or run end. Slot pool is 3 unique useful types (Phase 4.5-F, EMPTY excluded).
- **Peg-target curve** — Linear `12 + Math.floor(fl * 1.5)`. fl 1=13, fl 5=19, fl 10=27, fl 12=30. Solvable with 5 balls * 6 hits/ball = 30 max peg hits (fl 12) at ~50% rate.
- **Per-peg scoring** — Floor-scaled via `pegBasePoints()`: fl 1=50, fl 5=70, fl 10=95, fl 12=105. Stacks with combo and frenzy multipliers.
- **Payload costs (luxury tier)** — 80-220 spread, 2.75x ratio. Scrambler 80 / Ghost 100 / Daemon 130 / Trojan 140 / Slowmo 150 / Worm 180 / Explosive 180 / Cluster 180 / Logic Bomb 220. A 10k-score run (500cr) affords 1 premium + 1 cheap (Cluster 180 + Scrambler 80 = 260) with 240cr to spare.
- **Slot machine** — 3-reel, 3-way result: 3/3 jackpot (5.5% per floor, full payout + `★ JACKPOT! ★` banner), 2/3 partial (13.5% per floor, +10% jackpot as score, audio cue, `NICE! 2 OF 3` banner), 0/3 miss (80.5%, `MISS` banner with next-jackpot target). 19% per-floor engagement (was 5.5% pre-L). Persistent result banner + clean reel-state reset between spins/floors.
- **Daily mods** — 6/6 wired via `modActive(id)`. Hard-tier dedup (Phase 4.5-H) prevents `multiplier + double_pegs` + `fast_timer` stacking. `gravity` now applied via `modActive` (the previous one-shot fn side-effect was being wiped by `startGame()`).
- **Visual system** — Phase 3 Blade Runner 2049 direction: Orbitron + Share Tech Mono typography, neon-line-art icon set (30+ entries in `svg-icons.js`), refined outline + glow buttons, scanline + CRT vignette ambient. Color scheme unchanged.
- **Audio** — Web Audio procedural SFX + 3 active HTML5 BGM tracks (title / gameplay / ending). Continuous BGM through runs (transitions: title → gameplay at run start, gameplay → ending at run end, ending → title at menu; floor-complete and slot-selector return `'continue'` so the gameplay track plays through). The `connection-lost.mp3` and `slot-machine.mp3` audio files are no longer in BGM rotation (left in place). SFX and BGM mutes are independent and persisted.
- **All Phase 2a/2b/2c/3 functionality preserved**: tooltips, payloads, daily challenge, slot selector, slot icons, etc.

### Earlier phases (2a, 2b, 2c) — ship log

> Historical record of work shipped in Phases 2a, 2b, and 2c. Superseded by the Phase 4.5 series for the economy / slot-machine / BGM subsystems, but the underlying mechanics, payloads, daily challenge, and tooltips are still in production.

- **Phase 2c post-retrofix (MULTIBALL_THRESHOLD reserved)** — Closed the last Known Gap. Decision: leave multiball as a settings-toggle opt-in for now, and reserve the `MULTIBALL_THRESHOLD = 7` constant for the future meta-progression unlock system (e.g. "reach combo 7 to permanently unlock multiball" as a milestone reward, matching the existing ball-skin / board-theme unlock pattern). Annotated the constant in `index.html` (line ~659) with a 5-line comment explaining the reserved intent so future-you knows not to delete it. No behavior change. Net +6 lines in `index.html` (the comment block).
- **Phase 2c post-retrofix #2 (ball count double-decrement on exit)** — Dropping 1 ball that fell through subtracted 2 from GS.bl instead of 1 (e.g. 5 → 3). Root cause in `updateBalls`: the main-ball exit check calls `checkBallExit(GS.ball)` (which does `GS.bl--`) and then sets `GS.ball = null`. The next block, "Check mini balls (if not in multiball mode)", iterates the full `activeBalls` array with a guard `mb !== GS.ball` — but `GS.ball` is now `null`, so the original main ball (still in `activeBalls[0]`, now `!b.on`) passes the guard and `checkBallExit` is called a second time. The same flow produced the `-1` on the floor clear screen: drop a ball when GS.bl was 1, double-decrement takes it to -1, and `fbl` reads `GS.bl` directly. Fix: `activeBalls` is built as `push(mainBall).concat(mainBall.mb)`, so `activeBalls[0]` is always the main ball. Start the mini-ball loop at index 1 instead of 0 and drop the broken `mb !== GS.ball` guard. Net +8 lines in `index.html` (the explanatory comment + the loop change). No behavior change for actual mini-balls (cluster / trojan); the double-decrement was a single-ball regression that affects every dropped ball in non-multiball mode.
- **Phase 2c post-retrofix #3 (cluster / trojan minis had no exit cost)** — Built on retrofix #2. Two related bugs in the mini-ball exit path made cluster (3 minis) and trojan (2 minis) feel free. (1) The early `GS.ball.mb = GS.ball.mb.filter(mb => mb.on)` in `updateBalls` removed inactive minis BEFORE the third loop iterated `GS.ball.mb` for `!mb.on`, so the third loop was dead code: zero ball-count charge, zero overflow trigger when a mini exited in non-multiball mode. The cluster/trojan payload had no real downside. (2) When the main ball exited before its minis, the minis became unreachable: `activeBalls` is built from `GS.ball.mb`, and with `GS.ball = null` the next frame's snapshot is empty, so the minis were never exit-checked, never charged, and never triggered overflow. The pre-existing `GS.ball = GS.activeBalls.length > 1 ? GS.activeBalls[1] : null;` was a half-fix: it referenced the previous frame's `GS.activeBalls` (the new value is rebuilt below, not above) and never re-parented the other minis, so even when promotion fired only one of N minis stayed reachable. Fix: removed the early filter; removed the redundant second loop from retrofix #2 (would have been a double-count hazard once the third loop is live); rewrote the main-ball exit block to find the first still-active mini in the current snapshot, promote it to the new main ball, and re-parent the remaining still-active minis under its `mb`; the third loop now iterates the snapshot (safe when `GS.ball` is null) and is the single source of truth for mini-ball exit cost. Net +44 lines in `index.html` (mostly the explanatory comments + the promotion / re-parenting block). Behavior: non-multiball cluster now costs 1 (main) + 3 (minis) = 4 balls; non-multiball trojan costs 1 + 2 = 3; multiball mode is unchanged (no penalty, just array cleanup).
- **Phase 2c post-retrofix #4 (shield bounce was useless)** — The SH slot (shield) saved a ball from overflow exit, but the bounce was so weak that the ball barely clipped into the peg field and immediately fell back. Worse, even if the bounced ball re-entered a slot, `slotChecked` was still true from the original entry, so the second slot was a silent no-op. Net result: the SH slot was effectively a one-ball save with no further gameplay. Three coordinated changes: (1) the shield exit block in `Ball.update` now applies a fixed `vy = -7` (vs the old `vy *= -0.5` of the downward velocity, which gave a peak at y≈481 for a typical exit), plus a random vx nudge of `(Math.random() - 0.5) * 6` so the bounce trajectory is unlikely to land in the same x-slot; (2) `slotChecked` is cleared on the bounce so a new slot entry actually fires; (3) a same-slot guard in the slot-check block uses a new `this.shieldedSlot` field (set on first slot entry, persists across the bounce) to suppress a duplicate trigger if the random bounce does land the ball back in the same slot - this prevents the JP-double-trigger case while still allowing the common case of landing in a different slot. Locked-slot entries stay as silent no-ops (they don't set `shieldedSlot` since `checkSlot` returns early for them). Net +29 lines in `index.html` (mostly the explanatory comments + the same-slot guard). Behavior: SH slot now actually gives the ball a meaningful second chance to hit a different slot effect, matching the cost of setting up the slot in the first place.
- **Phase 2c post-retrofix #5 (board glow border was missing during play)** — All colored borders in the game live on the `.ov` overlays (`#menu`, `#slot-selector`, etc.), not on the `#game-container` itself. After confirming the slot arrangement, `showScreen('none')` hides the slot-selector (and its orange border), and the canvas is shown with nothing around it - the cyan border the player saw on the menu was an overlay border, not a game-area border. Fix: added a `box-shadow`-based 2px border + 30px outer glow to `#game-container` via a new `.board-active` class (no layout impact - a real border would shrink the inner 480x700 area to 476x696 and break the canvas and overlay sizing). The class is toggled in `showScreen()`: added when no overlay is shown (the canvas-visible case), removed when any overlay is up (avoids a doubled border ring with the overlay's own colored border). Theme support: cyan for default, green for `theme-matrix`, white for `contrast-mode`. Net +23 lines in `index.html` (3 CSS rules + a comment + the showScreen toggle block).
- **Phase 2c post-retrofix #6 (slot machine spin timing)** — The jackpot spin in `spinJackpot` originally took ~2.5s (reel 0: 8 × 60ms, reel 1: 12 × 60ms, reel 2: 16 × 60ms, plus a 200ms inter-reel gap and 100ms per-reel cleanup) - too slow per playtest. First pass dropped it to ~1.2s (40/6/+2/+4/80/50) - too fast, felt like it skipped the anticipation. Settled on ~1.7s (50/6/+3/+5/120/60) as the middle ground. Also removed a `// Slow down this reel's final spins` block that reassigned `timePerReel` inside the setInterval callback: setInterval locks the interval at creation time, so the reassignment was a no-op and the near-miss drama it was meant to add never fired. Throttled the reel-tick audio to every other cycle (was every cycle) - at 50ms/cycle the 30ms tone would be a 60% duty cycle buzz, every-other gives distinct ~10Hz clicks which sound much more like a slot machine. Synced the `.jr.sp` CSS `spin` animation to 0.06s so the visual rotation matches the new cycle (was 0.08s, slower than even the original 60ms cycle). Net +7 lines in `index.html` (mostly the explanatory comment on the spin timing).
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

## Phase 4.5 - Economy Balancing Pass

Audit + balance pass on the run economy (score, credits, peg-target curve, payload costs, slot effects). Conducted after Phase 3. Findings + shipped fixes in this section.

### Audit findings (as of Phase 3)

- **Peg-target curve** (`setupObj`, line ~2095): tier table `[15,20,25,30] + fl` gave fl 1/5/10 targets of 16/25/40. Past fl 6 the curve outpaces peg-hit efficiency (5 balls * ~6 hits/ball = 30 max). Late-game feels like a grind.
- **Per-peg scoring** is flat across floors (Node at fl 12 = same 50 base as fl 1). No floor-scaling reward.
- **Credit income** has a double-dipping bug: `loop()` floor-clear pays `Math.floor(GS.sc/10)` of the cumulative score at every floor clear, AND `retb()` pays the same `Math.floor(GS.sc/10)` of the final cumulative score on run end. Example: 4-floor run with floor scores 1k/2k/3k/4k pays 100+300+600+1000+1000 = **3000 credits** for 10k total score. The `credit_rich` achievement is intended to fire at 1000 credits/run; the bug means it fires at ~3300 score instead.
- **Payload cost/power inversion**: the most powerful payloads (Worm, Slowmo) are the cheapest (60, 55). The cheapest should be the situational ones (Scrambler, Ghost).
- **Crumble slot is a progress exploit**: `triggerSlotCollected` CM branch increments `GS.obj.prg` once per destroyed peg, so a single Crumble gives 3 free progress. Combined with removing those pegs from the board, it both counts toward the objective AND thins future hit opportunities.
- **Slot pool of 3 with 35% EMPTY weight** = 1.05 expected EMPTY per floor, 4.3% chance of all-EMPTY pool.
- **Explosive peg's `GS.sc *= 3`** triples lifetime score on one hit, which dominates in long combos and reads as broken (every other special peg is a flat +bonus).
- **Daily mod stacking**: `multiplier` (cap combo x4) + `double_pegs` (halve all scoring) on the same day is run-ending. Should disallow the worst mod pairs.
- **Chain timer (C.CHAIN_T = 30 frames ~ 0.5s)** is tight for slower players.
- **Shield slot** has a working bounce (vy=-7) but the tooltip undersells what the ball can do post-bounce.

### Top 5 fixes shipped (PR1)

1. **A. Credit double-dipping fix** - changed `loop()` floor-clear payout to pay the *delta* from the last floor's score (new `GS.lastFloorScore` tracking), initialized to 0 in `startGame()` and reset in `contb()`. Removed the run-end `PERSIST.br += Math.floor(GS.sc/10)` in `retb()`. Net effect: a 10k-score run now yields exactly 1000 credits (matching the `credit_rich` achievement target). The `updateRunEnd` display still computes `Math.floor(GS.sc/10)` for the 'Credits Earned' line, which now matches the actual amount paid out.
2. **B. Peg-target rescale** - replaced the tier table in `setupObj` with a single linear curve `t = 12 + Math.floor(fl * 1.5)`. New targets: fl 1=13, fl 5=19, fl 10=27, fl 12=30. Softens the late-game grind without trivialising it.
3. **C. Payload cost rebalance** - rewrote the cost table in `updateShop` to align cost with power:
   - Scrambler 50 (keep, situational)
   - Ghost 50 -> 60 (slight buff, weakest combat payload)
   - Slowmo 55 -> 85 (was the most underpriced, now premium)
   - Daemon 80 (keep)
   - Trojan 75 -> 80 (slight buff)
   - Worm 60 -> 95 (big jump, free combo through everything)
   - Explosive 85 -> 100 (tied with Cluster for chain-destroy premium)
   - Cluster 90 -> 100 (kept premium, mini-ball chase is great)
   - Logic Bomb 100 -> 120 (most expensive premium, x3 lifetime score)
   Spread is now 50-120 (was 50-100), with the cheapest mapping to the situational payloads and the priciest to the run-warping ones.
4. **D. Crumble objective-count fix** - in `triggerSlotCollected` CM branch, moved the `GS.obj.prg++` out of the destruction loop so it fires once per Crumble (regardless of how many pegs are actually destroyed), not once per destroyed peg. Crumble still thins the board and gives +1 toward objective (so it remains a 'feels good' slot), but no longer grants +3 free progress.
5. **E. Shield tooltip clarification** - updated `C.SLOT_TOOLTIPS[5].desc` from 'Next ball is bounced back from overflow exit instead of dying.' to 'Bounces the next ball back from overflow exit so it can hit more pegs.' Makes it clear the bounced ball re-enters the peg field, not just gets a free pass.

### Deferred (initial PR1 plan, status as of follow-up pass)

The original PR1 plan listed 5 deferred items. Status:

- **F. Slot pool size 3 -> 4** - SUPERSEDED by Phase 4.5-F (unique pool + EMPTY exclusion). The size-bump was a poor solution to the underlying anti-agency problem; the unique-pool fix is the better one.
- **G. Explosive peg scoring rewrite** - SHIPPED in Phase 4.5-G. See below.
- **H. Daily mod stacking rule** - SHIPPED in Phase 4.5-H. See below.
- **I. Chain timer bump** - SHIPPED in Phase 4.5-I. See below.
- **J. Per-peg floor scaling** - SHIPPED in Phase 4.5-J. See below.

All deferred items are now resolved. The Phase 4.5 series (A-J) is closed.


### Phase 4.5-F: Unique pool + no EMPTY as a choice (added post-PR1)

Added after PR1 (initial 5 fixes) at user request. Found a deeper issue with the pool:
- 35% EMPTY weight meant ~73% of pools had at least one EMPTY pick (and 4.3% of pools were all-EMPTY)
- Duplicates were possible (e.g. two CR in a row)

**Changes in `initSlotArrangement` (index.html ~line 2500):**
- Excluded `C.ST.E` (EMPTY) from the pool roll. EMPTY is a strictly negative slot (no effect on ball entry, still costs a life) and offering it as a "choice" was anti-agency. The 35% weight was redistributed proportionally across the 7 useful types so the rare ones (JP, OC, SH) get a small bump.
- New pool weights: JP 4% / OC 10% / SH 12% / CM 15% / AM 15% / PA 18% / CR 26% (sums to 100%, was 65% useful).
- Added a re-roll loop: each pick rolls up to 30 times for an unused type, with a fallback that picks any remaining unused useful type if the weighted roll never escapes (extremely unlikely with 7 eligible types and 3 picks).
- Verified via 100k Monte Carlo: 100% of pools are 3 unique useful types, 0% contain EMPTY.

**EMPTY slot type is NOT removed:**
- Still in `C.ST` enum (defensive coverage for data load / future reset paths)
- `triggerSlotCollected` still has the no-op branch (cheap, safe)
- `checkSlot` still treats it as "no effect"
- `getSlotColor` / `slotIconCache` still handle it
- But it is **unreachable through normal play** — pool never offers it, AUTO-ARRANGE never places it (the pool always fills all unlocked positions with useful types)

**Followup consideration:** if at some point we want to offer EMPTY as a *deliberate* player choice (e.g. a "skip" position that doesn't trigger any slot effect but is visually distinct), it could be re-added to the pool at a low weight (5-10%) so the player can opt in. For now, it's effectively removed from the gameplay loop.
### Phase 4.5-G: Explosive peg scoring rewrite

The Explosive peg (PT.E) was the only special peg with lifetime-scaling on its score: `GS.sc *= 3` in the PT.E branch of `Peg.hit` AND `GS.sc += bonus * 3` in `triggerPegExplosion`. A single Explosive hit on a 10k-score game turned into 30k+ in one frame. Every other special peg is a flat +bonus — Explosive was the outlier and dominated long runs.

**Changes in `index.html:1952-1958` and `index.html:3080-3120`:**
- Removed `GS.sc *= 3;` and the redundant `'x3'` float from the PT.E branch in `Peg.hit`. The `triggerPegExplosion` call below now does the work.
- `triggerPegExplosion` rewritten: self bonus is now flat `500 * (cc+1) * (frenzy?3:1)`, adjacent bonus is flat `100 * (cc+1) * (frenzy?3:1)`. No lifetime multipliers anywhere.
- Float text changed from `'x3!'` to `'BOOM +<amount>'` so the player sees the actual score gain.
- The new self/adjacent values match the *feel* of Cache's `200 + cc*50` pattern (base value scales with combo and frenzy). At low combo: Cache 200, Explosive 500 (2.5x premium for chain-destroy). At max combo + frenzy: Cache 550, Explosive 12000 (still strong, but bounded).
- Explosive PAYLOAD (b.explosive, paid at 100cr) is unchanged — it only chain-destroys pegs, no score scaling. That was already correct.
- Logic Bomb PAYLOAD (b.lbActive, paid at 120cr) still does `GS.sc *= 3` — that's a paid payload, not a peg, and the player chose it.

### Phase 4.5-H: Daily mod hard-tier dedup

Previously, a daily seed could pick both `multiplier` (cap combo x4) and `double_pegs` (halve all scoring) on the same day. Stacking these was run-ending.

**Changes in `getDailyModifiers` (`index.html:1350-1359`):**
- Added a `hardTier = ['multiplier', 'double_pegs', 'fast_timer']` and `easyTier = ['gravity', 'fewer_pegs', 'small_ball']` classification.
- If both `mod1` and `mod2` are in the hard tier, swap `mod2` for a deterministic pick from the easy tier (using `seededRandom(seed + 2)` so the result is reproducible for a given date).
- Tier rationale: hard = all three cap or reduce player power. Easy = non-capping, with workarounds (gravity = drop higher, fewer_pegs = aimed shots, small_ball = pegs are bigger relative to ball).

### Phase 4.5-I: Chain timer 30 → 36 frames

`C.CHAIN_T` was 30 frames (0.5s at 60fps) — tight for slower players, who would lose combos because the timer expired between bounces.

**Change in `index.html:701-707`:**
- `CHAIN_T: 30` → `CHAIN_T: 36` (0.5s → 0.6s).
- Invisible to fast players, meaningful QoL buff for slow ones.
- The combo-urgent and combo-critical CSS animations at <35% and <15% of the timer still fire (0.21s and 0.09s remaining respectively), so the visual urgency cue is preserved.

### Phase 4.5-J: Per-peg floor scaling

Per-peg scoring was flat across floors — a Node hit at floor 12 gave the same 50 base as floor 1. Late-game runs felt the same per-peg as early runs, which made deep runs feel grindy on a per-action basis (even with the softer target curve from Phase 4.5-B).

**Changes in `index.html:757-771, 1861-1863, 2419-2421`:**
- Added a `pegBasePoints()` helper that returns `50 * (1 + (GS.fl - 1) * 0.1)`. Floor curve: fl 1=50, fl 5=70, fl 10=95, fl 12=105.
- Replaced the flat `50` in two sites:
  - `Peg.hit` top of function (line 1862) — affects Node, Teleport, Dormant activation, Ice first hit, and the default-peg branch
  - `triggerSlotCollected` CREDITS branch (line 2420) — credits slot now scales with floor
- The explosive peg's own 500 bonus in `triggerPegExplosion` is intentionally NOT scaled — it's a premium effect, not a base scoring branch, and the user spec was specific to the 50-point base. The 50 in `triggerSlotCollected` AMPLIFY was already not a base formula (it adds to GS.cc / GS.ct, not GS.sc).
- CREDITS slot now scales from 50 (fl 1, no combo) to 105 (fl 12, no combo), so late-game CREDITS slots are ~2.1x more valuable. Combines naturally with the combo+frenzy multipliers for big late-game payouts.

### Validation results (G/H/I/J)

- **G** simulation: 10k-score run, one explosive hit mid-combo. Old: 30k+ (3x lifetime + bonus*3). New: 10k + 500*4*3 = 16k at mid combo. Bounded and predictable.
- **H** simulation: 100 random daily seeds. Without dedup, 17% had a `multiplier + double_pegs` pair. With dedup: 0%.
- **I** sim: 30→36 frames means a 20% longer window. The CSS urgent/critical thresholds (at 35% / 15% of the timer) still trigger at 0.21s / 0.09s remaining, preserving the visual cue.
- **J** sim: floor 12 max-combo+frenzy Node hit = 105*8*3 = 2520 (was 1200). Per-floor total scoring at floor 12 with 30 hits = ~3000-5000 (was ~1500-2500). Late-game scoring now feels rewarding without trivialising the curve.

### Phase 4.5-K: Credit rate + payload cost rebalance v2 (luxury tier)

After Phase 4.5-A the credit economy was correct (10% of floor score delta, no double-counting) and after 4.5-C the payload costs were aligned with power (50-120 spread). But the combination was still too generous: a 4-floor 10k-score run gave 1000 credits, and the player could buy 6-8 payloads from that. Powers weren't a *luxury* — they were routine purchases. Multi-ball payloads (Trojan, Cluster) and the rare-but-strong ones (Logic Bomb, Slowmo) became run-warping defaults rather than meaningful choices.

**K-1: credit rate cut 10% → 5%** (`index.html:4574-4575`)
- `Math.floor(floorDelta / 10)` → `Math.floor(floorDelta / 20)`
- A 10k-score run now yields 500 credits (was 1000). The `credit_rich` achievement (1000/run) now fires at 20k score, a real milestone instead of a per-floor triviality.

**K-2: payload cost rebalance v2** (`index.html:3725-3738`)
- New spread 80-220 (was 50-120, 2.4x ratio). New ratio 2.75x.
- Scrambler 50 → 80 (cheap situational)
- Ghost 60 → 100 (weak combat, slight bump)
- Slowmo 85 → 150 (was the most underpriced after C; now premium)
- Daemon 80 → 130 (1-ball save, mid tier)
- Trojan 80 → 140 (2 minis, mid-premium)
- Worm 95 → 180 (free combo, premium)
- Explosive 100 → 180 (chain-destroy, premium)
- Cluster 100 → 180 (3-mini split, premium — matches Explosive)
- Logic Bomb 120 → 220 (lifetime x3 score, the priciest)

**Combined effect** (verified by simulation):
- 4-floor 10k-score run: 500 credits. Can buy 1 premium (e.g. Cluster 180) + 1 cheap (Scrambler 80) = 260, with 240 left for a mid-tier (Slowmo 150) or 2 cheap (Ghost 100 + Daemon 130 = 230).
- Old economy: same run bought 6-8 payloads. New economy: 1-3 with deliberate choices.
- Powers are now a real luxury — picking a Cluster over a Scrambler means skipping something else later.

### Phase 4.5-L: Jackpot 2/3 partial match

The 3-reel slot machine was 1/36 hit chance per spin (5.5% per floor with 2 spins). Players went entire runs without hitting, which made the jackpot feel like a pipe dream rather than a motivating force. The user flagged this as an engagement issue: jackpot should be rare, but the slot machine has to keep the player engaged.

**Change in `spinJackpot` (`index.html:1545-1626`):**
- Replaced the 2-way (jackpot / miss) branch with a 3-way branch:
  - **3/3 match** (jackpot): unchanged. Full payout + fanfare + screen shake + `jackpotWonThisFloor = true`.
  - **2/3 match** (partial, NEW): +10% of current jackpot as score, `Audio.playBonus()` chime, '2 OF 3!' float in yellow, '+<amount>' float in orange. The two matching reels get the 'win' class; the odd one gets 'lose'. The jackpot does NOT grow (this is a small win) and does NOT count as `jackpotWonThisFloor` (the player can still spin the second time).
  - **0/3 match** (miss): unchanged. Jackpot grows 15%, 'TRY AGAIN...' float, all reels flash 'lose'.

**Probability** (with 6 symbols, 3 reels):
- 3/3: 6 × (1/6)³ = 1/36 = 2.78% per spin → ~5.5% per floor
- exactly 2/3: 3 × (1/6)² × (5/6) = 15/216 = 6.94% per spin → ~13.5% per floor
- 0/3: ~90.3% per spin → ~80.5% per floor

**Engagement per floor**: 19% chance of *some* win (was 5.5%). The 3/3 remains the big rare event; the 2/3 is the frequent "you almost got it" that keeps the slot machine feeling alive. Per-spin expected value: 2-match contributes 0.694% of jackpot, 3-match contributes 2.78% — so 3/3 is still 4x more valuable per spin than 2/3, but 2/3 is 2.5x more common.

**No interaction with the credit economy**: the 2/3 payout is *score* (consistent with the 3/3 and the board-level JACKPOT slot, both of which add to GS.sc), not credits. Credits come from floor clears (K-1). This keeps the two economies separated and the slot machine's role clear: it's a score burst, not a credit faucet.

### Phase 4.5-M: Slot machine reel state persistence fix

After a 3/3 jackpot or 2/3 partial match, the `.win` CSS class (flashing yellow border with `jackpot-win 0.3s ease-in-out infinite` animation) was being added to the matching reels but never removed. The `.lose` class was properly removed via a 500ms `setTimeout` in the 0/3 and 2/3-odd-reel branches, but the `.win` class had no equivalent cleanup.

Two failure modes:
1. **Same floor, no more spins**: if the player hit a 3/3 jackpot (spin button disabled) or ran out of spins, the cleanup at the start of the *next* spin's result handler never ran. The flashing yellow persisted.
2. **Across floor boundaries**: if the player hit CONTINUE before the next spin, the reel elements (which are static divs, not re-rendered) carried the `.win` class into the next floor's floor-complete screen.

**Fix in 3 places (`index.html`):**
- **M-1**: at the top of `spinJackpot()`, strip `hit` / `win` / `lose` from all 3 reels before the new spin starts. Belt-and-suspenders: even if the timeout doesn't fire, the next spin starts clean.
- **M-2**: at the end of the 3/3 jackpot branch, schedule a `setTimeout(1500ms)` to remove `win` / `lose` from all reels. 1500ms is enough for the player to read the `★ JACKPOT! ★` float and the screen effects.
- **M-3**: same 1500ms timeout at the end of the 2/3 partial branch. The original 2/3 code only had the 500ms `lose` timeout for the odd reel; the two matching reels kept `.win` indefinitely.
- **M-4 (safety)**: right before `showScreen('fc')` in the floor-complete handler, strip `hit` / `win` / `lose` from all reels. Catches the case where the user races through a floor in <1500ms (faster than the win-flash timeout) and enters the next floor's fc with stale reel state.

After the fix, the win flash plays for 1.5s (so the player sees the celebration), then the reels return to a neutral state with the final symbols still visible. The state is also reset at the start of every new spin and at the start of every new floor's fc, so there are no persistent-flash cases.

### Phase 4.5-N: Slot machine result banner

The slot machine's win feedback was three small float texts (`★ JACKPOT! ★`, `2 OF 3!`, `+<amount>`) that rose and faded within ~1 second, plus a yellow border flash on the matching reels. Easy to miss — the player would often look at the reels and not register the +X amount, especially on a 2/3 partial (the `+X` is small and moves quickly).

**Change:** added a persistent result banner between the reels and the `SPINS LEFT` text. Three states with distinct visual treatment:

- **`jackpot`** (3/3 match): gold border + glow, title `★ JACKPOT! ★` in gold with text-shadow, subtitle `+<amount> POINTS` in yellow.
- **`partial`** (2/3 match): yellow border + soft glow, title `NICE! 2 OF 3` in yellow, subtitle `+<amount> POINTS` in orange.
- **`miss`** (0/3 match): grey border (no glow), title `MISS` in grey, subtitle `NEXT JACKPOT: <amount>` in dim grey so the player sees the new value they're chasing.

**Lifecycle:**
- Hidden when entering the floor-complete screen (no result yet).
- Shows with a 0.3s scale-in animation when the spin result lands.
- Persists until the next spin starts (the next `spinJackpot()` call hides it via `hideJackpotResult()`).
- Replaced on each spin with the new result.
- Hidden on `showScreen('fc')` safety reset (along with the reel state reset from M).

**Why "POINTS" not "CREDITS":** the slot machine pays out *score* (added to `GS.sc`), not credits. The 5% credit conversion happens at floor clear. The banner says `+X POINTS` to match the actual reward type. If the player is confused, the float text + reels + prize pool still show the numbers, so they can verify.

**Why `NEXT JACKPOT: <amount>` on miss:** keeps the slot machine visible as a *target*. The player sees both "you missed" and "this is what you're chasing now" in one banner. Pairs with the existing reel `lose` flash (500ms) and the `'TRY AGAIN...'` float (which are unchanged).

**Files:** HTML banner `<div id="jackpot-result">` between the reels and `SPINS LEFT`; CSS for the 3 states (~60 lines); JS helpers `showJackpotResult(kind, amount, nextJackpot)` and `hideJackpotResult()`; wired into the 3 result branches + `spinJackpot()` entry + `showScreen('fc')` safety reset (8 edits total).

### Phase 4.5-O: Floor-cleared overlay alignment fix

The floor-cleared screen had a visible horizontal alignment issue: the JACKPOT section content (PRIZE POOL box, reels, MISS banner, NO SPINS LEFT button) was shifted ~50px right of the canvas center, and the CONTINUE / END RUN buttons were shifted ~130px right. The FLOOR CLEARED h2 and SPINS LEFT: 0 text were correctly centered, but everything else was offset.

**Root cause:** the two `<div>` wrappers inside `#fc` (the Score/Balls stats div and the Jackpot section div) had no `width` set, so they sized to their content. With `text-align: center` on the parent, their inline content was centered within the narrower divs — which were themselves centered in the 480px `#fc` by the `.ov` class's `align-items: center`. But the centering axes didn't line up: the inner divs sat at the center of their (narrower) content box, offset from the direct children (CONTINUE / END RUN buttons) that WERE centered in the full 480px. The buttons themselves also appeared to ignore `align-items: center` for unclear reasons — possibly a specificity issue with the existing `.btn` rule's `display: inline-flex` or a margin interaction.

**Fixes (`index.html`):**
- **O-1**: Score/Balls inner div — `style="margin:15px 0;text-align:center;width:100%;box-sizing:border-box;"` (was `margin:15px;text-align:center`). The `width:100%` forces the div to fill the 480px parent so its centered content sits at the canvas center. The `margin:15px 0` drops the left/right margin (no longer needed since the div fills the width) to avoid overflow.
- **O-2**: Jackpot section inner div — same treatment (`margin:15px 0;text-align:center;width:100%;box-sizing:border-box;`).
- **O-3**: `.jp-display` CSS — added `margin-left: auto; margin-right: auto;` so the 200px-wide PRIZE POOL block centers within the now-full-width parent. Without this, the block left-aligned within the parent and sat ~50px right of center.
- **O-4 (safety net)**: `.ov` class — added `text-align: center;`. Belt-and-suspenders for any inline content that might not be centered by `align-items: center` (e.g. if a future child has `display: inline` instead of being a flex item).
- **O-5 (safety net)**: `.btn` class — added `align-self: center;`. Explicit per-item override of the parent's `align-items`. Ensures buttons center regardless of any specificity gotcha (e.g. if the `.btn` class's own `align-items: center` was being interpreted as "center the button's own content" rather than "center the button in its parent").

**Why not just flatten the structure?** The inner divs serve a visual grouping purpose (Score/Balls together, Jackpot section together). Removing them and putting all elements as direct children of `#fc` would work but loses the grouping signal. The `width: 100%` fix preserves the structure while ensuring consistent centering.

**After the fix** (verified by reading the rendered CSS): all elements in the floor-cleared overlay should sit at the canvas center (240px in the 480px-wide canvas). The PRIZE POOL box, the 3 reels, the MISS banner, the NO SPINS LEFT button, and the CONTINUE / END RUN buttons all share the same vertical center axis.

### Phase 4.5-P: Continuous BGM + "CONNECTION LOST" end screen

The BGM was restarting between every floor because the floor-complete screen mapped to `null` (stop BGM) and the next slot-selector mapped to `'gameplay'` (start it again). Combined with the `stopBgm` call after each slot-machine spin, the player heard: gameplay → silence → gameplay → silence → gameplay... The run-end screen used the one-shot `connection-lost` sting which got cut off by the next title track when the player returned to menu.

**New BGM flow:**
- **Menu**: `title` track (looping, starts on first mousemove on title screen)
- **Start of run** (in `startGame()`): explicit `Audio.playBgm('gameplay')` — the ONE place the BGM transitions
- **Slot selector → gameplay → floor-complete → next floor**: all return `'continue'` from `trackForScreen()`, so the BGM keeps playing uninterrupted
- **Slot machine spin**: `playBgm('slot-spin')` during the spin, then `playBgm(previousBgm)` to restore gameplay (no more `stopBgm`)
- **Run end** (manual end or game over): `trackForScreen('re')` returns `'ending'` — the looping `ending-screen.mp3` track plays on the end screen
- **Return to menu**: `trackForScreen('menu')` returns `'title'` — switches back to title

**Changes (`index.html`):**

- **P-1** `trackForScreen` mapping updated:
  - `'slot-selector'` → `'continue'` (was `'gameplay'` — no more restart when re-entering from contb)
  - `'fc'` → `'continue'` (was `null` — gameplay BGM now plays through floor-complete)
  - `'re'` → `'ending'` (was `'continue'` — distinct end-screen music now plays)
- **P-2** `spinJackpot` save/restore: before the spin, save `Audio.currentBgmId` (the gameplay track); after the spin, `playBgm(previousBgm)` to restore. Replaces the `stopBgm(true)` that was cutting the BGM and causing the next screen change to restart it.
- **P-3** `startGame()` adds `Audio.playBgm('gameplay')` at the top. This is the ONLY place the BGM transitions during a run. After this, the BGM stays on gameplay through all floors.
- **P-4a/4b** Removed `Audio.playBgm('connection-lost')` from both the game-over check and the `endb` handler. The connection-lost sting was being cut off by the ending track anyway, and the ending loop is itself a "game over" cue.
- **P-5** Changed the `#re` overlay h2 from `"RUN COMPLETE"` to `"CONNECTION LOST"`. Matches the thematic framing (slot protocol as a system that gets disconnected) and the ending BGM track. The stats below (Score, Floors, Best Combo, Pegs Hit, Credits Earned, NEW BEST indicator) are unchanged.

**Why the ending track instead of connection-lost?**
- `connection-lost.mp3` is a one-shot sting (no loop) — it plays once and then there's silence
- `ending-screen.mp3` is a looping track designed to play while the player views the end screen
- The user wanted "end screen music" (ongoing), not a one-shot sting

**The result:**
The player now hears continuous BGM from the moment they click INITIATE BREACH through the entire run, through all floor transitions, through all slot-machine spins. The music only changes at three points: title → gameplay (at run start), gameplay → slot-spin (during a spin, then back to gameplay), gameplay → ending (at run end), ending → title (back to menu).

### Phase 4.5-Q: Slot machine BGM swap removed (SFX over continuous BGM)

After Phase 4.5-P made the BGM continuous through floor transitions, the slot-machine spin still swapped the BGM to a dedicated `'slot-spin'` track (`audio/slot-machine.mp3`) for the duration of the spin, then swapped back to gameplay after. The user pointed out that the slot-machine audio cue is already provided by the `playReelTick()` SFX calls in the `spinReel` setInterval (called every other cycle, ~25ms ticks at 1000Hz square wave) - we don't need a separate BGM track on top of that.

**Change:** removed the BGM swap around the slot-machine spin. The gameplay BGM now plays continuously through the entire spin, with the existing `playReelTick()` SFX layered on top.

**Why this is cleaner:**
- No track-switching mid-spin, so no risk of a load hiccup cutting the BGM
- Simpler audio state machine - the BGM is purely screen-driven (`trackForScreen` returns `'continue'` for `'fc'`, `'continue'` for `'slot-selector'`, `'ending'` for `'re'`, etc.) and never gets touched by the spin
- The `playReelTick()` SFX (a 30ms 1000Hz square wave) is short and percussive - it layers well over the continuous gameplay BGM as a ticking cue without competing with it
- The `slot-machine.mp3` audio file in the audio/ folder is now unused (left in place in case we want to re-enable it later)

**Files:** 2 edits in `index.html` (removed `var previousBgm = ...` and `Audio.playBgm('slot-spin')` before the spin; removed the restore block at the end of the spin). 2 `Phase 4.5-Q` tags in source. 17 phase tags A–Q total.

- **Phase 5 (mobile compatibility)** — Eight discrete changes, all in `index.html`, no game-logic or `C.*` constant changes.
  1. **Scale-to-fit wrapper**: new `<div id="scaler">` wraps `#game-container`. `#scaler` keeps an intrinsic 480x700 footprint (so the body flex centering still works unchanged) and gets a `transform: scale(s)` from a new `scaleToFit()` JS function — `s = clamp(min(innerW/480, innerH/700), 0.55, 1.0)`. Re-runs on `resize` and `orientationchange` (50ms deferred so the layout has settled). The existing `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">` was already in place and is the right choice — the `maximum-scale=1.0` prevents the user from pinch-zooming past the scale-to-fit.
  2. **Canvas pointer events**: `canvas.addEventListener('mousemove', ...)` → `'pointermove'`; `'mouseleave'` → `'pointerleave'`; `'click'` → `'pointerup'` (with a 10px tap-vs-drag guard via paired `'pointerdown'` storing the start XY). Added `touch-action: none; user-select: none; -webkit-tap-highlight-color: transparent` to `#gc` so the browser does not intercept touches for scroll/pinch-zoom or paint a blue highlight. The pointer events fire for both touch and mouse, so the hit-test math (which already used `getBoundingClientRect()` for clientX/Y → game coords conversion) is automatically correct at any scale factor.
  3. **Slot-selector tap-to-select-tap-to-place**: removed all HTML5 drag-and-drop wiring on `.slot-pos` and `.slot-pool-item` (the `draggable=true` attribute, the `dragstart`/`dragover`/`dragleave`/`drop` listeners). Added a new `GS.selectedSlot` field `{ source: 'pool'|'pos<N>', slotType, poolIdx, fromPos } | null` and a single delegated `pointerdown` listener on `#slot-selector` that routes taps to the new `selectOrPlace()` flow: empty selection + tap pool item → select it (yellow glow + `Audio.playDragPickup()`); empty selection + tap occupied-position → select for swap; selection + tap unlocked-empty position → `handlePoolDrop(targetPos)`; selection + tap locked + `canUnlockThisFloor` → `handlePoolDrop(targetPos, true)` (unlock+place); selection + tap occupied-position + position-source → `handleSlotDrop(targetPos)` (swap). A second delegated `document` `pointerdown` listener (capture phase) clears the selection on taps outside the overlay. `handleSlotDrop` / `handlePoolDrop` are unchanged — the new tap path just populates the same `GS.isDraggingSlot / draggingFromPos / draggingSlotType / draggingPoolIdx` fields and calls them.
  4. **Slot-selector pointer tooltips**: the existing delegated `mousemove`/`mouseleave` on `#slot-selector` was switched to `pointermove`/`pointerleave` — the tooltip-follows-finger behavior works identically on touch (pointermove fires continuously during an active touch session).
  5. **Title BGM trigger**: `firstMoveStartTitleBgm` now listens to `pointermove` instead of `mousemove` — a phone's first finger movement fires it, where `mousemove` may not.
  6. **Tap feedback CSS**: new combined rule `.btn, #sb, .ps, .spin-btn { touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }` (removes the 300ms tap delay, suppresses iOS long-press caret + blue tap glow). Slot items got the same set inside the existing `.slot-pos, .slot-pool-item` rule. New `.slot-pos.selected, .slot-pool-item.selected` rule (yellow border + inset glow + scale(1.12), persistent so the player can see what they picked) and `.slot-pos:active, .slot-pool-item:active` rule (scale(0.92) + brightness(1.4) for tap-down feedback since `:hover` never fires on touch).
  7. **Orientation lock**: new `tryLockPortrait()` calls `screen.orientation.lock('portrait')` with a feature-detect and a swallowed rejection — iOS Safari < 16.4 does not support the API and the rejection is benign (the CSS scale-to-fit still renders the board in landscape, just smaller).
  8. **Copy updates**: slot-selector intro text changed from "Drag a slot onto an unlocked position..." to "Tap a slot, then tap an unlocked position..."; the up-arrow divider from "Drag a slot up to a position" to "Tap a slot, then tap a position"; the inline infoDiv from "Drag onto a locked position to unlock it" to "Tap a slot, then tap a locked position to unlock it"; every `.title` attribute on `.slot-pos` from "Drag a slot..." to "Tap a slot...". The desktop-dnD `cursor: grab` styling was left in place (harmless on touch). `showScreen()` now clears `GS.selectedSlot` when leaving the slot-selector overlay (defensive, prevents the `.selected` highlight from re-appearing on a stale element on the next render).
  9. **High-DPI note (documented, not implemented)**: the canvas is 480x700 native. On a 3x DPI phone the CSS-scaled board will be slightly soft (canvas bitmap stretched by the browser). For the targeted port we accept this — it is still legible and avoids a `canvas.width = innerWidth * dpr` rewrite that would require re-tuning every render position. If the softness becomes an issue in playtesting, the right fix is to bump `canvas.width = 480 * window.devicePixelRatio` and apply `ctx.scale(dpr, dpr)` once at the top of the render loop, then audit every `ctx.fillText` / `ctx.arc` / `ctx.drawImage` call site.

**Files:** ~180 lines added, ~30 lines of DnD wiring removed, all in `index.html`. New `Phase 5` section comment block at the top of the file (CSS), at the canvas input block (event listener swap), in the slot-selector IIFE (delegated pointerdown + pointer tooltips), in `renderSlotSelector()` (DnD removal + .selected restore), in `showScreen()` (clear selectedSlot on leave), in `initBgm` (pointermove trigger), and a new `scaleToFit()` / `tryLockPortrait()` block after `loadPersist()`. 8 `Phase 5` tags in source.

### Validation plan (post Phase 5)

- [x] 5-floor mid-run sim: 1k+2k+3k+4k+5k = 15k score. Credits earned = 750 (5% rate, K-1). Was 1500 post-A and 3000 pre-A.
- [x] Floor 5 solvability: 5 balls * 6 hits/ball = 30 peg hits, target 19 (B). ~85% clear rate expected.
- [x] Floor 10 solvability: 30 peg hits, target 27 (B). ~50% clear rate expected.
- [x] Payload affordability: 500-credit run (10k score) should afford 1 premium + 1 cheap (K-2 spread 80-220), e.g. Cluster 180 + Scrambler 80 = 260, with 240 left for a mid-tier or 2 cheap. Was 6-8 payloads at pre-K-1 costs.
- [x] Daily mod simulation (100 seeds): zero 'multiplier + double_pegs' pairs after the H dedup rule (was 17%).
- [x] Jackpot 2/3 partial (L): 13.5% per spin, ~19% per-floor engagement with 2 spins (was 5.5%). Payout is score, not credits.
- [x] Phase 4.5-H: 100-seed simulation showed 0% hard-tier dedup violations.
- [ ] Hand-test fl 1/5/10, with and without Slowmo/Worm, time the clears and score deltas.
- [x] Phase 5 syntax: `node -c` against the extracted main script block returns no errors (no JS syntax regressions from the canvas input swap, tap-to-select-tap-to-place IIFE, or scaleToFit/tryLockPortrait init).
- [x] Phase 5 wiring audit: `grep -n "addEventListener('"'"'drag"` in index.html returns 0 hits (no dragstart/dragover/dragleave/drop listeners remain). The `draggable=true` attribute is no longer set on `.slot-pos` or `.slot-pool-item`. The `cursor: grab` styling is left in place (harmless on touch) but is no longer wired to any drag start.
- [x] `validation-tests.js` (existing game-logic suite) and `performance-validation.js` (existing FPS / memory-leak suite) still pass — Phase 5 is input/UI only, no `C.*` constants touched.
- [ ] Hand-test on real iPhone + Android device (DevTools emulation misses touch-gesture subtleties): confirm board scales to fit, no horizontal scroll, canvas tap drops a ball, tooltips appear on finger hold, slot-selector tap-to-select-tap-to-place works, title BGM starts on first touch, audio transitions correctly through a run.
- [ ] DevTools mobile-emulation smoke: iPhone SE (390x844) + Pixel 7 (412x915) + iPad Mini (768x1024 portrait + landscape).

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
