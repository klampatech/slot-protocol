# Slot Protocol — Rogue Pachinko

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
2. 11 peg types: `node`, `ice`, `fiber`, `mirror`, `cache`, `honeypot`, `overload`, `seismic`, `dormant`, `teleport`, `explosive` — each with unique visuals and bounce/scoring behavior
3. Two-phase collision detection: spatial band broad phase + circle-circle narrow phase
4. Ball drop zone with mouse-tracking aim position and dotted trajectory arc preview
5. Stuck ball recovery: if ball moves < 2px for 180 frames, apply random kick velocity
6. Slot collector zone at y=560 (height=50): 7 slots across 480px width, ball triggers slot effect on entry

### Peg Evolution System (5-state machine)
7. Dormant → Normal → Glowing → Charged → Explosive
8. Dormant pegs activate when ball comes within 40px — visual state transition from `#444466` to type default color
9. Evolution chain: normal hit transitions N→Glowing (×2 pts), next hit Glowing→Charged (+50% stored bonus), next hit detonates and releases stored bonus
10. EXPLOSIVE state (×3 self + ×1.5 adjacent on hit)

### Scoring & Multiplier
11. Base peg hit: 50 pts × multiplier × (frenzyActive ? 3 : 1)
12. Cache peg: 200 + (multiplier × 50) pts + bonus breach credits
13. Seismic peg: +100 flat bonus + shockwave + screen shake
14. Chain multiplier: increments per consecutive peg hit (cap ×7, resets on ball exit)
15. Frenzy mode: ×3 on ALL scoring for 180 frames when comboCount ≥ 5 hits without ball exit
16. Chain timer: 30-frame window per hit, extended by 180 frames with AMPLIFY slot bonus

### Roguelike Structure
17. Game states: `MENU → TUTORIAL → PLAYING → SLOT_SELECTOR → FLOOR_COMPLETE → SHOP → PLAYING → ... → RUN_END → MENU`
18. Floor objective system: targets scale with floor (15 + floor for floor 1-3, 20 + floor for 4-6, 25 + floor for 7-9, 30 + floor for 10+)
19. Overflow penalty: -3×floor score penalty when ball exits without slot, +15% jackpot drain
20. 5 lives per run, shown as ball indicators in HUD
21. Between-floors NetShop for purchasing payloads with breach credits

### Slot Arrangement System (Player Agency Feature)
22. Before each floor, player arranges slots by drag-and-drop from a pool of 7 random slot effects
23. Player chooses which slot position to unlock each floor (max 7 total, 1 unlock per floor)
24. NO slots are pre-unlocked - player must choose which slot to unlock each floor
25. Locked slots are shown with '?' and magenta dashed border - drag to unlock only
26. Only unlocked slots appear on the game board and are active (locked slots invisible)
27. Unlocked slots on the board are styled with colors matching their type (JP=gold, AM=magenta, CR=green, OC=yellow, SH=cyan, CM=orange, PA=purple, E=grey)
28. Player can auto-arrange or manually choose slots for each position
29. Pool generates fresh 7 random slots each floor

### Payloads (9 types)
29. `scrambler` (50cr) — reverses ball direction on first peg hit
30. `trojan` (75cr) — spawns clone balls on peg hit
31. `worm` (60cr) — pierces through pegs without bouncing
32. `logic bomb` (100cr) — x3 score on peg hit
33. `daemon` (80cr) — shields one ball from overflow
34. `ghost` (70cr) — phases through pegs, no bounce, no score
35. `cluster` (90cr) — splits into 3 mini-balls on first hit
36. `explosive` (85cr) — chain explosions on hit
37. `slowmo` (55cr) — slows ball speed
38. Payload inventory: max 2 per type, consumed on next ball drop, queued via `GS.pl[]`

### Slot Collector Effects (8 types including Jackpot)
39. EMPTY — no effect
40. CREDITS — +50×multiplier to score
41. AMPLIFY — +1 multiplier + 180-frame chain timer
42. PAYLOAD — adds random payload to inventory
43. CRUMBLE — destroys 3 random pegs
44. SHIELD — next ball protected from overflow exit
45. OVERCLOCK — 1.5× gravity for ball duration
46. JACKPOT (3% spawn rate) — adds to jackpot pool, potential big win
47. Jackpot system: base = 500×floor, grows +15% per failed spin, 3-reel match wins, resets to base on win

