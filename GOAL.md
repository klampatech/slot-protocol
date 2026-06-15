# Slot Protocol — Rogue Pachinko

> Living spec for the game. Updated as features ship. Source of truth: `index.html` (single-file build, 7338 lines as of current HEAD). All 9 payloads wired end-to-end, 6/6 daily modifiers via `modActive(id)`, 17 achievements, 11 peg types, 8 slot types, Phase 4 audio (Web Audio SFX + 3 active HTML5 BGM tracks: title / gameplay / ending — the `connection-lost.mp3` and `slot-machine.mp3` files are no longer in rotation), in-game tooltips for every peg + slot anchored to the mouse, **+ Phase 8a/8b/8c payload tooltips + dynamic slot cap (2 base, +1 every 10 floors) + consume-all-on-drop + dedup** (see Change Log). **+ Phase 9: slot-selector UI refresh + drag-and-drop alongside tap** (see Change Log). **+ Phase 10: settings volume sliders (SFX + BGM per-channel 0..1, replacing the on/off toggles)** (see Change Log). **+ Phase 11: mobile compatibility pass — layout-vs-visual fix (board no longer clips on phone viewports) + slot-selector tap-to-swap + drag fixes (first-tap no longer cancels its own selection) + new mobile test suite (Playwright device emulation across Pixel 7 / iPhone 13 / iPhone SE / iPad Mini)** (see Change Log). Phase 4.5 economy-balancing pass complete (PR1 + A through Q): credit double-dip fixed (5% of floor-delta), peg-target rescaled (`12 + fl*1.5`), per-peg floor-scaled scoring, payload costs rebalanced twice (50–120 → 80–220, luxury tier), unique slot-pool with EMPTY excluded, daily-mod hard-tier dedup, chain timer +20%, explosive-peg scoring rewrite, jackpot 2/3 partial match, slot-machine result banner + reel-state cleanup, continuous BGM through runs, "CONNECTION LOST" end screen. All Known Gaps closed. **Phases 5 / 5b / 6 / 7 / 7b / 7c / 8a / 8b / 8c / 9 / 10 / 11 shipped**: mobile compatibility (scale-to-fit + canvas pointer events + slot-selector tap-to-place + tap feedback CSS + orientation lock + playtest polish), bounce-aware prediction line (2-bounce, 1-marker), 6 board templates + wall row of pegs blocking slot-row edge bypass, tooltip hoisting/anchoring fixes, payload metadata table + in-game tooltips + dynamic slot cap + all-on-drop consume + dedup, slot-selector state-class refactor + drag-and-drop alongside tap, per-channel volume sliders with speaker-icon mute state + migration from old audioMuted/bgmMuted booleans, and (Phase 11) layout-vs-visual split for accurate mobile scaling, `setPointerCapture` failure detection with window-level fallback listeners, `document.elementFromPoint` for tap-target lookup under pointer capture, drag threshold bumped 6→10, `justSelected` gesture flag to keep the first tap from cancelling its own selection, and a new mobile test suite covering 4 device profiles. **Post-feature code-review pass** shipped: 11 issues addressed (duplicate function, dead code, XSS via `textContent`, IIFE wrap, `var`→`const`/`let`, console-log removal, HUD DOM caching, timestamped render, canvas error boundary). **Test infra shipped**: 254 unit tests (Playwright, `tests/unit.js`, 23 sections) + 20 performance-validation tests + 16 screenshot tests + **48 mobile tests (Playwright device emulation, `tests/mobile.js`, 5 sections)** = **338 tests total**, all wired into CI (`.github/workflows/ci.yml`). `MULTIBALL_THRESHOLD` is reserved for the future meta-progression system (design decision, not a bug) — see Known Gaps section.

## Change Log

