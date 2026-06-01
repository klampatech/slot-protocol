# Sprint 2: Feature Completion & Polish

## Sprint Goal

Complete remaining spec features (all 12 peg types fully implemented, all 17 achievements, multiball mode, contrast mode toggle, should-have/nice-to-have items), validate all acceptance criteria, and ensure the game passes the full E2E checklist from section 6.3.

---

## Tasks

- [x] Complete all 12 peg types and 17 achievements with full validation
  - [x] js-coder: Audit all 12 peg types in SPEC section 4.1 vs implemented pegs. Any missing types (ice, fiber, mirror, honeypot, overload, directional, speedboost beyond basic implementations) must be completed with correct bounce coefficients, visuals, and special behaviors. Implement ALL 17 achievements (section 4.1 item 42): First Blood, Streak Master, Jackpot Winner, Floor 5+, Ball Hog, Survivor, and 11 more unnamed achievements. Each achievement needs unlockAchievement() call at correct trigger point and PERSIST.achievements[] append. Add #achievement-toast (section 4.1 item 53) bottom-right popup with auto-dismiss 3s for ALL 17 achievements.
  - [x] _reviewer: Verify all 12 peg types function with type-specific behavior by dropping balls and hitting each type. Verify all 17 achievements can be unlocked and show toast. Verify no achievement triggers incorrectly (no false positives on unlock conditions).

- [x] Implement Should-Have and Nice-to-Have features
  - [x] js-coder: Implement multiball mode with `multiballEnabled` flag — when enabled, allow up to 3 balls active simultaneously. Implement peg stormy modifier (addExtraPegs adds additional rows). Implement board theme skins (section 4.3 item 70) — 3+ unlockable background aesthetics stored in PERSIST.meta{} with CSS class swapping. Implement ball color skins (section 4.3 item 71) — unlockable ball colors applied via GS.ballSkin. Implement contrast mode toggle fully (section 4.1 item 44) — replaces neon colors with white/grey on dark, stored in PERSIST.meta.contrastMode, affects all peg colors, HUD text, overlays. Implement shield ring (green) around shielded balls (section 4.2 item 67). Implement ghost ball chromatic aberration effect during ghost payload (section 4.2 item 65). Implement slow-mo octagonal blue tint during slowmo (section 4.2 item 66).
  - [x] _reviewer: Load game in browser, toggle contrast mode in menu — verify all neon colors replace correctly. Verify multiball activates and 3 balls all register collisions independently. Verify ball skins change ball rendering color. Verify shield ring appears when SHIELD slot triggers. Verify ghost payload shows chromatic aberration. Verify slowmo shows blue tint.

- [x] Full E2E validation pass
  - [x] js-coder: Run the full manual verification checklist from SPEC section 6.3 (all 20+ checkboxes). Fix any failures. Verify score validation (computed score matches HUD within 1%). Verify floor completion only triggers when objective.progress >= target. Verify ball count invariant (ballsInPlay.length + balls <= GS.balls). Verify slot lock enforcement (slots below unlock floor are invisible/no-op). Verify localStorage manipulation with corrupted JSON fails gracefully to default PERSIST. Verify stuck ball detection applies random kick after 180 frames < 2px movement.
  - [x] _reviewer: Execute full E2E checklist via Playwright headless Chromium — load https://klampatech.github.io/rogue-pachinko/, click INITIATE BREACH, verify game starts, drop ball, verify physics, verify collision, verify multiplier, verify slot, verify objective, verify floor complete, verify shop flow, verify ball loss, verify game over, verify PERSIST persists. Log any failures with exact step and expected vs actual.

- [x] Performance and edge case validation
  - [x] js-coder: Run 50 consecutive floors in headless mode to verify no memory leaks (ball array cleanup, particle culling). Verify FPS stays above 55 via requestAnimationFrame delta measurement. Test 5 simultaneous balls in multiball mode verify no physics desync (no ball passes through peg without collision). Test localStorage overflow scenario (fill PERSIST > 5MB) — verify no crash. Test payload injection (attempt to queue > max-allowed payloads) — verify enforcement in dropBall().
  - [x] _reviewer: Run performance test, confirm no gradual frame drop over 50 floors. Confirm all 5 multiball balls register collisions. Verify localStorage overflow is handled gracefully. Verify payload queue enforcement blocks excess payloads.

---

## Definition of Done

- [x] All 12 peg types render and behave uniquely per spec
- [x] All 17 achievements unlock correctly with toast notifications
- [x] Contrast mode toggle fully functional (all neon colors replaced)
- [x] Multiball mode works with up to 3 simultaneous active balls
- [x] Board theme skins and ball color skins unlockable and switchable
- [x] Shield ring, ghost chromatic aberration, slowmo blue tint all render
- [x] Full E2E checklist passes (20/20 items)
- [x] Score validation passes (computed vs HUD match within 1%)
- [x] Floor completion logic verified (only triggers at correct threshold)
- [x] Ball count invariant verified
- [x] Slot lock enforcement verified
- [x] localStorage corruption fails gracefully
- [x] 50-floor stress test passes with no memory leaks, FPS > 55
- [x] 5-ball multiball stress test passes with no desync
- [x] Payload queue max enforcement verified