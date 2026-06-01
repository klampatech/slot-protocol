# Slot Protocol UI Overhaul Plan

## Project Overview
Complete visual redesign of Slot Protocol's UI to meet modern arcade game design standards. The game has solid mechanics but needs decorative polish, custom icons, and engaging visual feedback.

---

## Phase 1: SVG Icon Library ✅ PLANNED
**Goal:** Create comprehensive inline SVG icons for all game elements

### Peg Types (11 icons)
| # | Name | Description | Color |
|---|------|-------------|-------|
| 0 | Node | Standard peg, bounces ball | `#00fff2` (cyan) |
| 1 | Cache | Bonus credit provider | `#ffff00` (yellow) |
| 2 | Teleport | Warps to paired peg | `#9944ff` (purple) |
| 3 | Seismic | Screen shake + shockwave | `#ff6600` (orange) |
| 4 | Explosive | Chain damage, ×3 score | `#ff2244` (red) |
| 5 | Dormant | Activates on proximity | `#444466` (grey) |
| 6 | Ice | Freezes ball momentarily | `#88ddff` (ice blue) |
| 7 | Fiber | Breaks after 3 hits | `#ff8844` (orange-red) |
| 8 | Mirror | Reflects in direction | `#ffffff` (white) |
| 9 | Honeypot | Bonus at 5th hit | `#ffcc00` (gold) |
| 10 | Overload | Drains jackpot | `#ff4488` (pink) |

### Slot Effects (8 icons)
| # | Name | Icon | Effect |
|---|------|------|--------|
| 0 | Empty | Empty slot | Nothing |
| 1 | Credits | `$` or coin | +50×multiplier |
| 2 | Amplify | `+` | +1 combo, Extend timer |
| 3 | Payload | `?` | Random payload |
| 4 | Crumble | `#` | Destroy 3 pegs |
| 5 | Shield | `^` | Protect next ball |
| 6 | Overclock | `*` | 1.5× gravity |
| 7 | Jackpot | `★` | Big prize |

### Payloads (9 icons)
| # | Name | Description |
|---|------|-------------|
| 0 | Scrambler | Reverses ball direction |
| 1 | Trojan | Spawns clone balls |
| 2 | Worm | Pierces through pegs |
| 3 | Logic Bomb | ×3 score on hit |
| 4 | Daemon | Shields from overflow |
| 5 | Ghost | Phases through pegs |
| 6 | Cluster | Splits into 3 mini-balls |
| 7 | Explosive | Chain explosions |
| 8 | Slowmo | Slows ball speed |

### UI Elements
- Trophy (leaderboard)
- Star/medal badges (ranks 1-3)
- Gear/settings icon
- Achievement unlocked icon
- Locked/unlocked indicators
- Ball icons (various colors)
- Heart/life indicators
- Credit/coin icon
- Arrow indicators
- Checkmark, X, etc.

## Phase 1: SVG Icon Library ✅ COMPLETE
**Goal:** Create comprehensive inline SVG icons for all game elements

### Created: svg-icons.js (47 lines)
Comprehensive icon library with helper functions for peg types, slots, payloads, and UI elements.

### Peg Types (11 icons) - ✅ DONE
| # | Name | Icon SVG | Color |
|---|------|---------|-------|
| 0 | Node | Cyan circle + highlight | `#00fff2` |
| 1 | Cache | Yellow diamond `$` | `#ffff00` |
| 2 | Teleport | Purple swirl portal | `#9944ff` |
| 3 | Seismic | Orange burst rays | `#ff6600` |
| 4 | Explosive | Red danger star | `#ff2244` |
| 5 | Dormant | Grey dashed `Z` | `#444466` |
| 6 | Ice | Blue crystal frost | `#88ddff` |
| 7 | Fiber | Orange striped | `#ff8844` |
| 8 | Mirror | White reflective | `#eeeeee` |
| 9 | Honeypot | Gold hexagon `5` | `#ffcc00` |
| 10 | Overload | Pink bolt star | `#ff4488` |