### Meta-Progression
48. PERSIST object in localStorage: `lifetimeBreach`, `totalRuns`, `bestFloor`, `bestScore`, `achievements[]`, `leaderboard[]`, `dailyChallenge{}`, `totalPegsHit`, `ballSaverCount`
49. 17 achievements tracked and toast-popupped on earn
50. Daily challenge: seeded RNG from date, 2 modifiers per day, one attempt tracked

### Settings & Customization
51. Contrast mode toggle (white/grey on dark theme)
52. Multiball mode toggle (up to 3 balls concurrent)
53. Ball skins: Cyan, Magenta, Gold, Green, Orange, White
54. Board themes: Neon (default), Matrix (green)
55. Reset all data option with confirmation

### UI / Screens
56. `#menu-overlay` — title with stats, buttons: INITIATE BREACH, DAILY, TUTORIAL, ACHIEVEMENTS, LEADERBOARD, SETTINGS
57. `#hud` — top bar: floor, score, jackpot, balls remaining + SHOP button
58. Objective progress bar below HUD (fills to target)
59. Multiplier display top-right with chain timer bar beneath
60. `#tutorial-overlay` — how-to-play
61. `#floor-overlay` — floor complete + jackpot slots + continue/end buttons
62. `#shop-overlay` — NetShop grid for payload purchases
63. `#runend-overlay` — game over with stats and new best indicator
64. `#achievement-toast` — bottom-right popup, auto-dismisses 3s
65. `#settings-overlay` — contrast mode, multiball, ball skin, board theme, reset
66. `#resetconfirm-overlay` — reset confirmation with warning
67. `#slot-selector-overlay` — player chooses which slot to unlock + arranges effects
68. Leaderboard, Achievements overlay screens

### Effects & Feedback
69. Particle system (collision particles, color-matched)
70. Fragment system (crumbling peg debris)
71. Shockwave system (seismic peg expanding ring)
72. Float text system (rising score/pickup numbers)
73. Screen shake + white flash on major events
74. Ball trail system (last 10 positions, color by multiplier)
75. Ghost ball chromatic aberration effect during ghost payload
76. Slow-mo octagonal blue tint overlay during slowmo
77. Shield ring (green) around shielded balls
78. Mini ball rendering for cluster payload

---

## 4. Technical Implementation

### Architecture
```
index.html (single file, ~3000 lines)
├── CSS styles (overlays, HUD, themes, animations)
├── SVG defs via CSS
└── JavaScript
    ├── CONSTANTS (C) — physics, colors, peg types, slot types
    ├── GS (GameState) — runtime state, reset per run
    ├── PERSIST — localStorage persistence
    ├── ACHIEVEMENTS — 17 achievement definitions with check functions
    ├── Ball class — x,y,vx,vy,radius,payloads[],trail[],hitPegs,shielded
    ├── Peg class — x,y,type,state,radius,hitCount,type-specific properties
    ├── Board generation — genBoard(), addExtraPegs() for stormy modifier
    ├── Physics — Ball.update(), checkCols(), checkDormantActivation()
    ├── Scoring — combo, frenzy, peg type bonuses
    ├── Slots — genSlots(), triggerSlotCollected(), triggerOverflow()
    ├── Slot Arrangement — initSlotArrangement(), renderSlotSelector(), drag-drop handlers
    ├── Jackpot — spinJackpot(), jackpot reels with CSS animations
    ├── Effects — particles, fragments, shockwaves, floats, screen shake, white flash
    ├── Daily Challenge — getDailySeed(), getDailyModifiers(), startDailyChallenge()
    ├── Achievements — checkAchievements(), unlockAchievement(), showToast()
    ├── Settings — contrastToggle(), multiballToggle(), ball skin/theme handlers
    ├── Leaderboard — addToLeaderboard(), updateLeaderboardUI()
    ├── Render — canvas drawing for all game elements
    ├── Game loop — requestAnimationFrame(loop)
    └── Persistence — loadPersist(), savePersist()
```

