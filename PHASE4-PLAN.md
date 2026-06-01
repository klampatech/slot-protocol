# Phase 4: Sound & Motion Integration - Implementation Plan

## Overview
- **Created**: 2026-06-01
- **Objective**: Add sound effects, smooth transitions, and ambient motion to make the game feel responsive and alive
- **Scope**: Web Audio API synthesis, CSS keyframes, button feedback, menu particles, score animations, combo urgency
- **Update 2026-06-01**: Music ported in from `rogue-pachinko/audio/`. All 5 MP3s are now in `slot-protocol/audio/`, wired into a BGM sub-system on the existing `Audio` object, with a one-time mousemove trigger on the title screen for the first-load play. See **Phase 4D: Music Port** at the bottom of this file.

## Implementation Strategy

All work happens in `index.html` (single-file game). Code goes inline in:
- `<style>` block (lines 7-204) for CSS
- `<script>` block (lines 222-3798) for JS

ES5 style maintained (var, no arrow functions, function expressions). No external dependencies (until the music port — see Phase 4D).

## Implementation Strategy

All work happens in `index.html` (single-file game). Code goes inline in:
- `<style>` block (lines 7-204) for CSS
- `<script>` block (lines 222-3798) for JS

ES5 style maintained (var, no arrow functions, function expressions). No external dependencies.

---

## Phase 4A: Web Audio API Sound System

### Task 1.1: Audio Engine Foundation
**Files**: `index.html` (modify `<script>` block, add after line 469)
- Add `AudioEngine` object with master gain, mute state, init on first user interaction
- Use lazy initialization (browsers require user gesture to start audio context)
- Persist mute preference in PERSIST

### Task 1.2: Sound Synthesis Functions
**Files**: `index.html` (modify `<script>` block)
- Implement procedural sound generation using OscillatorNode + GainNode envelopes
- Sound effects:
  - `playPegHit(intensity)` - short blip with pitch based on combo level
  - `playBonus()` - rising chime
  - `playSlotCollect(type)` - specific sound per slot type
  - `playJackpot()` - triumphant fanfare
  - `playOverload()` - alarming buzz
  - `playButtonClick()` - soft click
  - `playDrop()` - whoosh/launch
  - `playAchievement()` - success melody
  - `playShield()` - power-up sound
  - `playExplosion()` - noise burst

### Task 1.3: Integration Points
**Files**: `index.html` (modify event handlers and game functions)
- Hook into `Peg.prototype.hit()` for peg sounds
- Hook into `triggerSlotCollected()` for slot sounds
- Hook into `spinJackpot()` for spin/win sounds
- Hook into all button click handlers
- Hook into `dropBall()` for drop sound
- Hook into `unlockAchievement()` for achievement sound

### Task 1.4: Mute Toggle UI
**Files**: `index.html` (modify Settings overlay)
- Add Mute toggle to settings (line 367 area)
- Mute state persists in localStorage

---

## Phase 4B: CSS Animations & Transitions

### Task 2.1: Overlay Show/Hide Animations
**Files**: `index.html` (modify `<style>` block)
- Add `@keyframes overlay-fade-in`, `overlay-fade-out`, `overlay-slide-up`, `overlay-slide-down`
- Update `.ov` and `.ov.on` to use transitions
- Each overlay type uses color-coded border with matching glow

### Task 2.2: Button Press Feedback
**Files**: `index.html` (modify `<style>` block)
- Add `:active` state for `.btn` with scale(0.95)
- Add transform transitions to all buttons
- Add ripple effect on click using CSS pseudo-elements

### Task 2.3: Drag-Drop Visual Feedback
**Files**: `index.html` (modify `<style>` block)
- Add `.dragging` class styles with stronger shadow/glow
- Add `.drop-target-active` highlight with pulsing border
- Smooth transitions for transform changes

### Task 2.4: HUD Pulse Animations
**Files**: `index.html` (modify `<style>` block)
- Add CSS pulse animation for jackpot value when high
- Add pulse animation for low-ball warning
- Add chain timer pulse (already have it - extend)

---

## Phase 4C: Continuous Effects

### Task 3.1: Menu Floating Particles
**Files**: `index.html` (modify menu overlay HTML + add CSS)
- Add particle container div with floating SVG/circle elements
- CSS keyframes for upward float + fade
- Lightweight: 8-12 particles only

### Task 3.2: Score Tick-up Animation
**Files**: `index.html` (modify `updateHUD()`)
- Track previous score, animate counter ticking up
- Use requestAnimationFrame for smooth count
- Triggers on score increase, plays bonus sound at milestones

### Task 3.3: Combo Countdown Urgency
**Files**: `index.html` (modify `updateHUD()`)
- When chain timer < 30% of max: pulse red
- When < 10%: flash red background briefly
- Add audio cue when chain timer hits critical threshold

### Task 3.4: Ambient Glow on Borders
**Files**: `index.html` (modify `<style>` block)
- Add subtle animated border-glow on overlay edges
- Color matches overlay theme
- Low intensity to not distract

---

## File Manifest
| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | All Phase 4 changes inline |

## Success Criteria
- [ ] Audio plays without lag on first user interaction
- [ ] All major game events have accompanying sounds
- [ ] Overlays fade/slide smoothly when shown/hidden
- [ ] Buttons respond visually on press
- [ ] Menu has subtle floating particle motion
- [ ] Score animates when increasing
- [ ] Combo timer shows visual urgency when low
- [ ] All effects are toggleable (mute, etc.)
- [ ] Performance stays at 60 FPS