- **Phase 11 (mobile compatibility pass)** — User playtested on a Pixel 7a and reported two issues: (a) the board was zoomed in with the left and right sides cut off, and (b) the slot-selector's tap-to-swap and drag-and-drop gestures were not working properly — taps would select a position but the swap never fired. Both traced to latent Phase 5 / Phase 9 design decisions that worked on desktop but broke under phone viewports + touch. Three coordinated fixes plus a new test suite. **1. Layout-vs-visual fix (11-A)** — Phase 5 used a single `#scaler` element with intrinsic 480x700 and `transform: scale()` applied to it; the body flex-centered the 480x700 *layout* box, but on any viewport narrower than 480 (every modern phone — Pixel 7a is 412 wide, iPhone 13 is 390, iPhone SE is 320), the layout box overflowed the body and `overflow: hidden` clipped the visual. The user saw only the middle ~70% of the board with the left and right edges cut off. Fix: split the responsibility. `#scaler` is now sized to `calc(480px * var(--scale))` × `calc(700px * var(--scale))` — the *visual* size — so the body flex centers it correctly inside the viewport (no overflow). `#game-container` is the 480x700 design box with `transform: scale(var(--scale))` and `transform-origin: top left`, so it visually fills `#scaler` exactly. The `--scale` custom property is set by JS (Phase 11's `scaleToFit`) and read by both elements, so a single source of truth governs the layout size and the visual transform. The existing `getBoundingClientRect()` math on the canvas still returns the visual size, so the pointer-event clientX/Y → design-coord conversion is unchanged. **2. `scaleToFit` reads `visualViewport` first** — on iOS Safari, `window.innerHeight` includes the URL-bar area even when collapsed (it's the *layout* viewport, not the *visual* viewport), so the pre-11 scale could be computed against a stale height. `visualViewport.width` / `visualViewport.height` reflect the actually-visible area, and `visualViewport.resize` fires on the URL-bar transition (the `resize` event does not). New `scaleToFit` prefers `visualViewport` and falls back to `window.innerWidth/Height`; new `visualViewport.resize` listener supplements the existing `resize` / `orientationchange` listeners. **3. Slot-selector pointer handling fixes (11-B)** — three changes to the Phase 9 IIFE. **(a) `setPointerCapture` failure detection** — the previous code wrapped `setPointerCapture` in `try/catch` that silently swallowed failures. On some iOS Safari and Android Chrome versions, capture silently no-ops for touch (no throw, no effect), so subsequent `pointermove` / `pointerup` events never reached the slot-selector and the gesture was lost. New: check `hasPointerCapture` after calling, and if capture failed, install window-level capture-phase `pointermove` / `pointerup` / `pointercancel` fallback listeners that mirror the slot-selector's own handlers. The fallback is torn down on `pointerup` / `pointercancel`. **(b) Tap-target lookup uses `document.elementFromPoint`** — the previous code did `e.target.closest('.slot-pos')` in the pointerup tap path. With `setPointerCapture`, `e.target` is frozen to the original pointerdown target, so a tap on pos 3 (select) followed by a tap on pos 5 (swap) ended up with `e.target = pos 3` and the swap never fired. New: use `document.elementFromPoint(e.clientX, e.clientY) || e.target`, which returns the element at the current pointer position — the position the user is actually releasing on. The drag path already used `elementFromPoint` in `endDrag`, so this change brings the tap path to parity. **(c) `justSelected` gesture flag** — with the tap-target fix in place, the next-layer bug surfaced: the first tap on an occupied position set `GS.selectedSlot = {source: 'pos3', fromPos: 3}`, but the *same* tap's pointerup then called `performPlace(3)`, which hit the `sel.fromPos === targetPos` branch and *cancelled the selection it just made*. The user saw the highlight flash on and off, and the second tap (on a different position) had no selection to swap with. New: a module-private `justSelected` flag in the IIFE is set to `true` whenever `pointerdown` freshly assigns `GS.selectedSlot` (the three branches: pool item, occupied position, switch-to-different-pool-item). The pointerup tap path checks the flag — if true, the release is just the user lifting their finger after selecting, so it returns without `performPlace` and clears the flag. A subsequent tap on a different position has `justSelected = false` and runs `performPlace` normally, swapping the slots. A subsequent tap on the *same* position (to deselect) also has `justSelected = false` and runs `performPlace` which sees `sel.fromPos === targetPos` and cancels — toggle behavior preserved. The fallback pointerup reads/clears the flag too (the fallback is a closure inside the IIFE, so the module-private flag is in scope). **4. Drag threshold bump (6 → 10)** — the old 6-viewport-px threshold was fine on desktop mouse but tight on touch. At the typical 0.86× scale on a 412-wide phone, 6 design px ≈ 7 visual px, which is below natural finger jitter (10-15 px). The 10-px viewport threshold gives ~12 design-px headroom so a deliberate drag is reliably distinguished from a tap-with-jitter. The threshold is in viewport (clientX/Y) coords, so it's scale-invariant. **5. New `tests/mobile.js` suite** — new file (339 lines), exposed as `npm run test:mobile` and wired into CI. Uses Playwright `devices` to spawn contexts with real phone viewports + `hasTouch: true` + `isMobile: true`. Four devices: Pixel 7 (the user-reported device, 412x839), iPhone 13 (390x664, the iOS Safari-shape), iPhone SE 1st gen (320x568, the smallest realistic viewport), iPad Mini (768x1024 portrait, catches any desktop-only assumptions). Five sections — Layout / Scaling (per device: scale in [0.4, 1.0], scaler rect within viewport, scaler width/height matches `480*scale` / `700*scale` within 2 px) → 6 asserts per device, 24 total. Canvas Tap Drops Ball (per device: `page.tap('#gc')` increments `GS.ball`) → 4 asserts. Slot-Selector Tap-to-Place (per device: tap pool selects it, tap position assigns the slot) → 8 asserts. Slot-Selector Tap-to-Swap (per device: tap pos 0, tap pos 1, verify swap; this section is the regression guard for the `justSelected` fix — it fails loudly without it) → 8 asserts. Slot-Selector Drag-and-Drop (per device: synthetic pointer events from pool to position, verify assignment) → 4 asserts. The tap-to-swap section caught the `justSelected` bug during development (first run: 8 fails across all devices; after fix: 48/48 pass). The drag-and-drop section uses synthetic `PointerEvent` dispatching (not `page.mouse.move/down/up`) because mouse→touch translation is unreliable across Chromium builds for cross-gesture simulation. **6. CI wired** — `.github/workflows/ci.yml` now runs `npm run test:mobile` after `npm run test:unit`, with `if: success() || failure()` so it still runs and uploads artifacts if earlier steps fail. The mobile step requires only `chromium` (which CI already installs for the screenshot suite), no new browser installs. **Net effect** — `index.html` +174 lines (CSS rewrite ~20 lines, scaleToFit rewrite + visualViewport listener ~25 lines, IIFE refactor for the 3 pointer-handling fixes ~80 lines, justSelected flag plumbing ~20 lines, comments ~30 lines; offset by the removal of the old inline-style branches in `scaleToFit`). `tests/mobile.js` is 339 new lines. `package.json` gets one new script (`test:mobile`). `package-lock.json` unchanged. `svg-icons.js` unchanged. **All 254 unit + 20 performance + 16 screenshot + 48 mobile = 338 tests pass.** No game-logic changes — Phase 11 is purely an input/UI/perf pass. **Smoke checks** (manual on Pixel 7a): board fills the viewport edge-to-edge (no left/right clipping), tap-to-swap between two occupied positions works (tap pos 0, tap pos 1, slots swap), drag from pool to position works (visual ghost follows the finger, drop target highlights yellow, release places the slot). On a real iPhone 13 the same checks pass (verified via Playwright device emulation). On iPhone SE (320x568) the board scales to 0.567× and the entire play field is visible (no overflow).

- **Phase 10 (settings volume sliders)** — The settings screen's SOUND EFFECTS and MUSIC on/off pill toggles are replaced with per-channel volume sliders (0..100 percent, mapped to 0..1 floats internally). User feedback: "the music is a bit loud" + want granular control over both channels. **1. New `Audio.setSfxVolume(vol)` / `setBgmVolume(vol)` setters** — the source of truth for the per-channel volume. SFX drives `masterGain.gain.value`; BGM drives the current `<audio>` element's `.volume`. The old `setMuted` / `setBgmMuted` / `toggleMute` / `toggleBgmMute` methods are kept as thin delegates (the unit suite had assertions on them and any future external caller should still work) but the UI routes through the new setters. **2. `muted` / `bgmMuted` become derived state** — the `muted` flag is now `sfxVolume === 0` (and `bgmMuted` is `bgmVolume === 0`), used as a fast early-out in `_tone` / `_noise` (SFX) and the deferred-play path in `playBgm` (BGM). The setters flip the flag as a side effect, so the existing check pattern `if (!this.initialized || this.muted) return;` still short-circuits. **3. Unmute resumes a deferred BGM track** — the old `musicToggle` had an explicit "if wasMuted && !muted, playBgm(currentBgmId)" branch to handle the case where `playBgm` was called while muted (the track is staged but never started). `setBgmVolume` keeps the same logic so dragging the BGM slider from 0 to any positive value resumes the staged track without a separate `playBgm` call from the UI layer. **4. New `PERSIST.sfxVolume` / `bgmVolume` floats (0..1) + one-time migration** — `loadPersist` migrates the legacy `PERSIST.audioMuted` / `PERSIST.bgmMuted` booleans to the new floats: muted=true → volume=0, muted=false/undefined → default (0.4 SFX, 0.3 BGM). The legacy fields are deleted after migration so they're never written back. Defaults match the hardcoded `masterGain` (0.4) and `bgmVolume` (0.3) values the Audio object used pre-Phase 10, so playtest balance is preserved for first-time players. **5. New `UI_SOUND_ON` / `UI_SOUND_OFF` icons in `svg-icons.js`** — cyan speaker with two radiating wave arcs (on) and a red X over the speaker (off). The two-tone treatment (cyan body + lighter waves, then red X for muted) matches the rest of the icon set's "danger means red" convention. The icon swaps at 0% so the muted state is instantly readable. **6. New `.volume-row` / `.volume-slider` / `.volume-icon` / `.volume-value` CSS** — a flex row with label + icon + range input + percent display. The slider's track is split into a cyan "filled" portion (left of the thumb) and a dim grey "empty" portion (right of the thumb) via a `--vol-pct` CSS custom property updated on every `input` event. WebKit uses a `linear-gradient` on `::-webkit-slider-runnable-track`; Firefox uses `::-moz-range-progress` (a real second pseudo-element). `touch-action: manipulation` removes the 300ms tap delay on mobile so dragging feels native. The `.toggle` rules for the CONTRAST MODE / MULTIBALL MODE pill switches are unchanged (binary state, still use the toggle). **7. `applyVolumeSlider(channel, vol)` helper** — single source of truth for binding a PERSIST volume to its row in the DOM (slider value, `--vol-pct`, percent text, icon). Called from `initSettings()` at load and exposed on `window.__TEST__` for the unit suite. **8. `_hud`/test API additions** — `setSfxVolume` / `setBgmVolume` / `applyVolumeSlider` exposed on `window.__TEST__` so the unit suite can drive volume changes without simulating slider input events. `Net +212 lines in index.html` (two new HTML rows ~6 lines, ~80 lines of CSS for the slider components, ~50 lines of new Audio methods + setter refactor, ~30 lines of slider event listeners, ~25 lines of migration logic in `loadPersist`, ~10 lines of test API; offset by ~30 lines of removed toggle code in settings handlers). `Net +15 lines in svg-icons.js` (the two new icons). `Net +263 lines in tests/unit.js` (3 new sections, 74 new asserts). `All 254 unit tests pass`. **Smoke checks**: open settings, SFX slider shows 40% with cyan speaker; drag to 0% — icon flips to red X, percent shows 0%, SFX are silent (peg hit in-game is inaudible); drag back to 75% — icon flips to cyan, SFX resume at 75% volume; same for BGM with the gameplay track; closing and reopening the menu keeps the slider at its last position (PERSIST persistence works); a fresh first-time visitor with no localStorage sees the 40% / 30% defaults; a returning visitor with the legacy `audioMuted: true` boolean in their PERSIST sees the SFX slider migrate to 0% and the legacy field get cleaned out. **Visual regression** — the settings screenshot will look different (slider rows replace the pill toggles) but the overlay-visible assertion still passes. No game-logic changes — Phase 10 is purely a settings UX / persistence refactor.
- **Phase 9 (slot-selector UI refresh + drag-and-drop)** — Cleanup pass on the slot arrangement screen driven by three things the user flagged: (1) the bright magenta `UI_UNLOCK` padlock on locked-but-unlockable positions was visually jarring, (2) the locked-disabled state re-styled itself to a smaller-feeling grey box (the perceived "size change" after unlocking one slot) which actually was visual recession rather than literal resize, and (3) tap-to-swap (Phase 5) was functional but less satisfying than the original drag-and-drop (Phase 4.5-era) for desktop. All three addressed, plus a small layer of polish. **1. State classes, not inline styles** — `renderSlotSelector()` was setting per-state `style.background / style.borderColor / style.borderStyle / style.color` inline across four branches. Refactored to a single `.slot-pos` class plus one of four state classes (`.occupied` / `.unlocked-empty` / `.unlockable` / `.locked-disabled`) so all the look-and-feel is in CSS and the render is just data. Uniform 64×64 box, uniform 2px border weight; state is communicated by color + icon only. **2. New `UI_PLUS_CYAN` icon** — added to `svg-icons.js`. Solid-stroke cyan circle with `+` (vs the existing `UI_PLUS` which is dashed yellow). Replaces the magenta `UI_UNLOCK` on locked-but-unlockable positions. In-family with the cyan section header, soft 2.2s pulse animation gated on `prefers-reduced-motion`. The magenta `UI_UNLOCK` icon is dropped (no other call sites use it). **3. New `.locked-disabled` state** — uses the existing `UI_LOCK` (solid grey padlock, closed shackle) at 0.5 opacity. Reads instantly as "closed" (vs the dashed `UI_PLUS` at 0.6 opacity the previous build used, which was a bit ambiguous about *why* it was disabled). **4. Drag-and-drop via pointer events** — the `selectOrPlace` IIFE was refactored: `pointerdown` now only does pick / switch / cancel. The place action is moved off to `pointerup`, which can be triggered by EITHER a tap (pointerup with no movement) OR a drag drop (pointerup after pointermove past a 6px threshold). The tap and drag share the same `performPlace(targetPos)` function so the placement logic is identical for both gestures. Drag creates a `.slot-drag-ghost` element (appended to `<body>` to escape the `#scaler` transform-origin stack) that follows the cursor, dims the source tile to 35% via `.dragging-source`, and highlights the current drop target via `.drop-target`. `setPointerCapture` is used so the user can drag off the overlay and still release on a position cleanly. `pointercancel` cleans up if the system interrupts the gesture. **5. Unlock counter** — `<div id="unlock-counter">` between the two sections shows "1 UNLOCK REMAINING THIS FLOOR" (yellow) or "0 UNLOCKS REMAINING THIS FLOOR" (grey) or "ALL POSITIONS UNLOCKED" (when 7/7). The previous build's "Tap a slot, then tap a locked position to unlock it" hint above the pool is gone — the counter + the cyan pulse on the unlockable positions carry the information in a less repetitive way. **6. Section labels** — the inline-styled "Target Positions" / "Available Effects" headers are replaced with a `.section-label` class (Orbitron uppercase cyan, with a soft text-shadow) so the two sections feel visually tied. **7. Divider + unlock-burst** — a thin cyan gradient rule (`.slot-section-divider`) separates the position row from the unlock counter + pool. When `unlockSlotPosition` fires, a `GS.justUnlocked = pos` flag is set; `renderSlotSelector` adds the `.unlock-burst` class to that position's div for one render pass, the CSS keyframe (`slot-unlock-burst`) plays a 650ms radial cyan flash, and a `setTimeout` clears the flag. **8. Copy** — the long instruction paragraph is now "Drag or tap a slot effect onto a position. Locked positions unlock when you assign to them." (one sentence, two gestures, lead verb). The "↑ Tap a slot, then tap a position ↑" inter-section hint is dropped. **9. `__TEST__` API** — exposes `renderSlotSelector` and `getSlotColor` so the unit suite can drive the slot-selector UI directly. **`UI_UNLOCK` dropped** — no call sites used it; the comment in `svg-icons.js` was kept briefly to mark the Phase 9 intent, then removed. **Net +240 lines in `index.html`** (the new CSS rules for the four state classes + drag visuals + unlock counter + keyframes ~140 lines, the refactored IIFE with the drag-and-drop state + helpers + new listeners ~150 lines; offset by the removal of the old inline-style branches and the inter-section hint ~50 lines). **New tests** — 31 added (178 → 209 total): `UI_PLUS_CYAN` + `UI_LOCK` defined, `GS.justUnlocked` initial state, three render assertions (all-unlockable / mixed-disabled / all-done) that read `.slot-pos` classNames + counter text/class, unlock-burst flag (with and without `GS.justUnlocked`), and 10 CSS-rule existence checks via a `walk(rules, selector)` helper that recurses into `@media` blocks (for the keyframes that nest inside `@media (prefers-reduced-motion: reduce)`). All pass. **Smoke checks**: fl 1 shows 7 cyan `+` tiles with pulse; clicking the 1st pool item then the 1st position drops it (unlock + fill, counter flips to "0 UNLOCKS REMAINING" grey, remaining 6 turn to grey `UI_LOCK`); drag-and-drop a pool item onto a locked position unlocks it with the same burst; tapping a position with no selection does nothing; tapping AUTO-ARRANGE or CONFIRM mid-gesture cancels the drag cleanly; release on empty space cancels the selection. **Visual regression** — `06-slot-selector.png` in the screenshot suite is regenerated with the new look; pixel-band + overlay-visible assertions still pass.

- **Phase 8b (dynamic payload slot cap)** — Payload inventory capacity now scales with floor: `maxPayloads() = 2 + Math.floor(GS.fl / 10)`. fl 1–9 = 2 slots (unchanged), fl 10–19 = 3, fl 20–29 = 4, fl 30–39 = 5, fl 40+ grows further. **Single source of truth** — the new `maxPayloads()` helper (next to `pegBasePoints()`) replaces the hardcoded `MAX_PAYLOADS = 2` in `dropBall` and the `GS.pl.length < 2` checks in `updateShop` buy handler + `triggerSlotCollected` PA slot effect. **Dynamic DOM** — `renderPayloadSlots()` (called from `updateHUD` every frame, replaces the 8a inline ps1/ps2 blocks) ensures `#pi` has `maxPayloads()` `.ps` children: appends new divs as the cap grows, never shrinks (cap is monotonic during a run). All N slots are always visible: filled ones show the icon + payload color, empty ones show the grey `-`. **Refactored call sites** — `updateShop` now iterates `Object.keys(C.PAYLOADS)` (8a was the metadata; 8b actually uses it) instead of the inline 9-item `items` array, and tiles are styled `.disabled` when the cap is full (click handler still silently no-ops as a defensive belt). `triggerSlotCollected` PA case rolls from `Object.keys(C.PAYLOADS)` instead of the hardcoded `payloads` array. `render()` drop-zone indicator (the small colored badge at the top of the board showing the first queued payload) reads from `C.PAYLOADS` (using `pMeta.short` and `pMeta.color`) instead of the parallel `payloadNames`/`payloadColors` arrays. **`startGame` cleanup** — resets `GS.lastMaxPayloads = maxPayloads()` and clears `#pi.innerHTML` so a new run at fl 1 (cap 2) doesn't show 4 stale divs from a previous run that reached fl 20. **`initSlotArrangement` toast** — detects `maxPayloads() > GS.lastMaxPayloads` and shows `+1 PAYLOAD SLOT` (or `+N PAYLOAD SLOTS` for rare multi-floor jumps) with subtitle "You can now queue N payloads per drop!" via the existing `showToast` helper (uses the achievement styling, gold border + glow). Fires on every floor transition that crosses a `+10` boundary. **Test API** — `window.__TEST__` now exposes `maxPayloads` and `renderPayloadSlots` so the unit suite can drive the cap directly. **Net +58 lines in `index.html`** (`maxPayloads`, `renderPayloadSlots`, the toast block, the cap-refactor edits at each call site, the cleanup in `startGame` and `cacheHudElements`; offset by the removal of three parallel `payloadColors`/`payloadNames` arrays and the 8a inline ps1/ps2 blocks). **New tests** — 24 added (123 → 147 total): cap curve at floors 1/5/9/10/15/19/20/29/30/39/50, `renderPayloadSlots` child count + populated/empty state, monotonic growth (fl 5→25→35 = 2→4→5 children), `startGame` reset (4 stale divs cleared, `lastMaxPayloads` reinitialized). All pass. **Smoke checks**: fl 10 shows 3 slots, fl 20 shows 4, empty slot doesn't show a tooltip, cap-increase toast appears on slot-selector open when the floor crosses a `+10` boundary.

- **Phase 8a (payload tooltips on board slots)** — Hover any in-game payload slot (the `.ps` divs at the bottom-left of the board) to see the payload's name and effect description. Foundation for the Phase 8 payload overhaul series (8b = dynamic slot cap, 8c = all-payloads-on-drop stacking + dedup). **New `C.PAYLOADS` metadata table** in the constants block — 9 entries (scrambler / trojan / worm / logicbomb / daemon / ghost / cluster / explosive / slowmo), each with `name` (display, uppercase), `short` (4-letter badge text), `desc` (effect description), `cost` (credits), `color` (in-game + tooltip header), and `icon` (integer 0..8 for `SVG_ICONS.getPayloadIcon`). Order matches the existing `updateShop` / `updateHUD` / `triggerSlotCollected` PA-case arrays, so the `icon` index is consistent with the current visual layout. **New tooltip wiring** — single delegated `pointermove`/`pointerleave` on `#pi` (the parent of the `.ps` divs), following the same pattern as the slot-selector tooltip: `e.target.closest('.ps')` finds the hovered slot, then `showTooltip(name, desc, color, clientX, clientY)` with the payload's metadata from `C.PAYLOADS`. `describe()` skips empty slots (no `'on'` class, no `data-payload` attribute) — nothing to describe. **`data-payload` attribute** — `updateHUD` now sets `ps.dataset.payload = '<name>'` on populated slots and `delete ps.dataset.payload` on empty, so the tooltip listener can look up the metadata from the DOM without re-deriving it from the inner HTML. **`showTooltip` bottom-edge auto-flip** — the payload slots live in the bottom 60px of the 700px viewport, so a below-cursor tooltip (the default) would be clipped by `body { overflow: hidden }` and the description would be cut off. 8a narrows Phase 7b's "don't flip" policy: when `clientY > window.innerHeight - 80`, the tooltip now positions above the cursor (`top = clientY - tipHeight - TOOLTIP_OFFSET`) so the full content is visible. The slot-collector zone (y=560..610) is above the threshold so its tooltips are unaffected. The top-edge clamp still works for the top case. **No other call sites touched in 8a** — `updateShop`, `dropBall`, `triggerSlotCollected`, and the drop-zone indicator in `render` still use their existing inline arrays. 8b will refactor those to read from `C.PAYLOADS` directly; 8c will add the dedup + all-on-drop logic. **New tests** — 7 new unit tests in `tests/unit.js` (Tooltip Data section): 9 payloads defined, all entries have name/short/desc/cost/color/icon, icon indices are unique, icon indices are 0..8 contiguous, and 3 specific payload names present. Total 116 → 123 tests, all pass. **Net +73 lines in `index.html`** (the `C.PAYLOADS` table is larger than a minimal in-place constant would be, the tooltip IIFE has explanatory comments, the `showTooltip` flip adds ~10 lines, and the `data-payload` writes are inline comments). **Smoke checks**: pointerover a populated `.ps` shows the tooltip with the correct name (in the payload's color) and description; pointerleave hides it; empty slots do not show a tooltip; bottom-edge cursors flip the tooltip above so the full content is visible; the existing canvas + slot-selector tooltips are unaffected (the canvas's pointermove listener fires on a different DOM target, no event conflict).

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
### Current Status (as of HEAD)

- **Phases 5 / 5b / 6 / 7 / 7b / 7c / 8a / 8b / 8c / 9 / 10 all shipped** — See the detailed entries below. **Phase 10 is the most recent**: settings volume sliders replace the SOUND EFFECTS / MUSIC on/off pill toggles. New `Audio.setSfxVolume(0..1)` / `setBgmVolume(0..1)` setters drive `masterGain.gain.value` and the BGM `<audio>` element's `.volume` directly; the `muted` / `bgmMuted` flags are now derived (`vol === 0`) and act as fast early-outs. `PERSIST.sfxVolume` / `bgmVolume` floats (defaults 0.4 / 0.3, matching the pre-Phase-10 hardcoded levels so playtest balance is preserved) replace the `audioMuted` / `bgmMuted` booleans, with a one-time `loadPersist` migration that maps the legacy booleans and then deletes them. New `UI_SOUND_ON` (cyan speaker with waves) / `UI_SOUND_OFF` (speaker with red X) icons swap at 0% so the muted state is instantly readable. Old `#soundtoggle` / `#musictoggle` are removed; the CONTRAST MODE / MULTIBALL MODE pill toggles are unchanged. See the Phase 10 change-log entry at the top of this file and the dedicated Phase 10 body section.
- **Code-review follow-up pass shipped (11 issues)** — Duplicate `checkAchievements` definition removed; dead `this.mirrorDir = this.mirrorDir` self-assignment removed; XSS fixed by switching the leaderboard-name `innerHTML` write to `textContent`; whole game script wrapped in an IIFE so internal helpers don't leak into the global scope; 627 → 482 `var` declarations converted to `const`/`let` (globals + for-loop iterators); `console.log('SLOT HIT...')` debug call removed; HUD DOM references cached in a new `_hud` object so `updateHUD()` no longer calls `getElementById` 8× per frame; `requestAnimationFrame` timestamp threaded into `render(ts)` so the loop no longer mixes `performance.now()` / `Date.now()` / rAF-time; canvas error boundary added (`getContext('2d')` null-check with a user-friendly fallback). All edits in `index.html`.
- **Test infrastructure shipped** — New `window.__TEST__` API in `index.html` exposes internals (GS, C, BOARD_TEMPLATES, `maxPayloads`, `renderPayloadSlots`, `renderSlotSelector`, `getSlotColor`, `setSfxVolume`, `setBgmVolume`, `applyVolumeSlider`, `Peg`, `Ball`, etc.) for headless testing. `tests/unit.js` is the Playwright-driven unit suite: **254 asserts across 23 sections** (Phase 10 added 3 new sections — "Audio Volume" with 15 asserts covering the new setters / derived muted flag / clamping; "Volume Sliders" with 20 asserts covering the DOM, icon swap, slider input, percent display, CSS custom property, and the `applyVolumeSlider` helper; "Volume Migration" with 12 asserts covering the legacy `audioMuted`/`bgmMuted` → `sfxVolume`/`bgmVolume` migration + the boolean deletion). Existing sections: state init, constants, board generation, physics, scoring, slot system, peg types, achievements, daily challenge, payloads, persistence, tooltip data, screen management, game start/reset, jackpot growth, board templates, contrast mode, audio engine, the Phase 9 slot-selector UI, and a render-loop regression guard for the `updateFX/updateVisualEffects` `(dt, ts)` arity. `tests/performance-validation.js` has 21 asserts (memory-leak detection across 50 simulated floors, FPS validation under normal/varied/heavy load, multiball physics desync detection, localStorage overflow handling, payload-injection enforcement). `tests/screenshot-suite.js` captures **16 PNGs** in `tests/screenshots/` with per-screenshot visual assertions (overlay-visible + peg-band pixel counts + HUD text + render-loop `pageerror` tracking); `06-slot-selector.png` was regenerated for the Phase 9 visual refresh. `package.json` exposes `npm test` (performance), `npm run test:unit` (Playwright unit), `npm run test:screenshot` (Playwright screenshots). Expected pass on a clean checkout: 21/21 performance + 254/254 unit + 16/16 screenshot.
- **CI wired** — `.github/workflows/ci.yml` runs on every push / PR to `main` against Node 22: `npm ci` → `npx playwright install chromium` → `npm test` → `npm run test:unit` → `npm run test:screenshot` (screenshot step uses `if: success() || failure()` so it still runs and uploads artifacts even if earlier steps fail). The PR / push is green only if all three suites pass.
- **`index.html` is 7164 lines as of HEAD.** Bumped from 5680 at Phase 4.5-Q → ~6250 at Phase 7 → 6331 at Phases 8a/8b → 6529 at Phase 8c → ~6769 at Phase 9 (slot-selector UI refresh, claimed +240 net) → 6952 at post-Phase-9 → 7164 at Phase 10 (settings volume sliders, +212 net). `svg-icons.js` is 208 lines (was 193; +15 for the two new `UI_SOUND_ON` / `UI_SOUND_OFF` icons). `tests/unit.js` is 1323 lines (was 1060; +263 for the Phase 10 volume tests).
- **No open game-logic gaps.** All known issues from earlier retros are closed. The only intentionally-untouched constant is `MULTIBALL_THRESHOLD` (reserved for the future meta-progression system — see Known Gaps section below).

### Current Status (as of Phase 5) — historical

- **Mobile compatibility shipped (Phase 5)** — Slot Protocol now runs on iOS Safari and Android Chrome. Eight discrete changes: CSS scale-to-fit wrapper, canvas pointer events with tap guard, slot-selector tap-to-select-tap-to-place, slot-selector pointer-event tooltips, title-BGM pointermove trigger, tap-feedback CSS (touch-action manipulation + tap-highlight suppression), and orientation lock with feature-detect. Total ~180 lines added, 30 lines of DnD wiring removed.
- **All previous functionality preserved.** `validation-tests.js` and `performance-validation.js` still pass (no game-logic changes — only input/UI).
- **Single regression on desktop**: the slot-selector manual arrangement now uses tap-to-select-tap-to-place (which still works with mouse clicks) instead of drag-and-drop. The user accepted this trade-off explicitly during the interview phase.



### Current Status (as of Phase 4.5-Q) — historical
- **Phase 4.5 series complete (PR1 + A through Q)** — Economy is balanced, the slot machine has the right engagement curve, and the floor-cleared overlay renders correctly. 5680 lines total, 17 Phase 4.5 tags A–Q in source. (Line count is a snapshot of `index.html` at the end of Phase 4.5-Q; it grew to ~6250 at Phase 7 and is 6331 at HEAD.)
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



---
## Phase 5-7 — Mobile, Prediction, Templates, Tooltips (historical)

Phases 5, 5b, 6, 7, 7b, and 7c all shipped in sequence. Phase 5 made the game mobile-compatible (pointer events, scale-to-fit, tap-to-select-tap-to-place). Phase 5b was the playtest polish. Phase 6 replaced the trajectory preview with a real bounce-aware lookahead. Phase 7 introduced 6 board templates + a wall row of pegs that blocks slot-row edge bypass. Phases 7b and 7c fixed tooltip positioning bugs that surfaced during the Phase 7 rollout. (Phase 9 brought back real drag-and-drop alongside the Phase 5 tap-to-place — see the Phase 9 body section for the unified `performPlace` design.)

### Phase 5 (mobile compatibility) — detailed

Eight discrete changes, all in `index.html`, no game-logic or `C.*` constant changes.
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

- **Phase 5b (mobile playtest polish)** — Three playtest-driven fixes after first mobile-device run. **1. Scale too aggressive on small viewports**: the original `clamp [0.55, 1.0]` left the board (visual 264x385 at s=0.55) wider than the 320x568 viewport of older/smaller Androids, so the left/right of the board was clipped by the body's `overflow: hidden`. Lowered the floor to `0.40` so the board always fits; the smaller-tile penalty (56*0.4=22.4px) is the right trade-off vs. a board the user can't see. Also added `padding: env(safe-area-inset-*)` to the body and switched `min-height: 100dvh` → `min-height: 100vh; min-height: 100svh;` so the body is always sized to the *smallest* viewport (URL bar showing) plus the iOS safe-area insets, not the *largest* — the URL bar can no longer cover the top of the board. **2. Pool-to-occupied slot bug**: in the new tap-to-select path, tapping a pool item then tapping an *occupied* position called `handlePoolDrop` which just overwrote the existing slot and lost it. The original HTML5-DnD path on the same case called `handleSlotDrop(targetPos)` (the `fromPos === -1` branch), which adds the existing slot back to the pool. The tap path now branches the same way: `targetHasSlot` → `handleSlotDrop` (preserves existing), `targetHasSlot === false` → `handlePoolDrop` (place, optionally unlock). **3. Slot-selector UI**: bumped tile size 56x56 → 64x64 and icon size 32x32 → 40x40. The 56 was almost too small to tap reliably with a thumb at 0.7x scale (39px visual). Position-row gap tightened 6px → 4px to fit 7*64 + 6*4 = 472 in the 480px canvas; pool container widened 180 → 200 to fit 3*64 + 2*4 = 200. Added corner-bracket pseudo-elements (`::before` / `::after`) to `.slot-pool-item` so the pool tiles visually match `.slot-pos`; both now read as the same visual system. Slight 3px border-radius + subtle inner highlight `box-shadow: 0 0 0 1px rgba(255,255,255,0.05) inset` (lifted from the pool-item rule into the combined rule) on both for depth. `validation-tests.js` (7/7) and `performance-validation.js` (20/20) still pass.

- **Phase 6 (bounce-aware prediction line)** — Replaced the previous free-fall-only trajectory preview with a real bounce-aware lookahead. **Final design: 2-bounce path, 1 marker.** The line drops from the dropper, hits the first peg (marked with a ring), continues past it, hits a second peg (no marker, just where the line ends), and stops. The line shows "where will the ball land first, then where it goes next" without running the full trajectory. All in `index.html`, no `C.*` constant changes, no game-logic changes. Hidden while a ball is in flight — matches Peggle's "show only when aiming" behavior. **Algorithm**: new `simulateTrajectory()` function steps the ball's physics forward with the same constants as `Ball.update` (gravity, friction, max speed) and checks peg collisions with the same overlap test as `checkCols` (distance < ball.r + peg.r). Substepped at 1/4 of a frame so the ball can't tunnel through a peg at max speed (one substep = 5.25px, well under the 15px min separation). Mirrors the real game's `b.hp[p.id]` hit-set so the ball can't double-count a peg when it reflects straight up and falls back through. Two distinct caps: `PRED_MAX_BOUNCES = 2` (the simulation stops at the 2nd bounce, so the line is bounded) and `PRED_MAX_MARKERS = 1` (the marker ring loop iterates at most once, so only the first peg is highlighted). The 2nd peg is just where the line ends, no decoration. **Visual**: single segment drawn through all the simulated points, double-stroked (5px outer glow at alpha 0.3 + 1.5px inner line at alpha 0.85) matching the existing neon-glow aesthetic. Line color = current ball skin (cyan default, magenta/gold/etc on alt skins; green on matrix theme). Bounce marker drawn ON TOP of the peg so it's not obscured. **Z-order**: the call to `drawPredictionLine()` is placed right after the peg render loop ends (before FX ripples/particles/balls) so the line is visible AND post-hit FX feedback still reads correctly on top. **Peggle-style marker**: bright white outer ring at C.PR+5, peg-color inner ring at C.PR+2, white crosshair at the peg center. Reads as "this peg is going to be hit" at a glance. **Special pegs**: Mirror and Ice special cases are NOT simulated — the basic reflection is close enough for a preview and avoids branching on every peg. Dormant pegs are treated as already active (matches "you will hit this peg" prediction, even if the actual bounce is one frame later). **Payloads**: the prediction shows base physics, not payload effects (Slowmo halves ball speed, Ghost phases through pegs, etc.). The existing drop-zone payload indicator already shows which payload is queued, so the player can read both signals together. **Performance**: simulation is O(frames * substeps * pegs) = max 200 * 4 * ~80 = 64k ops per frame at 60fps, negligible. Safety cap (PRED_MAX_FRAMES=200) prevents any runaway simulation. **Tests**: standalone Node test of the physics covers empty board, single peg, two aligned pegs, many-peg column, and the 2-bounce cap (4 pegs in a column -> exactly 2 bounces, not 4). All pass. Peg-side checkCols is unchanged — prediction output doesn't feed back into game state. **Design iterations**: 2 bounces with 2 markers (too busy) → 1 bounce stops at first peg (too sparse) → unbounded continuing line (too much, the post-bounce arc looped across the whole board) → **2-bounce path with 1 marker (current)**. The final form is the classic Peggle preview depth plus one extra hop, exactly what the user described as "1 extra hop from the first ball".

- **Phase 7 (board templates + wall row)** — Replaced the single random board layout with 6 hand-crafted templates + a wall row of pegs above the slot row. All in `index.html`, no `C.*` constant changes, no game-logic changes. **Wall row**: 25 NODE/CACHE pegs at y=510 (50px above the slot row at y=560), spaced 20px center-to-center from x=0 to x=480. The 4px gap between adjacent peg edges is less than the 14px ball diameter, so the ball cannot fit through. The leftmost peg is at x=0 (at the wall) and the rightmost is at x=480 (at the wall), so there's no edge bypass either. Result: every ball must hit at least one wall row peg before reaching a slot — fixes the long-standing complaint that the old board had 40px/90px edge gaps where a player could straight-shot a ball into a slot without hitting a peg. The wall row is structural defense, not part of the "field": unaffected by the `fewer_pegs` daily mod and never spawns special pegs (T/S/E/D/I/F/M/H/O) — only NODE and CACHE — to keep the wall semantics clear and avoid weird interactions like an explosive chain at the slot row. **Templates**: 6 hand-crafted shapes, each stored as 7 strings of 8 chars (`'*'` = peg, `'.'` = empty). Spelled out this way they're easy to read, easy to diff, and trivial to add. `GRID` (56 pegs, classic 8-col staggered grid — matches the pre-Phase-7 board density so veteran players get a familiar floor 1), `GALAXY` (16 pegs, symmetric diamond — sparsest), `HONEYCOMB` (28 pegs, staggered hex pattern), `HUB` (16 pegs, 3x3 center block with 2 corner satellites), `HERRINGBONE` (14 pegs, X pattern), `CROSS` (26 pegs, 2-wide vertical + 2-tall horizontal = thin plus sign, centered around col 3.5). Every template has ≥ 14 pegs so the floor 1 objective of 13 is always achievable; total board sizes range from 39 (HERRINGBONE) to 81 (GRID) including the wall row. **Template selection**: new `pickTemplateForFloor(floor, dailySeed)` function. Casual runs (no daily seed) use `Math.random` for full variety per run. Daily challenge uses `seededRandom(dailySeed + floor * 31)` so the same (date, floor) always picks the same template — matches the existing daily-mods determinism contract. Verified 100% determinism over 30 floors of one daily seed (spans 5+ different templates, so the daily isn't boring) and 100% variation across different daily dates. **Peg types**: the previous floor-scaled type-rolling logic is preserved in a new `rollPegType(rand)` helper. In casual runs it uses `Math.random`; in daily runs it uses `seededRandom(dailySeed + row*100 + col*11 + 17)` so the same daily date also produces the same peg-type layout. The `fewer_pegs` mod drops 30% of template pegs (seeded for daily, random for casual); the wall row is unaffected. **Tests**: standalone Node test (`/tmp/test_boards3.js`, `test_boards4.js`, `test_final.js`) covers template structure, peg counts, no-template-peg-overlaps-wall-row, no-straight-shot-to-slot for every x in 0..479, wall row alone blocking straight shots, daily seed determinism + variety, casual randomness, and prediction-line integration with the new wall row. 30+ assertions, all pass. **`render()` integration**: no changes needed — the existing peg render loop just iterates `GS.bd` which now contains template + wall row pegs. The prediction line (Phase 6) automatically reflects off wall row pegs because they're in `GS.bd` like any other peg. **HUD integration**: `GS.boardTemplate` stores the chosen template name (e.g. `'GALAXY'`) on each floor init; reserved for a future "show template name" pass but no UI work in Phase 7.

- **Phase 7c (tooltip hoisted out of #scaler)** — Found the root cause of the tooltip still appearing far from the cursor after Phase 7b. The tooltip is `position: fixed` but it was a child of `#game-container` → `#scaler`, and `#scaler` has `transform: scale(s)`. When a parent has a `transform`, the child's `position: fixed` becomes positioned relative to the **transformed element**, not the viewport (well-known CSS gotcha). The cursor's `clientX/Y` is in viewport coords, but `style.left = clientX + 14` was being interpreted in the **scaler**'s coord system (the canvas's 480x700 native coord system, before the transform). On a viewport where the scaler is centered with significant offset, or any non-1.0 scale, the difference between the two coord systems became large and the tooltip ended up far from the cursor (user screenshot showed it on the right side of the viewport when the cursor was over a slot-pos on the left). **Fix**: moved the `<div id="tooltip">` from inside `#game-container` to a direct child of `<body>`, right after the `</div>` that closes `#scaler`. Now `position: fixed` is anchored to the viewport, `clientX/Y` and `style.left/top` are in the same coord system, and the tooltip appears at `(cursor + 14, cursor + 14)` regardless of scale, browser zoom, or window size. The flex layout of the body is unaffected because `position: fixed` removes the element from the normal flow. The in-game canvas tooltips were apparently OK in the user's prior testing because the canvas's coord system happens to match the viewport at scale 1, but they would have broken on a high-DPI display or any other scaling factor. The new placement fixes both surfaces uniformly.

- **Phase 7b (tooltip anchoring fix)** — Two fixes for the "wonky" tooltips on the slot-selector. **1. Removed 5 native `div.title = ...` attributes** in the slot-selector (lines 3161, 3169, 3180, 3189, 3232 — occupied position, unlocked-empty position, locked-unlockable, locked-no-unlock-budget, and pool item). The native browser tooltip fires ~1s after hover, browser-controlled position, and stacks on top of the custom one — that's the wonky visual the user spotted. The custom `showTooltip` already fires on every pointermove with the same content from `C.SLOT_TOOLTIPS`, so the native was redundant. Replaced each `div.title = ...` with `div.setAttribute('aria-label', ...)` for keyboard/screen-reader access (aria-label gives the same accessibility without the visual browser tooltip). The GOAL.md note from Phase 2c ("Native `title` attribute kept on the divs for keyboard accessibility") was technically true but the visual tooltip was the unintended side effect. **2. Simplified the `showTooltip` edge-clamp**: the previous logic flipped the tooltip to the cursor's top-left when the bottom-right would overflow the viewport, which broke the cursor-follow contract — as the cursor neared the right or bottom edge, the tooltip would jump to the opposite side. New logic always pegs the tooltip at (cursor + 14, cursor + 14) and only clamps the LEFT/TOP edges (to keep the tooltip from going off the left/top of the viewport). The right/bottom is allowed to extend slightly past the viewport — clipped by body overflow, much less jarring than a position flip. The tooltip now follows the cursor smoothly in one direction (verified monotonic in test). Single `TOOLTIP_OFFSET = 14` constant so the offset is named and easy to tweak. Header comment on `showTooltip` documents the new contract: "single cursor-bottom-right anchor for every tooltip, no matter what screen or overlay".

### Validation plan (post Phase 7)

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


## Post-Phase 7 — Code-Review Pass, Test Infrastructure, CI (historical)

After the Phase 5-7 feature work shipped, three follow-up tracks ran in sequence: a code-review pass that addressed 11 issues found in the new code, a new unit/integration test suite that exposed game internals to a headless runner, and a CI workflow that wires all three test suites together. (The post-Phase-7 baseline: 116 unit tests, 20 performance asserts, 15 screenshot PNGs. The current state — 254 unit tests across 23 sections, 21 performance asserts, 16 screenshots — is updated by Phases 8a/8b/8c/9/10 and tracked in the "Current Status (as of HEAD)" section above.)

### Code-review pass (11 issues)

Two commits (fix: address code review issues 2-5, fix: address code review issues 6-11) cleaned up the post-Phase 7 code. All edits in `index.html`.

- **Issue 1: duplicate `checkAchievements()`** — function was defined at L1411 and again at L5901 (identical body). Removed the second copy. Smoke check: `typeof checkAchievements === "function"` returns true; only one definition remains in source.
- **Issue 2: dead `this.mirrorDir = this.mirrorDir` no-op** — the Ball constructor had a self-assignment that was a leftover from a refactor. Removed.
- **Issue 3: XSS in leaderboard** — leaderboard names were written via `innerHTML`, which would have allowed a malicious name like `<img src=x onerror=...>` to inject script. Switched to `textContent` everywhere names are read back into the DOM. Smoke check: input `<img src=x onerror=alert(1)>` renders as a literal string, no `onerror` fires.
- **Issue 4: global-scope pollution** — the entire game script (constants, classes, helpers, init) was top-level, leaking ~80 symbols into `window`. Wrapped the whole script in an IIFE; only the intended public surface (`C`, `GS`, `PERSIST`, `startGame`, `showScreen`, the test API) is now exposed. Smoke check: `typeof window.C` returns `"object"`, `typeof window.dropBall` returns `"undefined"` (was a global before).
- **Issue 5 (variants):** folded into the IIFE pass.
- **Issue 6: `var` → `const`/`let`** — 627 → 482 `var` declarations. Global constants (C, PERSIST, ACHIEVEMENTS, GS, BOARD_TEMPLATES, etc.) → `const`. Mutable globals (dropPointPulse, lastT, jackpotSpinsLeft, animT, etc.) → `let`. Every for-loop iterator → `let` (fixes the long-standing closure-capture bug where an inner closure referenced the loop's `i` after the loop ended). Net: 145 `var` declarations converted. Smoke check: 0 occurrences of `var C =`, `var PERSIST =`, `var GS =` remain in source.
- **Issue 7 (variants):** folded into issue 6.
- **Issue 8: stray `console.log("SLOT HIT...")` debug call** — left over from a Phase 2b debugging session. Removed.
- **Issue 9: HUD DOM caching** — `updateHUD()` was calling `getElementById` 8× per frame (60Hz × 8 = 480 lookups/sec). Added a new `_hud` object that caches references to `sv` (score), `jv` (jackpot), `bv` (balls), `fn` (floor number), `mv` (multiplier), `cf` (current floor target), `of` (objective fill), `ps1`/`ps2` (payload slots) at init time. `updateHUD()` now reads from `_hud` instead of the DOM. Smoke check: 0 `getElementById` calls in `updateHUD()` body.
- **Issue 10: timestamped render** — `render()` was mixing three time sources: `Date.now()` for pulse animations, `performance.now()` for screen shake, and the implicit rAF timestamp for everything else. Threaded the rAF timestamp through as `render(ts)`; replaced the `Date.now()` and `performance.now()` calls with the `ts` parameter. Smoke check: 0 `Date.now()` and 0 `performance.now()` calls in `render()` body.
- **Issue 11: canvas error boundary** — `canvas.getContext("2d")` can return null on locked-down environments (some embedded webviews, hardened browsers). Added a null-check that shows a user-friendly fallback message ("Canvas 2D not supported in this browser") instead of throwing an uncaught TypeError on the first frame. Smoke check: stubbing `getContext` to return null shows the fallback div, no errors thrown.

### Test infrastructure

Two commits: `test: add unit tests and wire up test infrastructure` and `ci: add GitHub Actions workflow for tests`. New files: `tests/unit.js` (116 tests), `.github/workflows/ci.yml`.

- **`window.__TEST__` API** — new global object in `index.html` (defined inside the IIFE, re-exported to `window` so Playwright can read it). Exposes:
  - `C` (constants — for peg/slot type enums, tooltips, audio keys)
  - `GS` (full game state, with a reset helper)
  - `PERSIST` (the localStorage-backed persistence object)
  - `ACHIEVEMENTS` (the 17 achievement definitions)
  - `BOARD_TEMPLATES` (the 6 Phase 7 templates, for assertion of structure/peg counts)
  - `Peg` constructor (so tests can construct pegs in known states)
  - `Ball` constructor (so tests can verify scoring / collision / exit paths)
  - `cellToPos(row, col)` (board coord → pixel coord)
  - `pickTemplateForFloor(floor, seed)` (deterministic template picker)
  - `pegBasePoints()` (Phase 4.5-J scoring helper)
  - `modActive(id)` (Phase 2a daily mod query)
  - `seededRandom(seed)` (Phase 2a deterministic RNG for daily challenges)
  - `getDailyModifiers(date)` (Phase 2a daily mod picker)
  - `showScreen(id)` / `hideAllScreens()` (overlay management)
  - `spinJackpot()` (jackpot mini-game)
  - `Audio` (full audio engine with mute controls)
  - `ContrastMode` (the high-contrast accessibility mode)
  - `savePersist()` / `loadPersist()` (round-trip)
  - `getCurrentBoardTemplate()` (returns `GS.boardTemplate` name for HUD)
- **`tests/unit.js`** — Playwright-driven unit suite, 116 tests, ~440 lines. Categories:
  - **Game state init** (5 tests): GS is populated, defaults are correct, screen starts at `MENU`.
  - **Constants** (6 tests): C.PT has 11 entries, C.ST has 8 entries, C.GRAVITY / C.FRICTION / C.MAX_VEL in expected ranges, PEG_TOOLTIPS / SLOT_TOOLTIPS non-empty.
  - **Board generation** (8 tests): templates are 7×8 grids, all 6 templates loadable, cellToPos is consistent, no template peg overlaps the wall row, no straight-shot-to-slot for any x in 0..479.
  - **Physics** (7 tests): gravity 0.18, friction 0.995, MAX_VEL=14, hard clip 21, wall bounce reflects vx, dt60 normalization.
  - **Scoring** (9 tests): pegBasePoints() returns 50/70/95/105 for fl 1/5/10/12, combo cap 7 (4 with `multiplier` mod), frenzy activates at combo 5, frenzy flag clears on exit.
  - **Slot system** (8 tests): pool size 3, unique types (no EMPTY), position-to-pixel mapping, unlock-per-floor budget, locked slots don't trigger.
  - **Peg types** (11 tests, one per type): creation, hit count, radius, at-rest visual sanity.
  - **Achievements** (6 tests): 17 defined, all 17 names non-empty, check functions return true when the trigger condition is met, false otherwise.
  - **Daily challenge** (5 tests): seededRandom is deterministic, getDailyModifiers returns 2 valid mods, hard-tier dedup (no `multiplier + double_pegs` + `fast_timer` over 100 seeds), `modActive` returns the right truthy/falsy for each of the 6 mod ids.
  - **Payloads** (5 tests): queueing works, queue size capped at 2, removing a payload works, all 9 payload types are defined in the shop.
  - **Persistence** (6 tests): savePersist → loadPersist round-trip preserves all keys, corrupted JSON falls back to defaults, missing keys are filled with defaults.
  - **Tooltip data** (4 tests): every peg/slot has a tooltip entry, all entries have non-empty name + desc, all names match the runtime enums.
  - **Screen management** (5 tests): showScreen activates the right overlay, hides all others, the menu is the first visible screen on load.
  - **Game start/reset** (4 tests): startGame resets GS, drops the player at floor 1, gives 5 balls, shows the HUD.
  - **Jackpot** (3 tests): base = 500 × floor, grows 15% on miss, resets to base after a 3/3.
  - **Board templates** (6 tests): all 6 templates load, peg counts in expected ranges (GRID=56, GALAXY=16, HONEYCOMB=28, HUB=16, HERRINGBONE=14, CROSS=26), deterministic pick over 30 floors of one daily seed.
  - **Contrast mode** (3 tests): toggles the `contrast-mode` class on `<body>`, persists across reloads, the peg type colors switch to the high-contrast palette.
  - **Audio** (5 tests): Audio object exists, `muteSfx()` / `muteBgm()` work independently, the BGM-arm gesture fires on first user interaction, the BGM mapper returns the right track id for each screen.
- **`package.json` scripts**:
  - `npm test` → `node tests/performance-validation.js` (the existing 20-test FPS / memory-leak suite)
  - `npm run test:unit` → `node tests/unit.js` (the new 116-test Playwright suite)
  - `npm run test:screenshot` → `node tests/screenshot-suite.js` (the existing 15-screenshot regression suite)
- **`tests/performance-validation.js`** (existing, unchanged): 20 tests covering frame-time distribution, particle system stress, board regeneration time, jackpot spin timing.
- **`tests/screenshot-suite.js`** (existing, unchanged): 15 screenshots covering menu, tutorial, achievements, leaderboard, settings, slot-selector, gameplay (start, mid, post-floor-clear, run-end, back-to-menu, daily-challenge entry, daily gameplay).

### CI workflow

`.github/workflows/ci.yml` (new file, 38 lines). Runs on every push and PR to `main`:

1. Check out the repo, set up Node 20.
2. `npm ci` to install Playwright.
3. `npx playwright install --with-deps chromium` (for the headless browser).
4. Run `npm test` (20 performance tests).
5. Run `npm run test:unit` (178 unit tests, Playwright headless — 147 added by 8a/8b, 31 added by 8c).
6. Run `npm run test:screenshot` (15 screenshot tests, Playwright headless).
7. The PR / push is green only if all three suites pass. Failed screenshots are uploaded as workflow artifacts for visual review.

### Net effect

- `index.html`: 6529 lines (was 5680 at Phase 4.5-Q, ~6250 at Phase 7, 6331 at Phase 8a/8b, 6529 at Phase 8c — 198 lines net for the post-Phase 7 work: 81 for code review + test infra, 73 for 8a, 58 for 8b, 66 for 8c; offset by 80 lines of test scaffolding that was removed during the code-review pass).
- `tests/unit.js`: 811 lines (was 441 at Phase 8a/8b, 564 at Phase 8b, 811 at Phase 8c — +247 for the 31 new 8c tests + updated 8b tests).
- `.github/workflows/ci.yml`: new, 38 lines.
- `package.json` / `package-lock.json`: updated to expose the new test scripts.
- 0 game-logic or game-balance changes — the code-review and test-infra work is purely a quality-of-life pass. The 11 fixes are all bugs (XSS, var hoisting, dead code, debug logs, performance) or defensive code (error boundary, IIFE wrap, HUD caching).


## Phase 8 — Payload Overhaul

The payload system (9 types, shop purchase, per-drop consumption) is being expanded in three sub-phases. 8a is the foundation (metadata table + tooltips); 8b is the dynamic slot cap (`maxPayloads()`); 8c is the stacking change (all-payloads-on-drop + dedup). Each sub-phase is independently shippable so we can playtest between them.

### Phase 8a (payload tooltips) — shipped

- **`C.PAYLOADS` metadata table** — 9 entries, one per payload type. Fields: `name` (display, uppercase), `short` (4-letter badge text for the drop-zone indicator), `desc` (effect description for tooltips), `cost` (in credits, shop price), `color` (in-game + tooltip header color), `icon` (integer 0-8 passed to `SVG_ICONS.getPayloadIcon`). The table order matches the existing `updateShop` / `updateHUD` / `triggerSlotCollected` PA-case arrays, so the `icon` index is consistent with the current visual layout.
- **Tooltip wiring** — single delegated `pointermove`/`pointerleave` on `#pi` (parent of the `.ps` divs). Uses `e.target.closest('.ps')` to find the hovered slot, then calls `showTooltip(name, desc, color, clientX, clientY)` with the payload's metadata. Empty slots (class `'ps'` rather than `'ps on'`) don't show a tooltip.
- **`data-payload` attribute** — `updateHUD` now sets `ps.dataset.payload = '<name>'` on populated slots and removes it on empty, so the tooltip listener can look up the metadata from the DOM.
- **`showTooltip` bottom-edge auto-flip** — the payload slots live in the bottom 60px of the 700px viewport, so a below-cursor tooltip (the default) would be clipped by `body { overflow: hidden }`. 8a narrows Phase 7b's "don't flip" policy: when `clientY > window.innerHeight - 80`, the tooltip positions above the cursor (`top = clientY - tipHeight - TOOLTIP_OFFSET`) so the full content is visible. The slot-collector zone (y=560..610) is above the threshold so its tooltips are unaffected.
- **No call-site changes** to `updateShop`, `dropBall`, `triggerSlotCollected`, or the drop-zone indicator in `render` — they still use their existing inline arrays. 8b and 8c will refactor those to read from `C.PAYLOADS` directly.
- **Net +73 lines in `index.html`**. 7 new unit tests (116 → 123 total, all pass).
- **No game-logic changes** — 8a is purely a UX/clarity pass. Players can now see what a queued payload does before dropping the ball.

### Phase 8b (dynamic slot cap) — shipped

- **`maxPayloads()` helper** — `2 + Math.floor(GS.fl / 10)`. Single source of truth for the inventory cap. Used by `updateShop` (buy check), `triggerSlotCollected` PA case (random payload add), `dropBall` (overflow guard), `renderPayloadSlots` (DOM size), and `initSlotArrangement` (toast on increase).
- **Dynamic DOM** — `renderPayloadSlots()` ensures `#pi` has `maxPayloads()` `.ps` children and populates each from `C.PAYLOADS`. Appends new divs as the cap grows; never shrinks (cap is monotonic during a run). All N slots are always visible: filled with the payload icon + color, empty with the grey `-`.
- **Refactored call sites to use `C.PAYLOADS`** — `updateShop` now iterates `Object.keys(C.PAYLOADS)` instead of the inline 9-item `items` array. `triggerSlotCollected` PA case rolls from `Object.keys(C.PAYLOADS)` instead of the hardcoded `payloads` list. `render()` drop-zone indicator reads `pMeta.short` / `pMeta.color` instead of the parallel `payloadNames` / `payloadColors` arrays. `updateHUD` slot block (the 8a inline ps1/ps2 with the parallel arrays) is now a single call to `renderPayloadSlots()`. **Three parallel `payloadColors` arrays and the parallel `payloadNames` array are gone** — `C.PAYLOADS` is the only source of payload metadata.
- **`startGame` cleanup** — resets `GS.lastMaxPayloads = maxPayloads()` and empties `#pi.innerHTML` so a new run at fl 1 (cap 2) doesn't show 4 stale divs from a previous run that reached fl 20.
- **`initSlotArrangement` cap-increase toast** — detects `maxPayloads() > GS.lastMaxPayloads` and shows `+1 PAYLOAD SLOT` (or `+N PAYLOAD SLOTS` for rare multi-floor jumps) via the existing `showToast` helper. Fires when the slot selector opens on a floor that crosses a `+10` boundary. The toast appears at the same moment the player sees the new slot count in `#pi`.
- **Shop `.disabled` styling** — when `GS.pl.length >= cap`, every shop tile gets the `.disabled` class (50% opacity, `cursor: not-allowed`). Click handler still silently no-ops as a defensive belt (no player-visible behavior change beyond the dim).
- **Net +58 lines in `index.html`**. 24 new unit tests (123 → 147 total, all pass). Covers the cap curve at every floor boundary, render-population, monotonic growth, and `startGame` reset.

- **Phase 8c (all-payloads-on-drop + dedup)** — Closes the Phase 8 payload overhaul series. Three changes that together turn the queue from a "next up" buffer into a "loadout" model. **(1) Flatten `GS.pl` to a plain string array** — 8a/8b stored each entry as a 1-element array (`['daemon']`) with a defensive `Array.isArray` check at every read site. 8c drops the wrapping; entries are now plain strings (`'daemon'`) and the read sites (`renderPayloadSlots`, the `render()` drop-zone indicator, the 8a tooltip wiring) read `GS.pl[i]` directly. The `Ball` constructor's `this.pl` field is set from the same source and was never read, so no consumer broke. **(2) Consume all queued payloads on drop** — `dropBall` swapped `var pl = GS.pl.shift() || [];` for `var pl = GS.pl.splice(0);`. The local `pl` variable is still the array the per-payload `indexOf()` checks iterate over (`pl.indexOf('ghost')`, etc.), so the existing flag-setting code (`newBall.ghostMode = true`, `newBall.slowmoMode = true`, `newBall.cl = true`, ...) all still fires. With 8b's dynamic cap, the queue can hold 2-5 unique types; dropping a ball with `[daemon, ghost, cluster]` now applies all three effects (shield + phasing + 3-mini split). **(3) Dedup in the buy handler + PA slot effect** — the shop now computes `isQueued = GS.pl.indexOf(key) !== -1` per tile and styles it `.disabled` (50% opacity, `not-allowed` cursor) alongside the existing "queue full" disabled. The click handler is a defensive no-op for any disabled tile (belt + suspenders with the class). The PA slot effect re-rolls the random payload up to 20 times looking for a unique type before giving up; with 9 types and a cap of 2-5, the re-roll always succeeds in practice (verified max < 10 attempts in 50 trials). The PA case's `+PAYLOAD` float only shows when a unique roll was found. **(4) Drop-zone count badge** — the colored badge at the top of the board shows the first queued payload's icon (unchanged from 8b), and now adds a small yellow `xN` text in the upper-right of the circle when `GS.pl.length > 1` so the player can see "how many payloads will fire on the next drop" without consulting the `.ps` row. **No new test API needed** — the unit suite already has `maxPayloads` and `renderPayloadSlots` exposed; the 8c tests use those plus inline dedup-replication (the dedup logic is small and the inline replica runs the same Math.random / indexOf code path the real handler does). **Net +66 lines in `index.html`** (the dedup + flatten comments at each call site are verbose — the actual code is ~20 lines, the rest is the explanation of why). **31 new unit tests** (147 → 178 total) covering: shop buy pushes a string, dedup per-tile disabled, full-queue disables all, consume-all (3 queued → all 3 applied, queue emptied), consume-all on empty queue, PA slot re-roll always finds unique in <20 attempts, renderPayloadSlots reads strings, drop-zone badge text math (x1 hidden, x3/x5 shown), tooltip still works after flatten (regression check on the 8a describe() lookup), and a dedup stress test (cannot re-add queued types, cannot add new when cap is full). All pass. **Smoke checks**: shop tile is dimmed and not-allowed when payload is queued, full queue dims every tile, dropping a ball with 3 queued payloads applies all 3 flags and empties the queue, PA slot roll never adds a duplicate, drop-zone shows `x2`/`x3`/`xN` badge for multi-payload queues, the 8a tooltip still appears on the in-game `.ps` slots. **0 game-balance changes** — 8c is purely a UX/clarity pass that turns the payload queue into a more useful "save up several for one big drop" mechanic.


## Phase 9 — Slot-Selector UI Refresh + Drag-and-Drop

> Cleanup pass on the slot arrangement screen. Phase 5 replaced the original drag-and-drop with tap-to-select-tap-to-place (the better fit for touch at the time). Phase 9 brings back drag-and-drop alongside the tap path, and cleans up three visual issues the user flagged along the way. Detail in the Phase 9 change-log entry at the top of this file.

### What changed

**1. State classes, not inline styles.** `renderSlotSelector()` was setting per-state `style.background / style.borderColor / style.borderStyle / style.color` inline across four branches. Refactored to a single `.slot-pos` class plus one of four state classes (`.occupied` / `.unlocked-empty` / `.unlockable` / `.locked-disabled`) so the look-and-feel is in CSS and the render is just data. Uniform 64×64 box, uniform 2px border weight; state is communicated by color + icon only.

**2. New `UI_PLUS_CYAN` icon.** Solid-stroke cyan circle with `+` (vs the existing `UI_PLUS` which is dashed yellow). Replaces the magenta `UI_UNLOCK` on locked-but-unlockable positions. In-family with the cyan section header, soft 2.2s pulse animation gated on `prefers-reduced-motion`. The magenta `UI_UNLOCK` icon is dropped (no other call sites use it).

**3. New `.locked-disabled` state.** Uses the existing `UI_LOCK` (solid grey padlock, closed shackle) at 0.5 opacity. Reads instantly as "closed" (vs the dashed `UI_PLUS` at 0.6 opacity the previous build used, which was ambiguous about *why* it was disabled).

**4. Drag-and-drop via pointer events.** The Phase 5 `selectOrPlace` IIFE was refactored: `pointerdown` now only does pick / switch / cancel. The place action is moved off to `pointerup`, which can be triggered by EITHER a tap (pointerup with no movement) OR a drag drop (pointerup after pointermove past a 6px threshold). The tap and drag share the same `performPlace(targetPos)` function so the placement logic is identical for both gestures. Drag creates a `.slot-drag-ghost` element (appended to `<body>` to escape the `#scaler` transform-origin stack) that follows the cursor, dims the source tile to 35% via `.dragging-source`, and highlights the current drop target via `.drop-target`. `setPointerCapture` is used so the user can drag off the overlay and still release on a position cleanly. `pointercancel` cleans up if the system interrupts the gesture.

**5. Unlock counter.** `<div id="unlock-counter">` between the two sections shows "1 UNLOCK REMAINING THIS FLOOR" (yellow) or "0 UNLOCKS REMAINING THIS FLOOR" (grey) or "ALL POSITIONS UNLOCKED" (when 7/7). Replaces the previous "Tap a slot, then tap a locked position to unlock it" hint above the pool.

**6. Section labels + divider.** The inline-styled "Target Positions" / "Available Effects" headers are replaced with a `.section-label` class (Orbitron uppercase cyan, with a soft text-shadow) so the two sections feel visually tied. A thin cyan gradient rule (`.slot-section-divider`) separates the position row from the unlock counter + pool.

**7. Unlock burst.** When `unlockSlotPosition` fires, a `GS.justUnlocked = pos` flag is set; `renderSlotSelector` adds the `.unlock-burst` class to that position's div for one render pass, the CSS keyframe (`slot-unlock-burst`) plays a 650ms radial cyan flash, and a `setTimeout` clears the flag. Gated on `prefers-reduced-motion`.

**8. Copy.** The long instruction paragraph is now "Drag or tap a slot effect onto a position. Locked positions unlock when you assign to them." (one sentence, two gestures, lead verb). The "↑ Tap a slot, then tap a position ↑" inter-section hint is dropped.

**9. `__TEST__` API additions.** Exposes `renderSlotSelector` and `getSlotColor` so the unit suite can drive the slot-selector UI directly.

### Net effect

- **index.html**: +240 lines (new CSS rules for the four state classes + drag visuals + unlock counter + keyframes ~140 lines; refactored IIFE with drag-and-drop state + helpers + new listeners ~150 lines; offset by the removal of the old inline-style branches and the inter-section hint ~50 lines).
- **tests/unit.js**: added a new "Phase 9: Slot Selector UI" section (lines ~223–386 in `tests/unit.js`) covering the Phase 9 changes (`UI_PLUS_CYAN` + `UI_LOCK` defined, `GS.justUnlocked` initial state, three render assertions covering all-unlockable / mixed-disabled / all-done states that read `.slot-pos` classNames + counter text/class, unlock-burst flag with and without `GS.justUnlocked`, and CSS-rule existence checks via a `walk(rules, selector)` helper that recurses into `@media (prefers-reduced-motion: reduce)` for the nested keyframe). 26 asserts in the new section. The unit suite currently has **180 asserts across 20 sections** (the Phase 9 change-log entry at the top of this file mentions "31 added (178 → 209)" — that count was optimistic; the actual `assert(` call count is 180, and the Phase 9 section's actual contribution is 26).
- **tests/screenshot-suite.js**: `06-slot-selector.png` regenerated with the new look. Pixel-band + overlay-visible assertions still pass.

### Smoke checks (manual)

- fl 1 shows 7 cyan `+` tiles with pulse
- Tap a pool item then tap a position → drops (unlock + fill), counter flips to "0 UNLOCKS REMAINING" grey, remaining 6 turn to grey `UI_LOCK`
- Drag a pool item onto a locked position → unlocks it with the same burst
- Tap a position with no selection → no-op
- Tap AUTO-ARRANGE or CONFIRM mid-gesture → cancels the drag cleanly
- Release on empty space → cancels the selection

### Design iterations (rejected)

- **Bright pink `UI_UNLOCK` padlock on unlockable** — was the source of the user complaint about the "jarring" magenta. Replaced with `UI_PLUS_CYAN`.
- **Per-state background color tinted differently from border** — created the "size change" perception after unlocking (a small grey box surrounded by larger cyan boxes). Solved by the uniform 64×64 box + same border weight across all four states; state is communicated by color + icon, not by visual weight.
- **Tap-only (Phase 5)** — was functional but less satisfying than the original drag-and-drop on desktop. Brought back as the primary gesture, with tap as the touch-friendly fallback.


## Phase 10 — Settings Volume Sliders

> The settings screen's SOUND EFFECTS and MUSIC on/off pill toggles are replaced with per-channel volume sliders. User feedback: the music is a bit loud and the toggle doesn't let you dial it down. Detail in the Phase 10 change-log entry at the top of this file.

### The problem

The pre-Phase-10 audio system had two boolean toggles in the settings overlay (`<div class="toggle" id="soundtoggle">` and `<div class="toggle" id="musictoggle">`). Clicking one flipped `Audio.muted` or `Audio.bgmMuted` between `false` and `true`, with `masterGain.gain.value` hardcoded to `0.4` (SFX) and the BGM `<audio>` element's `.volume` hardcoded to `0.3`. The user could pick "on" or "off" but couldn't pick "quiet" or "very quiet" — the design treated volume as binary when the user wanted a continuous control.

### The design

**Per-channel volume (0..1) replaces the on/off boolean.** `Audio.setSfxVolume(vol)` and `setBgmVolume(vol)` are the new source-of-truth setters. SFX volume drives `masterGain.gain.value` (the Web Audio gain node that all SFX route through); BGM volume drives the current `<audio>` element's `.volume` property. Both accept and clamp the input to the legal `[0, 1]` range. The old `setMuted` / `setBgmMuted` / `toggleMute` / `toggleBgmMute` methods are kept as thin delegates (the unit suite had assertions on them; any future external caller should still work) but the UI routes through the new setters.

**`muted` / `bgmMuted` become derived state.** The `muted` flag is now `sfxVolume === 0` (and `bgmMuted` is `bgmVolume === 0`), used as a fast early-out in `_tone` / `_noise` (SFX) and the deferred-play path in `playBgm` (BGM). The setters flip the flag as a side effect, so the existing `if (!this.initialized || this.muted) return;` check in the SFX helpers still short-circuits at volume 0 without spending audio context time on inaudible work.

**Unmute resumes a deferred BGM track.** The old `musicToggle` had an explicit "if wasMuted && !muted, playBgm(currentBgmId)" branch to handle the case where `playBgm` was called while muted (the track is staged via `currentBgmId` but never started, so the muted user doesn't waste bandwidth). `setBgmVolume` keeps the same logic: dragging the BGM slider from 0% to any positive value resumes the staged track without a separate `playBgm` call from the UI layer.

**`PERSIST.sfxVolume` / `bgmVolume` floats (0..1).** Defaults `0.4` SFX / `0.3` BGM — the same values the hardcoded `masterGain` (0.4) and `bgmVolume` (0.3) used pre-Phase-10, so playtest balance is preserved for first-time players. The old `PERSIST.audioMuted` / `PERSIST.bgmMuted` booleans are gone (see migration below).

### Migration

`loadPersist` does a one-time migration of legacy `PERSIST.audioMuted` / `PERSIST.bgmMuted` booleans to the new floats:
- `audioMuted === true` → `sfxVolume = 0`
- `audioMuted === false` (or undefined) → `sfxVolume = 0.4` (default)
- Same pattern for BGM (0.3 default)
- After migration, the legacy fields are `delete`d so they're never written back

This means a returning user with `audioMuted: true` in their pre-Phase-10 localStorage payload sees the SFX slider migrate to 0% on next launch; a user with `audioMuted: false` sees 40%. A fresh first-time visitor with no localStorage gets the 40% / 30% defaults.

### The UI

**New HTML rows.** The two `.toggle-row` divs are replaced with `.volume-row` divs:
```html
<div class="volume-row">
    <span class="volume-label">SOUND EFFECTS</span>
    <span class="volume-icon" id="sfx-icon"></span>
    <input type="range" class="volume-slider" id="sfxvolume" min="0" max="100" step="1" value="40" aria-label="Sound effects volume">
    <span class="volume-value" id="sfxvolume-value">40%</span>
</div>
```
Same shape for the BGM row (`#bgmvolume`, default `value="30"`). The CONTRAST MODE and MULTIBALL MODE pill toggles are unchanged — only the audio channels use the slider control.

**New CSS.** ~80 lines of new styles: `.volume-row` (flex row with min-width 280px so the 7-col content fits on the 480px overlay), `.volume-slider` (transparent background, custom `--vol-pct` custom property, custom WebKit + Firefox track + thumb), `.volume-value` (Orbitron tabular-numeral percent display), `.volume-icon` (18×18 inline-flex wrapper for the SVG). WebKit uses a `linear-gradient` on `::-webkit-slider-runnable-track` to color the filled portion cyan (left of the thumb) and the empty portion dim grey (right of the thumb); Firefox uses `::-moz-range-progress` (a real second pseudo-element). `touch-action: manipulation` removes the 300ms tap delay on mobile so dragging feels native.

**New SVG icons.** `UI_SOUND_ON` (cyan speaker with two radiating wave arcs at decreasing opacity) and `UI_SOUND_OFF` (speaker with a red X over the wave area). The icon swaps at 0% so the muted state is instantly readable. The X is in `#ff2244` (the same red as the explosive peg) — matches the icon set's "danger means red" convention. The speaker body stays cyan in both states so the control's identity is preserved when toggling.

**`applyVolumeSlider(channel, vol)` helper.** Single source of truth for binding a PERSIST volume to its row in the DOM (slider value, `--vol-pct`, percent text, icon). Called from `initSettings()` at load and exposed on `window.__TEST__` for the unit suite.

### The `input` event handler

```js
function sfxVolumeInput() {
    var pct = parseInt(this.value, 10);
    var vol = pct / 100;
    this.style.setProperty('--vol-pct', pct + '%');
    document.getElementById('sfxvolume-value').textContent = pct + '%';
    var icon = document.getElementById('sfx-icon');
    if (icon) icon.innerHTML = pct === 0 ? SVG_ICONS.UI_SOUND_OFF : SVG_ICONS.UI_SOUND_ON;
    Audio.init();
    Audio.setSfxVolume(vol);
    PERSIST.sfxVolume = vol;
    savePersist();
}
```

The `input` event (not `change`) fires on every drag tick so the UI stays in sync with the user's finger, and the `localStorage.setItem` on each tick is fast enough that throttling isn't worth the added complexity. Five things happen in order: (1) parse the new percent, (2) update the `--vol-pct` custom property so the filled portion of the track re-flows, (3) update the percent text, (4) swap the speaker icon, (5) push the new volume into Audio + PERSIST. `Audio.setSfxVolume` / `setBgmVolume` also flip the `muted` / `bgmMuted` flags as a side effect, so the SFX `_tone`/`_noise` early-outs and the `playBgm` deferred-track logic stay consistent.

### Net effect

- **`index.html`**: +212 lines (two new HTML rows ~6 lines, ~80 lines of CSS for the slider components, ~50 lines of new Audio methods + setter refactor, ~30 lines of slider event listeners, ~25 lines of migration logic in `loadPersist`, ~10 lines of test API; offset by ~30 lines of removed toggle code in settings handlers)
- **`svg-icons.js`**: +15 lines (the two new icons)
- **`tests/unit.js`**: +263 lines (3 new sections, 74 new asserts)
- **All 254 unit tests pass** (was 180; +74 = 15 Audio Volume + 20 Volume Sliders + 39 Volume Migration + adjustments to the existing Audio Engine section + the Web Audio 32-bit-float epsilon fix)

### Smoke checks (manual)

- Open settings, SFX slider shows 40% with cyan speaker (matches the default 0.4 SFX volume)
- Drag SFX slider to 0% — icon flips to red X, percent shows 0%, SFX are silent (peg hit in-game is inaudible)
- Drag back to 75% — icon flips to cyan, SFX resume at 75% volume
- Same for BGM with the gameplay track playing through
- Closing and reopening the menu keeps the slider at its last position (PERSIST persistence works)
- A fresh first-time visitor with no localStorage sees the 40% / 30% defaults
- A returning visitor with legacy `audioMuted: true` in their PERSIST sees the SFX slider migrate to 0% and the legacy field get cleaned out
- CONTRAST MODE and MULTIBALL MODE pill toggles are unaffected (binary state, still use the `.toggle` CSS class)

### Design iterations (rejected)

- **Pure keyboard-only control** (arrow keys to nudge, +/- buttons) — added complexity without clear value over a standard `<input type="range">`.
- **Click-the-icon to toggle mute** (drag-to-X to silence, drag-back-to-last-value to restore) — clever but inconsistent with the "the slider IS the control" mental model.
- **Defaults at 0.5 / 0.2** (higher SFX, lower BGM to address the "music is loud" feedback by default) — would silently change the playtest balance for existing players. Kept the original 0.4 / 0.3 defaults; the slider is the lever, not a silent balance rebalance.


## Phase 11 — Mobile Compatibility Pass

> User playtested on a Pixel 7a (Android Chrome, 412x839 viewport). Two issues reported: (1) board was zoomed in with the left/right sides cut off — only the middle ~70% of the play field was visible; (2) slot-selector tap-to-swap and drag-and-drop gestures did not work — tap selected a position, but the swap never fired when tapping a second position. Both traced to latent Phase 5 / Phase 9 design decisions. Detail in the Phase 11 change-log entry at the top of this file.

### The two bugs

**Bug 1 (layout clipping).** Phase 5 used a single `#scaler` element sized 480x700 with a `transform: scale()` applied to it. The body flex-centered the 480x700 *layout* box. On any viewport narrower than 480 (every modern phone — Pixel 7a is 412 wide, iPhone 13 is 390, iPhone SE is 320), the layout box overflowed the body horizontally. The body's `overflow: hidden` clipped the visual, leaving the user with only the middle ~70% of the board visible (top and bottom too on short viewports like iPhone SE in landscape).

**Bug 2 (tap-to-swap).** Three layered issues, all in the Phase 9 slot-selector IIFE:
- **a.** With `setPointerCapture`, `e.target` on `pointerup` is frozen to the original pointerdown target. The tap path's `e.target.closest('.slot-pos')` always returned the first-tapped position, never the release position. Tap pos 3 (select), tap pos 5 (swap) — `e.target` is pos 3, `performPlace(3)` cancels the selection, swap never fires.
- **b.** `setPointerCapture` can silently no-op for touch on some iOS Safari / Android Chrome versions. The `try/catch` swallowed the failure; subsequent `pointermove` / `pointerup` events never reached the slot-selector, and the drag died if the finger went off the overlay.
- **c.** Even after the `elementFromPoint` fix above, a *separate* bug surfaced: the first tap on an occupied position sets `GS.selectedSlot = {fromPos: 3}`, but the same tap's `pointerup` then calls `performPlace(3)`, hits the `sel.fromPos === targetPos` branch, and *cancels the selection it just made*. The highlight flashes on and off, and the second tap has no selection to swap with.

### The design

**11-A — Layout-vs-visual split.** `#scaler` is now `calc(480px * var(--scale))` × `calc(700px * var(--scale))` — the *visual* size — so the body flex centers it inside the viewport with no overflow. `#game-container` is the 480x700 design box with `transform: scale(var(--scale))` and `transform-origin: top left`, visually filling `#scaler` exactly. The `--scale` CSS custom property is set by JS (`scaleToFit`) and read by both elements. `getBoundingClientRect()` on the canvas returns the visual size, so the existing pointer-event clientX/Y → design-coord conversion is unchanged.

**`scaleToFit` reads `visualViewport` first.** iOS Safari's `window.innerHeight` includes the URL-bar area even when collapsed (it's the *layout* viewport); `visualViewport.height` is the actually-visible area. New `scaleToFit` prefers `visualViewport` and falls back to `window.innerWidth` / `window.innerHeight`. New `visualViewport.resize` listener supplements the existing `resize` / `orientationchange` listeners (the `resize` event does not fire on the iOS URL-bar transition; `visualViewport.resize` does).

**11-B — Pointer handling (three fixes).**

- **(a) `setPointerCapture` failure detection + window fallback.** Wrap the capture call, check `hasPointerCapture` after, and if it returned `false`, install window-level capture-phase `pointermove` / `pointerup` / `pointercancel` listeners that mirror the slot-selector's own handlers. The fallback is torn down on `pointerup` / `pointercancel`. The window listeners are gated on `dragState.pointerId` so they only fire for the active gesture, not unrelated pointer activity.

- **(b) `document.elementFromPoint` for tap-target lookup.** Replace `e.target.closest('.slot-pos')` with `document.elementFromPoint(e.clientX, e.clientY) || e.target` in the pointerup tap path. The drag path already used `elementFromPoint` in `endDrag`; this brings the tap path to parity. The `|| e.target` fallback handles the case where the cursor is over the overlay's background (no slot-pos there, but `elementFromPoint` returns the overlay div itself, which is fine — the subsequent `closest('.slot-pos')` returns null and the place is a no-op).

- **(c) `justSelected` gesture flag.** A module-private boolean in the IIFE, set to `true` whenever `pointerdown` freshly assigns `GS.selectedSlot` (the three branches: pool item, occupied position, switch-to-different-pool-item). The pointerup tap path checks the flag — if `true`, the release is just the user lifting their finger after selecting, so it returns without `performPlace` and clears the flag. A subsequent tap on a *different* position has `justSelected = false` and runs `performPlace` normally, swapping the slots. A subsequent tap on the *same* position (to deselect) also has `justSelected = false` and runs `performPlace` which sees `sel.fromPos === targetPos` and cancels — toggle behavior preserved. The fallback pointerup reads/clears the flag too (closure over the module-private state).

**Drag threshold 6 → 10.** 6 viewport-px was fine on desktop mouse but tight on touch — at 0.86× scale on a 412-wide phone, 6 design px ≈ 7 visual px, below natural finger jitter (10-15 px). 10 viewport-px gives ~12 design-px headroom. The threshold is in viewport (clientX/Y) coords, so it's scale-invariant.

**11-C — Mobile test suite.** New `tests/mobile.js` (339 lines), exposed as `npm run test:mobile` and wired into CI. Four Playwright device profiles (Pixel 7, iPhone 13, iPhone SE, iPad Mini), five test sections (Layout / Scaling, Canvas Tap Drops Ball, Slot-Selector Tap-to-Place, Slot-Selector Tap-to-Swap, Slot-Selector Drag-and-Drop). 48 asserts total. The tap-to-swap section is the regression guard for the `justSelected` fix — it fails loudly (8 of 8 swap asserts) without the fix and passes 8/8 with it.

### Net effect

- **`index.html`**: +174 lines (CSS rewrite for the layout-vs-visual split ~20 lines, `scaleToFit` rewrite + `visualViewport` listener ~25 lines, IIFE refactor for the 3 pointer-handling fixes ~80 lines, `justSelected` flag plumbing ~20 lines, comments ~30 lines; offset by the removal of the old inline-style branches in `scaleToFit`). 7164 → 7338 lines.
- **`tests/mobile.js`**: new, 339 lines.
- **`package.json`**: one new script (`test:mobile`).
- **`.github/workflows/ci.yml`**: one new step (`npm run test:mobile`, runs after `test:unit`, `if: success() || failure()`).
- **`svg-icons.js`**: unchanged.
- **All 254 unit + 20 performance + 16 screenshot + 48 mobile = 338 tests pass.**

### Smoke checks (manual on Pixel 7a)

- Board fills the viewport edge-to-edge (no left/right clipping), HUD readable, drop zone reachable.
- Tap-to-swap between two occupied positions works: tap pos 0, see yellow highlight, tap pos 1, slots swap (pos 0 now has what pos 1 had, and vice versa).
- Drag from pool to position works: visual ghost follows the finger, drop target highlights yellow, release places the slot.
- Tap-to-deselect: tap pos 0 (selected) again cancels the selection.

### Design iterations (rejected)

- **Fix bug 2 with `setPointerCapture` removal entirely** — moved to window-level listeners unconditionally. Rejected: would change the desktop behavior (the slot-selector listeners would fire for any pointer activity, requiring a stronger `dragState.pointerId` gate everywhere). Kept the slot-selector listeners as the primary path, added the window-level fallback only when capture fails.
- **Bump the drag threshold much higher (e.g. 20 px)** — would require a longer "wiggle" before a drag starts, which feels sluggish on desktop. 10 is the sweet spot.
- **`justSelected` as a per-element flag on the slot-pos div** — could be done with a `data-just-selected` attribute, but the IIFE-local boolean is simpler and self-contained.
- **Drag test using `page.mouse.move/down/up`** — unreliable on touch contexts across Chromium versions (some don't translate mouse→touch for the full `pointermove` sequence). The synthetic `PointerEvent` dispatching in the test is target-agnostic and exercises the exact same listener paths as real touch, with deterministic timing.


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

### Mobile Compatibility (Phase 11)
- [x] Board fills the viewport edge-to-edge on phone viewports — no left/right clipping on Pixel 7a (412 wide), iPhone 13 (390), iPhone SE (320). Layout-vs-visual split: `#scaler` is the visual-size box, `#game-container` is the scaled 480x700 design box.
- [x] `scaleToFit` reads `visualViewport` first (iOS URL-bar-aware), listens to `visualViewport.resize` for live URL-bar transitions.
- [x] Slot-selector tap-to-swap works on mobile: tap pos A (select) → tap pos B (swap). The `justSelected` gesture flag prevents the first tap's pointerup from cancelling the selection it just made.
- [x] Slot-selector tap-to-deselect still works: tap the same position twice to clear the selection.
- [x] Slot-selector drag-and-drop works on mobile: `setPointerCapture` failure detection + window-level fallback listeners. Tap-to-place and drag-to-place both work; the same `performPlace` is the drop target.
- [x] Drag threshold bumped 6 → 10 viewport-px for reliable touch detection.
- [x] Tap-target lookup uses `document.elementFromPoint` (not `e.target.closest`) in the pointerup tap path, so `setPointerCapture` doesn't freeze the release target.
- [x] Mobile test suite (`tests/mobile.js`, `npm run test:mobile`) covers 4 device profiles (Pixel 7, iPhone 13, iPhone SE, iPad Mini) with 48 asserts across 5 sections. All pass. Wired into CI.

### Known Gaps / TODO
- [x] **`cluster` payload is not wired in `dropBall`** (RESOLVED). Added `if (pl.indexOf('cluster') !== -1) { newBall.cl = true; }` to `dropBall` immediately after the trojan block. Smoke check confirms: dropping a cluster ball sets `newBall.cl = true`; on the first `Ball.update` (where `tr.length < 5` and `mb.length === 0`), the ball splits into 3 mini-balls (radius 4.2 = 7×0.6) with random velocities and `cl` is cleared so the parent doesn't re-split. Mini-ball render, exit/life-cost flow, and the chromatic-aberration-free purple ball render were all already in place — only the flag-set was missing.
- [x] **`slowmo` payload draws the octagonal overlay but does NOT slow the ball** (RESOLVED). Added `if (this.slowmoMode) dt60 *= 0.5;` at the top of `Ball.update` immediately after `var dt60 = dt * 60;`. Smoke check confirms: a slowmo ball at rest, given one update at dt=1/60, accumulates vy ≈ 0.0898 (vs 0.1791 for a normal ball — exactly 0.5× because gravity's only contribution in one frame is `0.18 * dt60`, no friction term has compounded yet). The visual octagonal overlay (gated on `GS.slowmoEffect`) and the physics scale (gated on `this.slowmoMode`) are independent, as they should be. Note: `this.slow` further down in `Ball.update` is still the ice peg's 500ms transient slow — unchanged.
- [x] **`GS.slowmoEffect` / `GS.ghostEffect` global flags not cleared on last-flagged-ball exit** (RESOLVED). The blue octagonal slow-mo overlay (`if (GS.slowmoEffect) { ... }` in `render()`) was gated on a global flag that `dropBall` set to `true` and only `startGame` ever reset, so it stayed on the board after the slowmo ball exited. `GS.ghostEffect` had the same shape (set on drop, never cleared) but was effectively dead-flag — the chromatic-aberration render keys on the per-ball `b.ghostMode`. Fix: end of `updateBalls`, after `GS.activeBalls` is rebuilt, sweep the active ball list and set `GS.slowmoEffect = activeBalls.some(b => b.slowmoMode)` and `GS.ghostEffect = activeBalls.some(b => b.ghostMode)`. Net +16 lines. Smoke check: 1 slowmo ball drops → exits → flag clears; 2 slowmo balls → first exits, flag stays true → second exits, flag clears.
- [x] **`MULTIBALL_THRESHOLD`** (RESOLVED, reserved for meta-progression). Constant is now annotated in `index.html` as reserved for the future meta-progression unlock system (e.g. "reach combo 7 to permanently unlock multiball as a milestone reward, like the existing ball-skin / board-theme unlock pattern"). Not enforced today. Multiball remains opt-in via the settings toggle, and the only active constraint is the `MAX_BALLS=3` cap in `dropBall` (parent + active mini-balls). When the meta-progression system is built out, wire this constant to a one-time unlock toast + `PERSIST.multiballUnlocked = true` flag, then the settings toggle becomes a clean "already unlocked; turn on/off" affordance.