### Key Constants
- Canvas: 480×700px
- Gravity: 0.18, Friction: 0.995, Max Velocity: 14, Hard Cap: 21
- Ball Radius: 7, Peg Radius: 8
- Chain Timer: 30 frames, Frenzy Duration: 180 frames, Max Multiplier: 7
- Stuck Detection: 180 frames at <2px movement
- Drop Zone: y=0-50, Board: y=110-480, Slots: y=560-610

### GS Slot State Variables
| Variable | Type | Description |
|----------|------|-------------|
| `unlockedSlots` | Array | Indices of unlocked positions [0-6], starts empty each floor |
| `canUnlockThisFloor` | Boolean | True if player can unlock 1 more slot this floor |
| `slotsArranged` | Boolean | True if player has confirmed slot arrangement |
| `slotArrangement` | Array | Slot type per position [index] = ST type |
| `slotPool` | Array | Available slot effects to assign (7 random per floor) |

### Peg Types (by PT enum)
| Index | Name | Color | Effect |
|-------|------|-------|--------|
| 0 | Node | Cyan (#00fff2) | Standard bounce, 50pts |
| 1 | Cache | Yellow (#ffff00) | 200+ bonus, breach credits |
| 2 | Teleport | Purple (#9944ff) | Teleports to paired peg |
| 3 | Seismic | Orange (#ff6600) | 100pts, shockwave, screen shake |
| 4 | Explosive | Red (#ff2244) | x3 score, chain damage |
| 5 | Dormant | Grey (#444466) | Activates on 40px proximity |
| 6 | Ice | Light Blue (#88ddff) | Freezes ball, bonus on second hit |
| 7 | Fiber | Orange-Red (#ff8844) | Multi-hit, breaks after 3 hits |
| 8 | Mirror | White (#ffffff) | Deflects in specific direction |
| 9 | Honeycomb | Gold (#ffcc00) | Attracts nearby pegs on 5th hit |
| 10 | Honeypot | Gold (#ffcc00) | Bonus at 5th hit, peg attraction |
| 11 | Overload | Pink (#ff4488) | Drains 10% jackpot |

### Slot Types (by ST enum)
| Index | Name | Icon | Effect |
|-------|------|------|--------|
| 0 | Empty | - | Nothing |
| 1 | Credits | $ | +50×multiplier score |
| 2 | Amplify | + | +1 combo, 180 frame timer |
| 3 | Payload | ? | Random payload |
| 4 | Crumble | # | Destroy 3 pegs |
| 5 | Shield | ^ | Protect next ball |
| 6 | Overclock | * | 1.5× gravity |
| 7 | Jackpot | ★ | Adds to jackpot pool |

---

## 5. Acceptance Criteria

### Core Gameplay
- [ ] Click INITIATE BREACH → game starts, HUD visible, board has 40+ pegs
- [ ] Ball drops and falls with gravity arc
- [ ] Ball hits peg → bounce occurs, score increases, multiplier increments
- [ ] 5 consecutive peg hits → frenzy mode activates (×3)
- [ ] Ball exits via unlocked slot → multiplier resets, slot effect fires
- [ ] Ball exits via locked slot position → no effect (slot not active)
- [ ] Objective filled → FLOOR_COMPLETE overlay shown with jackpot

### Slot Unlock Mechanic
- [ ] Floor 1: NO slots unlocked, player must unlock 1 slot to start
- [ ] Drag slot to locked position → unlocks AND assigns slot
- [ ] Drag slot to unlocked position → swaps/assigns the slot
- [ ] ONLY 1 slot can be unlocked per floor (enforced)
- [ ] Only unlocked slots visible on game board (locked invisible)
- [ ] Only unlocked slots trigger slot effects on ball entry
- [ ] After all 7 unlocked, player can only rearrange existing slots
- [ ] Slot selector shows 7 fresh random slots each floor

### Progression
- [ ] FLOOR_COMPLETE → CONTINUE → SLOT_SELECTOR appears
- [ ] Slot arrangement: drag slots to unlock, drag to rearrange, auto-arrange, confirm
- [ ] SHOP opens between floors, purchases deduct credits
- [ ] RUN_END shows stats, new best indicator if applicable

### Effects
- [ ] Screen shake on seismic/explosive pegs
- [ ] White flash on major events (Frenzy, Jackpot)
- [ ] Particles spawn on peg hits
- [ ] Float text appears for score/bonuses