## Estimated Impact
- New code: ~600-800 lines
- CSS additions: ~150 lines
- Audio engine: ~200 lines
- Integration hooks: ~50 lines
- Total file size increase: ~20-25KB

## Notes
- ES5 style preserved (var, function expressions)
- No external sound assets - all synthesized (except music — see Phase 4D)
- Respect reduced-motion preference (future enhancement)
- Test with Playwright suite

---

## Phase 4D: Music Port (Post-Synthesis Addition)

### Goal
Bring the 5 background music tracks from `rogue-pachinko/audio/` into slot-protocol, plumb them through the existing `Audio` object, and have the title track start on the first user mousemove on the title screen of the first load (browser autoplay policy requires a user gesture).

### Files Added
| Path | Size | Purpose |
|------|------|---------|
| `audio/title-screen.mp3`     | 2.9 MB | Title screen loop |
| `audio/gameplay-bgm.mp3`     | 8.5 MB | Gameplay loop |
| `audio/slot-machine.mp3`     | 5.6 MB | Jackpot spin loop |
| `audio/ending-screen.mp3`    | 3.6 MB | (reserved — game has no current win state) |
| `audio/connection-lost.mp3`  | 4.9 MB | Run-end one-shot (not looped) |

Total: ~26 MB of audio assets.

### Code Changes (inline in `index.html`)
- Added 5 `<audio>` elements (4 with `loop`, `connection-lost` without) in the body, each pointing at the matching MP3.
- Extended the `Audio` object with a BGM sub-system:
  - `initBgm()` — wire up elements and apply initial volume / mute
  - `playBgm(trackId)` — switch tracks (no-op if same track already playing)
  - `stopBgm(immediate)` — pause and (optionally) rewind
  - `setBgmMuted(muted)` / `toggleBgmMute()` — independent of SFX mute
  - `setBgmVolume(vol)`
  - `trackForScreen(id)` — screen→track mapping table
  - `applyBgmForScreen(id)` — central switch used by `showScreen()`
- Hooked `applyBgmForScreen()` into `showScreen()` so every screen change picks the right BGM.
- Hooked `playBgm('slot-spin')` into `spinJackpot()` start and `stopBgm(true)` into the spin-end callback (matches rogue-pachinko's "silent floor-complete between spins" design).
- Hooked `playBgm('connection-lost')` into the two run-end transitions (game over check + manual end).
- Added a one-time `mousemove` listener at the bottom of the script: `firstMoveStartTitleBgm` fires only when the menu screen is active, then arms `Audio.bgmArmed` and starts the title track. Removed after first fire.
- Added a new MUSIC toggle in Settings (`#musictoggle`) with its own `musicToggle()` handler. Independent from SOUND EFFECTS.
- Added `bgmMuted: false` to PERSIST defaults, `loadPersist` defaults, and the reset-all-data literal.

### Screen → Track Map
| Screen | Track |
|--------|-------|
| `menu` | `title` |
| `none` / `undefined` | continue current (gameplay track during a run) |
| `slot-selector` | `gameplay` |
| `fc` (floor complete) | silent (matches rogue-pachinko) |
| `re` (run end) | continue current (caller sets `connection-lost`) |
| `shop` / `tut` / `ach` / `lb` / `settings` / `resetconfirm` | continue current (don't disrupt music) |

The mapping uses three return values from `Audio.trackForScreen(id)`:
- `<trackId>` — switch to that track
- `'continue'` — leave whatever is currently playing alone
- `null` — stop the BGM (silence)

### First-Load Trigger Logic
- Browser autoplay policy: `<audio>.play()` must originate from a user gesture handler.
- On init, `showScreen('menu')` calls `applyBgmForScreen('menu')` which calls `playBgm('title')`. That call records the intended track but `play()` rejects silently.
- A one-time `mousemove` listener is registered on `document`. When the user moves the mouse **while the title screen is the active screen**, the listener arms BGM, removes itself, and calls `playBgm('title')` again. The page now has user activation, so `play()` resolves and the track starts.
- After firing once, `Audio.bgmArmed` is true. Any later `showScreen('menu')` (e.g. after a run) will start the title track directly.
- The first-load tutorial still wins over the title music: if `PERSIST.hasTut` is false, the tutorial screen is shown instead, the mousemove listener stays quiet, and the tutorial-close button click provides the user gesture that lets `showScreen('menu')` start the BGM.

### Verification
A Playwright smoke test confirmed:
- Audio elements present with correct `loop` flags
- `Audio.initBgm/playBgm/stopBgm/toggleBgmMute/trackForScreen/applyBgmForScreen` all present
- First mousemove on title screen: `bgmArmed` becomes true and the title track starts (`paused: false`, `volume: 0.3`)
- `INITIATE BREACH` click: BGM switches from `title` to `gameplay` (title pauses, gameplay plays)
- MUSIC toggle: clicking it mutes BGM and updates PERSIST (`bgmMuted: true`); clicking again unmutes and resumes the staged track
- SFX toggle and MUSIC toggle are fully independent
- PERSIST `bgmMuted` is restored after page reload
- No page errors during the flow

### Notes
- The "won" run-end branch is not wired up because slot-protocol does not currently have a win state. `ending-screen.mp3` is staged and ready to use if/when one is added.
- `bgmVolume` is 0.3 (vs 0.4 for SFX master) so music sits below the SFX in the mix.