### Slot Types (8 icons) - ✅ DONE
| # | Name | Icon SVG | Effect |
|---|------|---------|--------|
| 0 | Empty | Dashed X box | Nothing |
| 1 | Credits | Green coin `$` | +50×multiplier |
| 2 | Amplify | Magenta plus | +1 combo, Extend timer |
| 3 | Payload | Purple `?` box | Random payload |
| 4 | Crumble | Orange fragments | Destroy 3 pegs |
| 5 | Shield | Cyan shield ✓ | Protect next ball |
| 6 | Overclock | Yellow clock | 1.5× gravity |
| 7 | Jackpot | Gold star | Big prize |


### Payloads (9 icons) - ✅ DONE
| # | Name | Icon SVG | Effect |
|---|------|---------|--------|
| 0 | Scrambler | Cyan exchange arrows | Reverses direction |
| 1 | Trojan | Magenta triple balls | Spawns clones |
| 2 | Worm | Cyan pill + dots | Pierces through |
| 3 | Logic Bomb | Red `3x` bomb | ×3 score on hit |
| 4 | Daemon | Pink shield gold center | Shields from overflow |
| 5 | Ghost | White ghost shape | Phases through |
| 6 | Cluster | Magenta triple cluster | Splits into 3 |
| 7 | Explosive | Orange burst | Chain explosions |
| 8 | Slowmo | Blue clock lines | Slows ball |

### UI Elements (6 icons) - ✅ DONE
- UI_TROPHY - Trophy cup
- UI_STAR - Gold star
- UI_HEART - Red heart
- UI_LOCK - Locked indicator
- UI_CHECK - Checkmark
- UI_ARROW_RIGHT - Arrow

### Helper Functions - ✅ DONE
```javascript
SVG_ICONS.getPegIcon(type)     // Returns peg icon by index
SVG_ICONS.getSlotIcon(type)    // Returns slot icon by index
SVG_ICONS.getPayloadIcon(type) // Returns payload icon by index
```

### Status: ✅ COMPLETE - 100%

---

## Phase 2: UI Polish Pass ✅ COMPLETE
**Goal:** Implement icons throughout the UI with decorative elements
**Status: [x] COMPLETE

### Completed Changes:
1. **Shop payload icons** - ✅ DONE
   - Replaced text price with `SVG_ICONS.getPayloadIcon()` inline SVG icons
   - Icons display next to price in each shop item

2. **Slot selector icons** - ✅ DONE
   - Position slots: Replace text icons with `SVG_ICONS.getSlotIcon()` SVG icons
   - Pool slots: Replace text icons with `SVG_ICONS.getSlotIcon()` SVG icons
   - Added icon container styling (32x32px flex container)

3. **Achievement unlock animations** - ✅ DONE
   - Enhanced toast notification with trophy icon from `SVG_ICONS.UI_TROPHY`
   - Added achievement-specific styling (golden glow, larger border)
   - Added spring animation with bounce effect
   - Improved toast timing (3.5s with better transitions)

4. **Menu screen decorative improvements** - ✅ DONE
   - Added decorative icon row at top (3 gold stars)
   - Added gradient dividers between decorative elements
   - Enhanced stat display with inline SVG icons for each stat
   - Added animated footer arrow indicator

5. **Gameplay screen polish** - ✅ DONE
   - Slot collector icons: Added SVG icon backgrounds with colored circles
   - Added short label text below each slot icon (first 3 letters of slot name)
   - TODO: Peg icons on canvas, ball effects, particle improvements

### Completed Tasks:
- [x] Payload icons in payload queue (HUD area) - ✅ DONE
- [x] Peg icons in peg info tooltips/stats - ✅ DONE (Settings peg type legend)
- [x] Ball skin preview with SVG icons - ✅ DONE
- [x] Daily challenge modifiers with icons - ✅ DONE (Styled modal with icons)

## Phase 3: Gameplay Visual Enhancements ✅ COMPLETE
**Goal:** Add visual flair to actual gameplay canvas
**Status: [x] COMPLETE

### Ball Effects - ✅ DONE
- [x] Glowing trails by multiplier with gradient fade and outer glow
- [x] Payload effect indicators with color-coded names
- [x] Shield ring visualization with pulsing animated ring and energy sparks
- [x] Multi-ball visual distinction with numbered indicators and alternate colors
- [x] Ghost mode chromatic aberration (RGB offset copies with ghost trail)

### Peg Effects - ✅ DONE
- [x] Evolution state animations with glow pulse for dormant peg activation
- [x] Hit ripple effects expanding outward from collision points
- [x] Shatter/debris for fiber pegs with rotating fading fragments
- [x] Ice crystallization effect spawning radial shards on freeze
- [x] Teleport portal animation with spiral effect

