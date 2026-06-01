# Phase 4: Sound & Motion Integration - Implementation Plan

## Overview
- **Created**: 2026-06-01
- **Objective**: Add sound effects, smooth transitions, and ambient motion to make the game feel responsive and alive
- **Scope**: Web Audio API synthesis, CSS keyframes, button feedback, menu particles, score animations, combo urgency

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
- No external sound assets - all synthesized
- Respect reduced-motion preference (future enhancement)
- Test with Playwright suite
