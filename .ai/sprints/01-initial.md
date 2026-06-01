# Sprint 1: Core Gameplay MVP

## Sprint Goal

Deliver a playable minimum viable roguelike pachinko experience with foundational physics, peg interactions, ball dropping, basic scoring, and the core menu/shop/floor-complete loop.

## Tasks

- [x] Foundation: Core engine, physics, and peg board generation
  - [x] js-coder: Implement the single-file HTML structure including CSS styles (neon cyberpunk theme), canvas setup (480×700 HiDPI-aware), and JavaScript with CONSTANTS (GRAVITY=0.18, FRICTION=0.995, MAX_VEL=14, MAX_BALL_SPEED=21, BALL_RADIUS=7, STUCK_FRAMES=180, STUCK_DIST_THRESHOLD=2, CHAIN_TIMER=30, FRENZY_DURATION=180, MAX_MULTIPLIER=7), GS singleton (screen, floor, score, balls=5, multiplier=1, board[], floorObjective{}, payloadInventory[], jackpotPool, frenzyActive, frenzyTimer, currentPayloads[], comboCount, chainTimer), and PERSIST singleton (lifetimeBreach=0, totalRuns=0, bestFloor=0, bestScore=0, unlockedPayloads=[], purchasedUpgrades={}, achievements=[], leaderboard=[], hasSeenTutorial=false, meta={}, dailyChallenge={}). Implement Ball class (x, y, vx, vy, radius, active, trail[], hitPegs, payloads[], dropMultiplier, ghostPhasing, wormPiercing, slowmoActive, clusterSplit, miniBalls[], shielded, isOverloaded, stuckFrames, update方法), Peg class (x, y, radius, type, state, bounceCoeff, hitsRemaining, id), and Board generation (generateBoard with ~40 pegs, type distribution weight by floor, BOARD_TOP=110, BOARD_BOTTOM=480, peg spacing ~50px, pairTeleportPegs, addExtraPegs for stormy modifier, setupObjective). Implement physics engine with Ball.update() applying gravity, friction, velocity capping, delta-time normalization (dt60 = dt * 60), stuck detection with random kick, two-phase collision detection (spatial band broad phase + circle-circle narrow phase), checkCollisions() with handlePegHit() for bounce reflection, score award (50 × multiplier), and peg hit registration with no double-hits.
  - [x] _reviewer: Validate ball falls with physics from any drop position, peg collisions trigger bounces and score increases, stuck ball kicks after 3 seconds, no tunneling through pegs at max velocity