### Collisions - ✅ DONE
- [x] Particle bursts on hit with 20 particle spawn
- [x] Screen shake intensity scaled by event (2-12 range)
- [x] Flash effects at collision points with color halos
- [x] Floating score numbers with glow and fade

### Drop Zone - ✅ DONE
- [x] Animated trajectory preview with dash animation and fading effect
- [x] Ball selection indicator showing next payload with color-coded name
- [x] Payload queue visualization in HUD
- [x] Pulsing drop point with crosshair and animated outer glow

### HUD Enhancements - ✅ DONE
- [x] Animated multiplier bar with scale effect on combos
- [x] Jackpot counter animation with pulse effect
- [x] Life ball indicators with staggered pulse animation
- [x] Objective progress animation with shimmer and glow at >80%
- [x] Color-coded chain timer bar (green/yellow/red based on time remaining)

### Implementation Details
- Added visual enhancement tracking variables (pegRipples, teleportPortals, evolutionPulses, collisionFlashes)
- Created helper functions for each effect type
- Integrated effects into Peg.hit() and render loop
- Added CSS transitions for smooth animations throughout HUD

### Status: ✅ COMPLETE - 100%

---

## Phase 4: Sound & Motion Integration
**Goal:** Coordinate visual feedback with motion/feel

### Transitions
- [ ] Overlay open/close animations
- [ ] Button press feedback
- [ ] Drag-drop visual feedback
- [ ] Slot spin animations

### Continuous Effects
- [ ] Ambient glow animations
- [ ] Floating particles in menu
- [ ] Score tick-up animation
- [ ] Combo countdown urgency

### Status: [ ] NOT STARTED

---

## Implementation Notes

### SVG Icon Approach
- Inline SVGs in HTML or JS-generated
- Consistent viewBox sizing (24×24 for UI, 16×16 for small)
- Use CSS variables for colors to support themes
- Animate with CSS or requestAnimationFrame

### Color Palette
```
Cyan:    #00fff2 (primary)
Magenta: #ff00ff (secondary)
Yellow:  #ffff00 (accent)
Green:   #00ff88 (success)
Red:     #ff2244 (danger/warning)
Orange:  #ff6600 (special)
Purple:  #9944ff (mystic)
White:   #ffffff (neutral)
Grey:    #444466 (dormant)
```

### File Structure
```
index.html
├── SVG Definitions <defs>
│   ├── Peg icons
│   ├── Slot icons
│   └── UI icons
├── Icon references via <use>
└── CSS animations for icon effects
```

---

## Current Status
**Project Phase:** Phase 1-3 COMPLETE - Phase 4 (Sound & Motion) PENDING
**Last Updated:** 2026-06-01

## Session Log
- **Session 1 (2026-06-01):**
  - Created remote GitHub repo
  - Fixed overlay centering
  - Added color-coded borders to overlays
  - Created screenshot automation suite
  - **Phase 1 COMPLETE:** Created svg-icons.js with 34 custom SVG icons
    - 11 Peg type icons
    - 8 Slot type icons
    - 9 Payload icons
    - 6 UI icons
    - Helper functions for icon retrieval by type index

- **Session 2 (2026-06-01):**
  - **Phase 2 COMPLETE:** UI Polish Pass
    - Payload icons in shop and HUD
    - Slot selector icons with drag-drop
    - Achievement toast with trophy animation
    - Menu decorative improvements
    - Gameplay slot collector icons
    - Ball skin preview with SVG
    - Daily challenge modal with icons
    - Settings peg type legend
    - Drag-drop functionality with visual feedback
    - Contrast mode and theme support

- **Session 3 (2026-06-01):**
  - **Phase 3 COMPLETE:** Gameplay Visual Enhancements
    - Ball effects: glowing trails, ghost chromatic aberration, shield ring, multi-ball distinction
    - Peg effects: hit ripples, shatter/debris, ice crystals, teleport portals, evolution glow pulse
    - Collisions: particle bursts, screen shake, flash effects, floating scores
    - Drop zone: animated trajectory, pulsing drop point, ball selection indicator
    - HUD: animated multiplier bar, jackpot counter, life indicators, progress animation
    - Added 569 lines of visual enhancements (48 removed, 617 modified)