- [x] UI/HUD, scoring multiplier system, and slot collector
  - [x] js-coder: Implement HUD rendering (floor, score, jackpot, balls remaining, SHOP button top-left), objective progress bar below HUD filling toward floorObjective.target, chain multiplier display top-right (cyan→magenta→gold) with chain timer bar beneath, trajectory preview arc from aim position, score system (base 50 pts × multiplier, cache peg 200 + modifier, seismic +100 flat, chain multiplier increment per consecutive hit cap ×7, reset on ball exit, frenzy mode ×3 when comboCount ≥ 5 for 180 frames, chain timer 30-frame window extended 180 on AMPLIFY). Implement slot collector (SLOT_Y=560, height=50, 7 slots across 480px, slot width ~60px with ~10px dead zones between, getSlotX(slotIdx), getSlotForX(x), ball must fully enter), slot unlock formula (dynamic based on floor), and slot effects (CREDITS +50×multiplier cr, AMPLIFY +1 mult + 180 chain timer, PAYLOAD add free ball, CRUMBLE destroy 3 random pegs, SHIELD next ball shielded, OVERCLOCK 1.5× gravity, JACKPOT bonus). Implement triggerSlotCollected and triggerOverflow (floor-scaled penalties, life loss, jackpot drain). Implement Screen state transitions: MENU → PLAYING → FLOOR_COMPLETE → SHOP → PLAYING → RUN_END → MENU, all overlay screens (#menu-overlay with INITIATE BREACH button and stats display, #hud hidden on menu, #floor-overlay, #shop-overlay grid, #runend-overlay).
  - [x] _reviewer: Validate HUD updates in real-time, multiplier increments on consecutive peg hits, frenzy triggers at 5-combo, ball entering slot triggers correct slot effect, slot not accessible before unlock floor, overflow penalty applies correctly by floor tier

- [x] ❌Payload system, shop, and meta-progression basics
  - [x] js-coder: Implement all 9 payload types: scrambler (reverse direction, common 50cr), trojan (spawn 2 clones, uncommon 100cr), worm (pierce 4-7 pegs, rare 200cr), logicbomb (explode nearby on ball exit, rare 250cr), daemon (split 3 on impact, legendary 500cr), ghost (phase 3-5 pegs no bounce no score, rare 175cr), cluster (split 3 mini-balls, legendary 450cr), explosive (radius explosion on hit, uncommon 125cr), slowmo (50% dilation, rare 200cr). Implement payload inventory (max 2 per type, queued via currentPayloads[], consumed on next ball drop), payloadDef objects with id, name, icon, color, rarity, cost, effect, applyPayloadEffect in handlePegHit. Implement NetShop overlay (#shop-overlay) with buyItem using breachCredits deduction, items grouped by category (payloads, upgrades), dynamic pricing. Implement PERSIST save/load to localStorage key slotProtocolPersist with try/catch error handling, totalRuns increment on run end, bestFloor/bestScore update, lifetimeBreach tracking, unlock new payloads based on floor reached. Implement 5 lives shown as dot indicators, #gameover-interstitial pulsing "CONNECTION LOST" before RUN_END.
  - [x] _reviewer: Validate all payloads apply correct effects, inventory enforces max 2 per type, shop deducts credits and adds payload to queue, PERSIST persists across browser refresh, lives decrease on overflow, game over shows after losing all balls

- [x] Effects, achievements, leaderboard, and polish
  - [x] js-coder: Implement particle system (spawnParticles(color, x, y, count, spread), 20 per peg hit, color-matched), fragment system for crumbling pegs (spawnFragments(peg)), shockwave for seismic (spawnShockwave(x, y)), float text for score (spawnFloatText(x, y, text, color)), screen shake and white flash on overload/seismic. Implement peg evolution system (DORMANT→NORMAL on 40px approach, N→GLOWING on hit ×2 pts, GLOWING→CHARGED next hit +50% stored bonus, CHARGED→detonate releasing bonus, EXPLOSIVE via upgrade ×3 self ×1.5 adjacent). Implement #achievement-toast bottom-right popup auto-dismiss 3s, 6 achievements (First Blood, Streak Master, Jackpot Winner, Floor 5+, Ball Hog, Survivor), unlockAchievement logic. Implement #leaderboard-overlay (top 10 local scores, name entry on new high score). Implement #reset-overlay confirmation, #tutorial-overlay first-run how-to-play, contrast mode toggle affecting neon colors. Add ball trail colored by multiplier. Implement daily challenge (seeded RNG from date, 2 modifiers per day, one attempt tracked). Implement jackpot system (base=500×floor, grows +15% failed spin, 3-reel match wins, resets on payout), jackpot slot machine UI in FLOOR_COMPLETE.
  - [x] _reviewer: Validate all effects spawn correctly, peg evolution state transitions work, achievements trigger toast on earn, leaderboard displays and sorts correctly, reset clears PERSIST, tutorial shows first run, daily challenge applies modifiers, jackpot reels spin and pay correctly

## Definition of Done

**Core Playability**
- [x] Player can click INITIATE BREACH and game starts with 40+ pegs on board
- [x] Ball drops from mouse aim position and falls with gravity physics
- [x] Balls bounce off pegs with realistic reflection and velocity capping
- [x] Hitting pegs awards score (50 × multiplier) shown in HUD
- [x] Chain multiplier increments on consecutive hits, visually updates top-right
- [x] Frenzy mode triggers at 5-combo with ×3 score multiplier

**Peg System**
- [x] All 12 peg types render with distinct visuals
- [x] Dormant pegs activate when ball approaches within 40px
- [x] Peg evolution states (Dormant→Normal→Glowing→Charged→Explosive) function correctly
- [x] Type-specific behaviors work (teleport, speedboost, crumbling, etc.)

**Slot Collector & Jackpot**
- [x] Ball entering slot zone triggers exactly one slot effect
- [x] All 7 slots display with correct colors/icons
- [x] Dynamic slot unlocking works (slots unlock progressively by floor)
- [x] Jackpot system grows +15% per failed spin, 3-reel match pays correctly

**Payloads & Shop**
- [x] All 9 payload types purchasable and functional
- [x] Inventory enforces max 2 per type
- [x] Payloads consumed on next ball drop and apply correct effects
- [x] Shop deducts breachCredits and queues payload

**Progression & Persistence**
- [x] Lives system (5 balls) functions correctly
- [x] Overflow penalties scale by floor tier
- [x] PERSIST saves to localStorage on run end
- [x] Stats persist across browser restarts
- [x] Floor completion advances to next floor with new board

**UI & Polish**
- [x] All overlays render and transition correctly
- [x] HUD updates in real-time
- [x] 6+ achievements trigger with toast popups
- [x] Leaderboard shows and sorts top scores
- [x] Contrast mode toggles visual theme

**Visual Effects**
- [x] Particle effects spawn on peg hits
- [x] Ball trails render colored by multiplier
- [x] Screen shake occurs on major events
- [x] Float text displays rising score numbers

**Testing**
- [x] Player completes floor 1 within 60 seconds of clicking INITIATE BREACH
- [x] New player completes tutorial without confusion
- [x] Game runs at stable 60fps without memory leaks
