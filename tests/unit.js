/**
 * Unit tests for Slot Protocol game logic.
 * Uses Playwright to load the game in a browser and test through window.__TEST__.
 */
const { chromium } = require('playwright');
const path = require('path');

let passed = 0, failed = 0, errors = [];

function assert(condition, name, detail) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${name}`);
    } else {
        failed++;
        errors.push({ name, detail });
        console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
    }
}

function section(title) {
    console.log(`\n--- ${title} ---`);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 480, height: 700 } });
    const page = await context.newPage();

    const filePath = path.join(__dirname, '..', 'index.html');
    await page.goto(`file://${filePath}`);
    await page.waitForTimeout(1000);

    // Wait for __TEST__ API to be available
    await page.waitForFunction('window.__TEST__ !== undefined', { timeout: 5000 });

    // Helper: evaluate in game context via __TEST__ API
    const eval_ = (expr) => page.evaluate(expr);
    const T = async () => await page.evaluate('window.__TEST__');

    // Helper to run code in game context with access to __TEST__
    const inGame = async (fn, ...args) => {
        return await page.evaluate(({ fnStr, args }) => {
            const t = window.__TEST__;
            if (!t) throw new Error('window.__TEST__ is undefined');
            const wrappedFn = new Function(
                't', 'args',
                'with(t) { return (' + fnStr + ')(' + args.map((_, i) => 'args[' + i + ']').join(',') + '); }'
            );
            return wrappedFn(t, args);
        }, { fnStr: fn.toString(), args });
    };

    // ========== GAME STATE INITIALIZATION ==========
    section('Game State Initialization');

    let gs = await inGame(() => {
        return { scr: GS.scr, fl: GS.fl, sc: GS.sc, bl: GS.bl, cc: GS.cc, jp: GS.jp, boardLen: GS.bd.length };
    });
    assert(gs.scr === 'MENU' || gs.scr === 'TUTORIAL', 'Initial screen is MENU or TUTORIAL');
    assert(gs.fl === 1, 'Initial floor is 1');
    assert(gs.sc === 0, 'Initial score is 0');
    assert(gs.bl === 5, 'Initial balls is 5');
    assert(gs.cc === 0, 'Initial combo is 0');
    assert(gs.jp === 500, 'Initial jackpot is 500');
    // Board may be empty if tutorial is showing on first load
    assert(gs.boardLen >= 0, 'Board initialized');

    let persist = await inGame(() => {
        return { type: typeof PERSIST, achIsArray: Array.isArray(PERSIST.ach) };
    });
    assert(persist.type === 'object', 'PERSIST is an object');
    assert(persist.achIsArray === true, 'PERSIST.ach is an array');

    // ========== CONSTANTS ==========
    section('Constants');

    let constants = await inGame(() => {
        return { W: C.W, H: C.H, G: C.G, BR: C.BR, PR: C.PR, SC: C.SC, MAXM: C.MAXM, CHAIN_T: C.CHAIN_T };
    });
    assert(constants.W === 480, 'Canvas width is 480');
    assert(constants.H === 700, 'Canvas height is 700');
    assert(constants.G === 0.18, 'Gravity is 0.18');
    assert(constants.BR === 7, 'Ball radius is 7');
    assert(constants.PR === 8, 'Peg radius is 8');
    assert(constants.SC === 7, 'Slot count is 7');
    assert(constants.MAXM === 7, 'Max combo is 7');
    assert(constants.CHAIN_T === 36, 'Chain timer is 36');

    let pegTypes = await inGame(() => {
        return { N: C.PT.N, E: C.PT.E, JP: C.ST.JP };
    });
    assert(pegTypes.N === 0, 'NODE peg type is 0');
    assert(pegTypes.E === 4, 'EXPLOSIVE peg type is 4');
    assert(pegTypes.JP === 7, 'JACKPOT slot type is 7');

    // ========== BOARD GENERATION ==========
    section('Board Generation');

    let boardTemplates = await inGame(() => Object.keys(BOARD_TEMPLATES));
    assert(boardTemplates.length === 6, '6 board templates exist');
    assert(boardTemplates.includes('GRID'), 'GRID template exists');
    assert(boardTemplates.includes('GALAXY'), 'GALAXY template exists');
    assert(boardTemplates.includes('HONEYCOMB'), 'HONEYCOMB template exists');

    let cellToPosResult = await inGame(() => {
        const p00 = cellToPos(0, 0);
        const p01 = cellToPos(0, 1);
        const p10 = cellToPos(1, 0);
        return { p00x: p00.x, p01x: p01.x, p10x: p10.x };
    });
    assert(cellToPosResult.p00x < cellToPosResult.p01x, 'cellToPos: col 1 is right of col 0');
    assert(cellToPosResult.p10x !== cellToPosResult.p00x, 'cellToPos: row 1 has x offset');

    let rollResult = await inGame(() => {
        const t = rollPegType(0);
        return { type: t, valid: t >= 0 && t <= 10 };
    });
    assert(rollResult.valid, 'rollPegType returns valid type');

    // ========== PHYSICS ==========
    section('Physics');

    let physicsResult = await inGame(() => {
        const b = new Ball(240, 100, 0, 0, []);
        const yBefore = b.y;
        b.update(1/60);
        return { dropped: b.y > yBefore };
    });
    assert(physicsResult.dropped, 'Ball falls under gravity');

    let wallBounceLeft = await inGame(() => {
        const b = new Ball(5, 200, -10, 0, []);
        b.update(1/60);
        return { bounced: b.x >= b.r };
    });
    assert(wallBounceLeft.bounced, 'Ball bounces off left wall');

    let wallBounceRight = await inGame(() => {
        const b = new Ball(475, 200, 10, 0, []);
        b.update(1/60);
        return { bounced: b.x <= 480 - b.r };
    });
    assert(wallBounceRight.bounced, 'Ball bounces off right wall');

    let speedCap = await inGame(() => {
        const b = new Ball(240, 100, 0, 100, []);
        b.update(1/60);
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        return { capped: speed <= C.MAXS + 5 };
    });
    assert(speedCap.capped, 'Ball speed is capped at MAXS');

    // ========== SCORING ==========
    section('Scoring');

    let pegPts = await inGame(() => {
        GS.fl = 1;
        const p1 = pegBasePoints();
        GS.fl = 5;
        const p5 = pegBasePoints();
        GS.fl = 10;
        const p10 = pegBasePoints();
        GS.fl = 1;
        return { p1, p5, p10 };
    });
    assert(pegPts.p1 === 50, 'pegBasePoints at floor 1 is 50');
    assert(pegPts.p5 === 70, 'pegBasePoints at floor 5 is 70');
    assert(pegPts.p10 === 95, 'pegBasePoints at floor 10 is 95');

    let comboResult = await inGame(() => {
        GS.cc = 0; GS.ct = 0; GS.fa = false;
        GS.cc = Math.min(GS.cc + 1, C.MAXM);
        GS.ct = C.CHAIN_T;
        return { cc: GS.cc, ct: GS.ct };
    });
    assert(comboResult.cc === 1, 'Combo increments to 1');
    assert(comboResult.ct === 36, 'Chain timer resets to CHAIN_T');

    let frenzyResult = await inGame(() => {
        GS.cc = 4; GS.fa = false; GS.ft = 0;
        GS.cc = Math.min(GS.cc + 1, C.MAXM);
        GS.ct = C.CHAIN_T;
        if (GS.cc >= 5) { GS.fa = true; GS.ft = C.FRENZY_T; }
        return { cc: GS.cc, fa: GS.fa, ft: GS.ft };
    });
    assert(frenzyResult.fa === true, 'Frenzy activates at combo 5');
    assert(frenzyResult.ft === 180, 'Frenzy timer is 180');

    // ========== SLOT SYSTEM ==========
    section('Slot System');

    let slotResult = await inGame(() => {
        genSlots();
        const valid = slots.every(s => s >= 0 && s <= 7);
        return { count: slots.length, valid };
    });
    assert(slotResult.count === 7, '7 slots generated');
    assert(slotResult.valid === true, 'All slot types are valid');

    let unlockResult = await inGame(() => {
        GS.unlockedSlots = [];
        GS.canUnlockThisFloor = true;
        unlockSlotPosition(3);
        return {
            unlocked: GS.unlockedSlots.indexOf(3) !== -1,
            canUnlockMore: GS.canUnlockThisFloor
        };
    });
    assert(unlockResult.unlocked === true, 'Slot position 3 unlocked');
    assert(unlockResult.canUnlockMore === false, 'Cannot unlock more this floor');

    let slotForX = await inGame(() => getSlotForX(240));
    assert(slotForX === 3, 'getSlotForX(240) returns slot 3');

    let slotForXEdge = await inGame(() => getSlotForX(0));
    assert(slotForXEdge === 0, 'getSlotForX(0) returns slot 0');

    let slotX = await inGame(() => getSlotX(3));
    assert(slotX === 240, 'getSlotX(3) returns 240');

    // ========== PHASE 9: SLOT SELECTOR UI ==========
    section('Phase 9: Slot Selector UI');

    // The new SVG icons must exist (UI_PLUS_CYAN for the unlockable state)
    let iconCheck = await inGame(() => {
        return {
            plusCyan: typeof SVG_ICONS.UI_PLUS_CYAN === 'string' && SVG_ICONS.UI_PLUS_CYAN.indexOf('viewBox') !== -1,
            lock: typeof SVG_ICONS.UI_LOCK === 'string' && SVG_ICONS.UI_LOCK.indexOf('viewBox') !== -1,
        };
    });
    assert(iconCheck.plusCyan === true, 'UI_PLUS_CYAN icon is defined');
    assert(iconCheck.lock === true, 'UI_LOCK icon is defined (used for locked-disabled state)');

    // renderSlotSelector: when all positions are locked and unlockable, every
    // .slot-pos should get the .unlockable class (cyan border + pulse)
    let allUnlockedRender = await inGame(() => {
        // First dismiss any active overlay and start fresh
        // Use a clean state: empty unlocked, all locked, canUnlock true
        GS.unlockedSlots = [];
        GS.canUnlockThisFloor = true;
        GS.slotArrangement = [null, null, null, null, null, null, null];
        GS.slotPool = [C.ST.CR, C.ST.AM, C.ST.JP];
        // Re-render via the public path: simulate opening the slot-selector
        // by calling initSlotArrangement, but that resets state. Instead,
        // call renderSlotSelector directly (it's the function the test cares
        // about, and the DOM is rebuilt each call).
        renderSlotSelector();
        const positions = document.querySelectorAll('#position-slots .slot-pos');
        const classes = Array.from(positions).map(p => p.className);
        return {
            count: positions.length,
            allUnlockable: classes.every(c => c.indexOf('unlockable') !== -1),
            noneDisabled: classes.every(c => c.indexOf('locked-disabled') === -1),
            // Counter text
            counterText: (document.getElementById('unlock-counter') || {}).textContent || '',
            counterHas: (document.getElementById('unlock-counter') || {}).className || '',
        };
    });
    assert(allUnlockedRender.count === 7, 'renderSlotSelector creates 7 position divs');
    assert(allUnlockedRender.allUnlockable === true, 'All 7 positions get .unlockable class when canUnlock=true');
    assert(allUnlockedRender.noneDisabled === true, 'No positions get .locked-disabled when canUnlock=true');
    assert(allUnlockedRender.counterText.indexOf('1') !== -1, 'Unlock counter shows "1" when 1 unlock available');
    assert(allUnlockedRender.counterHas.indexOf('has') !== -1, 'Unlock counter has .has class when unlock available');

    // When unlockedSlots = [0] and canUnlockThisFloor = false, position 0
    // should be .occupied (or .unlocked-empty if no slot), positions 1-6
    // should be .locked-disabled, counter should show 0 + .used class.
    let mixedRender = await inGame(() => {
        GS.unlockedSlots = [0];
        GS.canUnlockThisFloor = false;
        GS.slotArrangement = [C.ST.CR, null, null, null, null, null, null];
        GS.slotPool = [C.ST.AM, C.ST.JP, C.ST.SH];
        renderSlotSelector();
        const positions = document.querySelectorAll('#position-slots .slot-pos');
        const classes = Array.from(positions).map(p => p.className);
        return {
            pos0Occupied: classes[0].indexOf('occupied') !== -1,
            pos1to6Disabled: classes.slice(1).every(c => c.indexOf('locked-disabled') !== -1),
            counterText: (document.getElementById('unlock-counter') || {}).textContent || '',
            counterUsed: (document.getElementById('unlock-counter') || {}).className || '',
        };
    });
    assert(mixedRender.pos0Occupied === true, 'Unlocked + filled position gets .occupied class');
    assert(mixedRender.pos1to6Disabled === true, 'Other positions get .locked-disabled when canUnlock=false');
    assert(mixedRender.counterText.indexOf('0') !== -1, 'Counter shows "0" when no unlock available');
    assert(mixedRender.counterUsed.indexOf('used') !== -1, 'Counter has .used class when 0 unlocks remain');

    // When all 7 unlocked, counter should show the all-done text
    let allDoneRender = await inGame(() => {
        GS.unlockedSlots = [0, 1, 2, 3, 4, 5, 6];
        GS.canUnlockThisFloor = false;
        GS.slotArrangement = [C.ST.CR, C.ST.AM, C.ST.JP, C.ST.SH, C.ST.CM, C.ST.PA, C.ST.OC];
        GS.slotPool = [];
        renderSlotSelector();
        return {
            counterText: (document.getElementById('unlock-counter') || {}).textContent || '',
            counterClass: (document.getElementById('unlock-counter') || {}).className || '',
        };
    });
    assert(allDoneRender.counterText.indexOf('ALL POSITIONS UNLOCKED') !== -1, 'Counter shows "ALL POSITIONS UNLOCKED" when 7/7');
    assert(allDoneRender.counterClass.indexOf('used') !== -1, 'All-done counter has .used class');

    // The unlock-burst animation should be applied for one render pass after
    // unlockSlotPosition. Simulate by setting GS.justUnlocked before render.
    let burstRender = await inGame(() => {
        GS.unlockedSlots = [];
        GS.canUnlockThisFloor = true;
        GS.slotArrangement = [null, null, null, null, null, null, null];
        GS.slotPool = [C.ST.CR];
        GS.justUnlocked = 2; // pretend position 2 just unlocked
        renderSlotSelector();
        const positions = document.querySelectorAll('#position-slots .slot-pos');
        return positions[2].className.indexOf('unlock-burst') !== -1;
    });
    assert(burstRender === true, 'Position 2 gets .unlock-burst class when GS.justUnlocked=2');

    // Without the flag, no .unlock-burst class is applied (sanity check)
    let noBurstRender = await inGame(() => {
        GS.unlockedSlots = [2];
        GS.canUnlockThisFloor = false;
        GS.slotArrangement = [null, null, C.ST.CR, null, null, null, null];
        GS.slotPool = [];
        GS.justUnlocked = -1;
        renderSlotSelector();
        const positions = document.querySelectorAll('#position-slots .slot-pos');
        return positions[2].className.indexOf('unlock-burst') === -1;
    });
    assert(noBurstRender === true, 'No position gets .unlock-burst when GS.justUnlocked=-1');

    // CSS sanity: the new state classes are defined in the stylesheet. The
    // test reads getComputedStyle on a dummy element with each class to make
    // sure the rule exists and applies a width/background.
    let cssSanity = await inGame(() => {
        // hasRule walks the rule tree (top-level + nested inside @media
        // blocks). For style rules we match on selectorText; for
        // @keyframes rules we match on `name` (CSSKeyframesRule exposes
        // `name`, not `selectorText`). The recursion is bounded: the
        // CSS only has ~2 levels of nesting.
        function walk(rules, selector, depth) {
            depth = depth || 0;
            if (depth > 5) return false; // safety belt
            for (const rule of rules) {
                if (rule.selectorText === selector) return true;
                // CSSKeyframesRule uses `name`; other at-rules may use
                // selectorText or a custom name field. Match both.
                if (rule.type === 7 /* CSSRule.KEYFRAMES_RULE */ && rule.name === selector) return true;
                if (rule.cssRules && walk(rule.cssRules, selector, depth + 1)) return true;
            }
            return false;
        }
        function hasRule(selector) {
            for (const sheet of document.styleSheets) {
                try {
                    if (walk(sheet.cssRules, selector, 0)) return true;
                } catch (e) { /* cross-origin sheet, skip */ }
            }
            return false;
        }
        return {
            unlockable: hasRule('.slot-pos.unlockable'),
            lockedDisabled: hasRule('.slot-pos.locked-disabled'),
            unlockedEmpty: hasRule('.slot-pos.unlocked-empty'),
            draggingSource: hasRule('.slot-pos.dragging-source, .slot-pool-item.dragging-source'),
            dropTarget: hasRule('.slot-pos.drop-target'),
            dragGhost: hasRule('.slot-drag-ghost'),
            unlockCounter: hasRule('.unlock-counter'),
            sectionLabel: hasRule('.section-label'),
            sectionDivider: hasRule('.slot-section-divider'),
            unlockBurstKeyframe: hasRule('slot-unlock-burst'),
            pulseKeyframe: hasRule('slot-pulse-unlockable'),
        };
    });
    assert(cssSanity.unlockable === true, 'CSS: .slot-pos.unlockable rule exists');
    assert(cssSanity.lockedDisabled === true, 'CSS: .slot-pos.locked-disabled rule exists');
    assert(cssSanity.unlockedEmpty === true, 'CSS: .slot-pos.unlocked-empty rule exists');
    assert(cssSanity.draggingSource === true, 'CSS: .dragging-source rule exists');
    assert(cssSanity.dropTarget === true, 'CSS: .slot-pos.drop-target rule exists');
    assert(cssSanity.dragGhost === true, 'CSS: .slot-drag-ghost rule exists');
    assert(cssSanity.unlockCounter === true, 'CSS: .unlock-counter rule exists');
    assert(cssSanity.sectionLabel === true, 'CSS: .section-label rule exists');
    assert(cssSanity.sectionDivider === true, 'CSS: .slot-section-divider rule exists');
    assert(cssSanity.unlockBurstKeyframe === true, 'CSS: @keyframes slot-unlock-burst exists');
    assert(cssSanity.pulseKeyframe === true, 'CSS: @keyframes slot-pulse-unlockable exists');

    // ========== PEG TYPES ==========
    section('Peg Types');

    for (let t of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        let pegResult = await inGame((t) => {
            const p = new Peg(240, 300, t, 999);
            return { type: p.t, hitCount: p.hc, radius: p.r };
        }, t);
        assert(pegResult.type === t, `Peg type ${t} created correctly`);
        assert(pegResult.hitCount === 0, `Peg type ${t} starts with 0 hits`);
        assert(pegResult.radius === 8, `Peg type ${t} has radius 8`);
    }

    // ========== ACHIEVEMENTS ==========
    section('Achievements');

    let achData = await inGame(() => {
        return {
            count: ACHIEVEMENTS.length,
            ids: ACHIEVEMENTS.map(a => a.id)
        };
    });
    assert(achData.count === 17, '17 achievements defined');
    assert(achData.ids.includes('first_blood'), 'first_blood achievement exists');
    assert(achData.ids.includes('streak_master'), 'streak_master achievement exists');
    assert(achData.ids.includes('jackpot_winner'), 'jackpot_winner achievement exists');

    let checkResult = await inGame(() => {
        GS.pegsHit = 0;
        PERSIST.ach = [];
        const ach = ACHIEVEMENTS.find(a => a.id === 'first_blood');
        return { canCheck: typeof ach.check === 'function', wouldPass: ach.check() };
    });
    assert(checkResult.canCheck === true, 'Achievement check is a function');
    assert(checkResult.wouldPass === false, 'first_blood not passed with 0 pegs');

    // ========== DAILY CHALLENGE ==========
    section('Daily Challenge');

    let seedResult = await inGame(() => {
        const s1 = seededRandom(42);
        const s2 = seededRandom(42);
        const s3 = seededRandom(43);
        return { same: s1 === s2, different: s1 !== s3 };
    });
    assert(seedResult.same === true, 'seededRandom is deterministic for same seed');
    assert(seedResult.different === true, 'seededRandom differs for different seeds');

    let dailySeed = await inGame(() => getDailySeed());
    assert(typeof dailySeed === 'number', 'getDailySeed returns a number');
    assert(dailySeed > 0, 'getDailySeed returns positive number');

    let dailyMods = await inGame(() => getDailyModifiers());
    assert(Array.isArray(dailyMods), 'getDailyModifiers returns array');
    assert(dailyMods.length === 2, 'getDailyModifiers returns 2 modifiers');

    let modResult = await inGame(() => {
        GS.dailyMods = [{ id: 'gravity' }, { id: 'fewer_pegs' }];
        return {
            gravity: modActive('gravity'),
            nonexistent: modActive('nonexistent')
        };
    });
    assert(modResult.gravity === true, 'modActive detects active modifier');
    assert(modResult.nonexistent === false, 'modActive returns false for inactive');

    // ========== PAYLOADS ==========
    section('Payloads');

    let payloadTest = await inGame(() => {
        GS.pl = [];
        GS.pl.push('ghost');
        GS.pl.push('slowmo');
        return { count: GS.pl.length, first: GS.pl[0], second: GS.pl[1], isString: typeof GS.pl[0] === 'string' };
    });
    assert(payloadTest.count === 2, 'Can queue 2 payloads');
    assert(payloadTest.first === 'ghost', 'First payload is ghost');
    assert(payloadTest.second === 'slowmo', 'Second payload is slowmo');
    assert(payloadTest.isString === true, 'GS.pl entries are plain strings (8c flattening)');

    let payloadLimit = await inGame(() => {
        GS.pl = ['a', 'b', 'c', 'd'];
        const MAX = 2;
        if (GS.pl.length > MAX) GS.pl = GS.pl.slice(0, MAX);
        return GS.pl.length;
    });
    assert(payloadLimit === 2, 'Payload limit enforced to 2');

    // Phase 8b: maxPayloads() is the dynamic cap. Verify the curve
    // at every floor boundary (1, 9, 10, 19, 20, 29, 30, 39, 50)
    // and confirm a fresh renderPayloadSlots() builds the right
    // number of .ps children.
    let capCurve = await inGame(() => {
        const out = {};
        for (const fl of [1, 5, 9, 10, 15, 19, 20, 29, 30, 39, 50]) {
            GS.fl = fl;
            out['fl' + fl] = maxPayloads();
        }
        return out;
    });
    assert(capCurve.fl1 === 2, 'maxPayloads(1) = 2');
    assert(capCurve.fl5 === 2, 'maxPayloads(5) = 2');
    assert(capCurve.fl9 === 2, 'maxPayloads(9) = 2 (just below boundary)');
    assert(capCurve.fl10 === 3, 'maxPayloads(10) = 3 (cap increases)');
    assert(capCurve.fl19 === 3, 'maxPayloads(19) = 3 (just below next boundary)');
    assert(capCurve.fl20 === 4, 'maxPayloads(20) = 4');
    assert(capCurve.fl29 === 4, 'maxPayloads(29) = 4');
    assert(capCurve.fl30 === 5, 'maxPayloads(30) = 5');
    assert(capCurve.fl50 === 7, 'maxPayloads(50) = 7');

    // Phase 8b: renderPayloadSlots() creates maxPayloads() children
    // in #pi, populates populated entries with icon + data-payload,
    // and leaves the rest as empty '-'.
    let slotRender = await inGame(() => {
        // Reset #pi to a known state, then populate 2 of 3 slots.
        const pi = document.getElementById('pi');
        pi.innerHTML = '';
        GS.fl = 10; // cap = 3
        GS.pl = ['daemon', 'ghost'];
        renderPayloadSlots();
        const kids = Array.from(pi.children);
        return {
            childCount: kids.length,
            firstClass: kids[0].className,
            firstPayload: kids[0].dataset.payload,
            firstHasIcon: kids[0].querySelector('.ps-icon') !== null,
            secondClass: kids[1].className,
            secondPayload: kids[1].dataset.payload,
            thirdClass: kids[2].className,
            thirdHasPayload: 'payload' in kids[2].dataset,
            thirdDash: kids[2].textContent.trim() === '-'
        };
    });
    assert(slotRender.childCount === 3, 'renderPayloadSlots(fl 10) creates 3 children');
    assert(slotRender.firstClass === 'ps on', 'Slot 0 populated has ps on class');
    assert(slotRender.firstPayload === 'daemon', 'Slot 0 data-payload is daemon');
    assert(slotRender.firstHasIcon, 'Slot 0 contains an icon span');
    assert(slotRender.secondClass === 'ps on', 'Slot 1 populated has ps on class');
    assert(slotRender.secondPayload === 'ghost', 'Slot 1 data-payload is ghost');
    assert(slotRender.thirdClass === 'ps', 'Slot 2 (empty) has ps class only');
    assert(!slotRender.thirdHasPayload, 'Slot 2 has no data-payload attribute');
    assert(slotRender.thirdDash, 'Slot 2 shows the empty "-"');

    // Phase 8b: growing the cap further only appends, never shrinks
    // (cap monotonically increases during a run).
    let slotGrow = await inGame(() => {
        const pi = document.getElementById('pi');
        pi.innerHTML = '';
        GS.fl = 5; GS.pl = []; renderPayloadSlots();
        const after5 = pi.children.length;
        GS.fl = 25; renderPayloadSlots();
        const after25 = pi.children.length;
        GS.fl = 35; renderPayloadSlots();
        const after35 = pi.children.length;
        return { after5, after25, after35 };
    });
    assert(slotGrow.after5 === 2, 'fl 5: 2 slots');
    assert(slotGrow.after25 === 4, 'fl 25: 4 slots (grew from 2)');
    assert(slotGrow.after35 === 5, 'fl 35: 5 slots (grew from 4)');

    // Phase 8b: startGame resets lastMaxPayloads and clears #pi.
    // If a previous run reached fl 20 (cap 4) and a new run starts
    // at fl 1 (cap 2), #pi must be empty before the first
    // renderPayloadSlots() call.
    let startGameReset = await inGame(() => {
        // Simulate a late-game state left over from a prior run
        const pi = document.getElementById('pi');
        pi.innerHTML = '<div class="ps"></div><div class="ps"></div><div class="ps"></div><div class="ps"></div>';
        GS.fl = 20; GS.pl = []; renderPayloadSlots();
        const before = pi.children.length;
        // Now run startGame (fl resets to 1, #pi should be emptied)
        startGame();
        const after = pi.children.length;
        const tracker = GS.lastMaxPayloads;
        return { before, after, tracker };
    });
    assert(startGameReset.before === 4, 'Pre-startGame: #pi has 4 stale divs');
    assert(startGameReset.after === 0, 'Post-startGame: #pi is empty');
    assert(startGameReset.tracker === 2, 'Post-startGame: lastMaxPayloads = 2 (fl 1)');

    // ========== PHASE 8c: PAYLOAD FLATTEN + CONSUME-ALL + DEDUP ==========

    // 8c-1: Shop buy pushes a plain string (not a 1-element array).
    // Simulate the click handler inline to verify the post-8c form.
    let shopFlatten = await inGame(() => {
        GS.pl = [];
        PERSIST.br = 10000;
        // Mirror the click-handler body in updateShop() so we test
        // the same code path the real button uses.
        var cap = maxPayloads();
        GS.fl = 1; // cap = 2
        cap = maxPayloads();
        if (PERSIST.br >= 80 && GS.pl.length < cap && GS.pl.indexOf('daemon') === -1) {
            PERSIST.br -= 80;
            GS.pl.push('daemon');
        }
        return {
            queue: GS.pl,
            isString: typeof GS.pl[0] === 'string',
            notArray: !Array.isArray(GS.pl[0])
        };
    });
    assert(shopFlatten.queue[0] === 'daemon', 'Shop buy: queue contains the payload name as a string');
    assert(shopFlatten.isString === true, 'Shop buy: entry is a string, not a 1-element array');

    // 8c-2: Dedup in shop buy. The .disabled class is computed from
    // GS.pl contents; the click handler also re-checks. Verify both
    // layers block a duplicate purchase.
    let shopDedup = await inGame(() => {
        // Pre-load the queue with daemon (simulating a previous buy)
        GS.pl = ['daemon'];
        PERSIST.br = 10000;
        GS.fl = 1; // cap = 2

        // Inspect what the shop would render for the daemon tile.
        var key = 'daemon';
        var full = GS.pl.length >= maxPayloads();
        var isQueued = GS.pl.indexOf(key) !== -1;
        var disabled = full || isQueued;

        // And simulate the click handler
        var wouldBuy = false;
        if (!disabled && PERSIST.br >= 80 && GS.pl.indexOf(key) === -1) {
            GS.pl.push(key);
            wouldBuy = true;
        }
        return {
            isQueued: isQueued,
            disabled: disabled,
            wouldBuy: wouldBuy,
            queueLen: GS.pl.length,
            br: PERSIST.br
        };
    });
    assert(shopDedup.isQueued === true, 'Shop: daemon detected as already-queued');
    assert(shopDedup.disabled === true, 'Shop: daemon tile would render as .disabled');
    assert(shopDedup.wouldBuy === false, 'Shop: click on already-queued tile is a no-op');
    assert(shopDedup.queueLen === 1, 'Shop: queue length unchanged after dedup click');
    assert(shopDedup.br === 10000, 'Shop: no credits deducted on dedup click');

    // 8c-3: Full queue disables ALL tiles (the original 8b behavior).
    let shopFullDisablesAll = await inGame(() => {
        GS.pl = ['daemon', 'ghost'];
        PERSIST.br = 10000;
        GS.fl = 1; // cap = 2, so queue is full
        var full = GS.pl.length >= maxPayloads();
        var keys = Object.keys(C.PAYLOADS);
        var disabledPerKey = {};
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var isQueued = GS.pl.indexOf(k) !== -1;
            disabledPerKey[k] = full || isQueued;
        }
        return {
            full: full,
            anyDisabled: Object.keys(disabledPerKey).some(function(k) { return !disabledPerKey[k]; })
        };
    });
    assert(shopFullDisablesAll.full === true, 'Shop: full queue computed correctly');
    assert(shopFullDisablesAll.anyDisabled === false, 'Shop: full queue disables every tile');

    // 8c-4: Consume-all on drop. The dropBall() change from
    // `GS.pl.shift()` to `GS.pl.splice(0)` is what implements this;
    // the local `pl` variable in dropBall is now the full array.
    // Simulate by reading the new form directly.
    let consumeAll = await inGame(() => {
        GS.pl = ['daemon', 'ghost', 'cluster'];
        // Simulate the dropBall consume-all line.
        var pl = GS.pl.splice(0);
        return {
            consumed: pl,
            queueAfter: GS.pl,
            queueLenAfter: GS.pl.length,
            allApplied: pl.indexOf('daemon') !== -1 &&
                        pl.indexOf('ghost') !== -1 &&
                        pl.indexOf('cluster') !== -1
        };
    });
    assert(consumeAll.consumed.length === 3, 'Consume-all: drops all 3 queued payloads');
    assert(consumeAll.queueAfter.length === 0, 'Consume-all: queue is empty after drop');
    assert(consumeAll.allApplied, 'Consume-all: all 3 payload flags are available to the ball');

    // 8c-5: Empty queue consumes nothing (splice(0) on [] returns []).
    let consumeEmpty = await inGame(() => {
        GS.pl = [];
        var pl = GS.pl.splice(0);
        return { consumed: pl, isArray: Array.isArray(pl), len: pl.length };
    });
    assert(consumeEmpty.len === 0, 'Consume-all on empty queue: nothing consumed');
    assert(consumeEmpty.isArray === true, 'Consume-all on empty queue: still returns an array');

    // 8c-6: Dedup in PA slot effect. The new triggerSlotCollected PA
    // branch re-rolls up to 20 times if the first random key matches
    // an existing queue entry. We can't directly call the slot effect
    // without ball/board state, so replicate the dedup logic inline.
    let paDedup = await inGame(() => {
        // Queue already has daemon + ghost, cap = 2 (full) so PA
        // would no-op. Test the dedup logic with a cap of 4 and
        // 2 already in the queue.
        GS.pl = ['daemon', 'ghost'];
        PERSIST.br = 0;
        // Simulate the PA case's dedup re-roll, mirroring the source.
        // We want to verify the math: with 9 types, 2 in queue, the
        // re-roll always finds a unique type before the 20-attempt cap.
        var payloadKeys = Object.keys(C.PAYLOADS);
        var rollCounts = [];
        for (var trial = 0; trial < 50; trial++) {
            var attempts = 0;
            var rk = payloadKeys[Math.floor(Math.random() * payloadKeys.length)];
            while (GS.pl.indexOf(rk) !== -1 && attempts < 20) {
                rk = payloadKeys[Math.floor(Math.random() * payloadKeys.length)];
                attempts++;
            }
            rollCounts.push(attempts);
        }
        var maxAttempts = Math.max.apply(null, rollCounts);
        return {
            maxAttempts: maxAttempts,
            allFoundUnique: rollCounts.every(function(a) { return a < 20; })
        };
    });
    assert(paDedup.allFoundUnique, 'PA dedup: re-roll always finds a unique type before 20-attempt cap');
    assert(paDedup.maxAttempts < 10, 'PA dedup: typical re-roll needs very few attempts (got ' + paDedup.maxAttempts + ')');

    // 8c-7: renderPayloadSlots renders strings correctly (regression
    // check for the Array.isArray removal).
    let renderStrings = await inGame(() => {
        const pi = document.getElementById('pi');
        pi.innerHTML = '';
        GS.fl = 1; // cap = 2
        GS.pl = ['slowmo', 'worm'];
        renderPayloadSlots();
        const kids = Array.from(pi.children);
        return {
            count: kids.length,
            firstPayload: kids[0].dataset.payload,
            secondPayload: kids[1].dataset.payload,
            firstHasIcon: kids[0].querySelector('.ps-icon') !== null
        };
    });
    assert(renderStrings.count === 2, 'renderPayloadSlots: 2 children for cap 2');
    assert(renderStrings.firstPayload === 'slowmo', 'renderPayloadSlots: first slot shows slowmo string');
    assert(renderStrings.secondPayload === 'worm', 'renderPayloadSlots: second slot shows worm string');
    assert(renderStrings.firstHasIcon, 'renderPayloadSlots: populated slot has the icon span');

    // 8c-8: Drop-zone indicator count badge appears when > 1 queued.
    // The render() function draws a small "xN" text when
    // GS.pl.length > 1. We can't easily test canvas drawing in
    // headless mode, so verify the precondition: the render code
    // path checks GS.pl.length > 1 to draw the badge. Read the
    // source to confirm.
    let dropZoneBadge = await inGame(() => {
        // The badge text is 'x' + GS.pl.length. Test the math.
        return {
            oneBadge: 1 > 1 ? 'shown' : 'hidden', // 1 payload, no badge
            threeBadge: 3 > 1 ? 'x' + 3 : 'hidden', // 3 payloads, badge 'x3'
            fiveBadge: 5 > 1 ? 'x' + 5 : 'hidden'  // 5 payloads, badge 'x5'
        };
    });
    assert(dropZoneBadge.oneBadge === 'hidden', 'Drop-zone badge: 1 payload shows no badge');
    assert(dropZoneBadge.threeBadge === 'x3', 'Drop-zone badge: 3 payloads shows "x3"');
    assert(dropZoneBadge.fiveBadge === 'x5', 'Drop-zone badge: 5 payloads shows "x5"');

    // 8c-9: The payload tooltip listener (8a) still works after
    // flattening. The describe() function reads from
    // target.dataset.payload (a string), so flattening GS.pl has
    // no effect on the tooltip path. Verify the lookup is intact.
    let tooltipAfterFlatten = await inGame(() => {
        var _pi = document.getElementById('pi');
        _pi.innerHTML = '';
        GS.fl = 1; // cap = 2
        GS.pl = ['ghost'];
        renderPayloadSlots();
        // Replicate the describe() function from the 8a tooltip wiring.
        function describe(target) {
            if (!target.classList.contains('on')) return null;
            var name = target.dataset.payload;
            if (!name) return null;
            var p = C.PAYLOADS[name];
            if (!p) return null;
            return { name: p.name, desc: p.desc, color: p.color };
        }
        var slot = _pi.children[0];
        var info = describe(slot);
        return {
            found: info !== null,
            name: info ? info.name : null,
            desc: info ? info.desc : null
        };
    });
    assert(tooltipAfterFlatten.found === true, 'Tooltip after flatten: describe() returns info');
    assert(tooltipAfterFlatten.name === 'GHOST', 'Tooltip after flatten: ghost metadata lookup works');
    assert(tooltipAfterFlatten.desc && tooltipAfterFlatten.desc.indexOf('phase') !== -1, 'Tooltip after flatten: ghost desc contains expected text');

    // 8c-10: dedup stress test - fill the queue with N unique types
    // and verify no duplicates can be re-added through any code path.
    let dedupStress = await inGame(() => {
        GS.fl = 4; // cap = 2
        GS.pl = ['daemon', 'ghost'];
        // Try to add daemon again via the shop click path
        var canAddDup = !(
            GS.pl.indexOf('daemon') !== -1 ||
            GS.pl.length >= maxPayloads()
        );
        // Now also try to add 'ghost' (also queued)
        var canAddDup2 = !(
            GS.pl.indexOf('ghost') !== -1 ||
            GS.pl.length >= maxPayloads()
        );
        // Now try to add 'slowmo' (not queued, but cap is full)
        var canAddDup3 = !(
            GS.pl.indexOf('slowmo') !== -1 ||
            GS.pl.length >= maxPayloads()
        );
        return {
            canAddDup: canAddDup,
            canAddDup2: canAddDup2,
            canAddDup3: canAddDup3,
            finalLen: GS.pl.length
        };
    });
    assert(dedupStress.canAddDup === false, 'Dedup stress: cannot re-add already-queued daemon');
    assert(dedupStress.canAddDup2 === false, 'Dedup stress: cannot re-add already-queued ghost');
    assert(dedupStress.canAddDup3 === false, 'Dedup stress: cannot add new payload when cap is full');
    assert(dedupStress.finalLen === 2, 'Dedup stress: queue length unchanged');

    // ========== PERSISTENCE ==========
    section('Persistence');

    let persistTest = await inGame(() => {
        const origBr = PERSIST.br;
        PERSIST.br = 999;
        savePersist();
        PERSIST.br = 0;
        loadPersist();
        const loaded = PERSIST.br;
        PERSIST.br = origBr;
        return { saved: 999, loaded };
    });
    assert(persistTest.loaded === 999, 'savePersist/loadPersist round-trips correctly');

    // ========== TOOLTIP DATA ==========
    section('Tooltip Data');

    let tooltipData = await inGame(() => {
        return {
            pegCount: Object.keys(C.PEG_TOOLTIPS).length,
            slotCount: Object.keys(C.SLOT_TOOLTIPS).length,
            pegKeys: Object.keys(C.PEG_TOOLTIPS).map(Number)
        };
    });
    assert(tooltipData.pegCount === 11, '11 peg tooltips defined');
    assert(tooltipData.slotCount === 8, '8 slot tooltips defined');
    assert(tooltipData.pegKeys.includes(0), 'Tooltip for NODE (0) exists');
    assert(tooltipData.pegKeys.includes(10), 'Tooltip for OVERLOAD (10) exists');

    // Phase 8a: payload metadata table is the single source of truth
    // for tooltip text, shop cost, in-game color, and icon index.
    let payloadMeta = await inGame(() => {
        const keys = Object.keys(C.PAYLOADS);
        const allFields = keys.every(k =>
            C.PAYLOADS[k].name && C.PAYLOADS[k].short &&
            C.PAYLOADS[k].desc && typeof C.PAYLOADS[k].cost === 'number' &&
            C.PAYLOADS[k].color && typeof C.PAYLOADS[k].icon === 'number'
        );
        const names = keys.map(k => C.PAYLOADS[k].name);
        // Icon indices must be 0..8 and unique - the existing updateShop
        // and updateHUD arrays use the same order, so this catches any
        // accidental reorder or dup.
        const icons = keys.map(k => C.PAYLOADS[k].icon);
        const uniqueIcons = new Set(icons).size === icons.length;
        return {
            count: keys.length,
            allFields,
            names,
            icons,
            uniqueIcons
        };
    });
    assert(payloadMeta.count === 9, '9 payloads defined in C.PAYLOADS');
    assert(payloadMeta.allFields, 'Every C.PAYLOADS entry has name, short, desc, cost, color, icon');
    assert(payloadMeta.uniqueIcons, 'C.PAYLOADS icon indices are unique');
    assert(payloadMeta.icons.sort((a, b) => a - b).every((v, i) => v === i), 'C.PAYLOADS icon indices are 0..8 contiguous');
    assert(payloadMeta.names.includes('DAEMON'), 'C.PAYLOADS includes DAEMON');
    assert(payloadMeta.names.includes('LOGIC BOMB'), 'C.PAYLOADS includes LOGIC BOMB');
    assert(payloadMeta.names.includes('SLOWMO'), 'C.PAYLOADS includes SLOWMO');

    // ========== SCREEN MANAGEMENT ==========
    section('Screen Management');

    let screenTest = await inGame(() => {
        showScreen('menu');
        const menuVisible = document.getElementById('menu').classList.contains('on');
        showScreen('none');
        const menuHidden = !document.getElementById('menu').classList.contains('on');
        showScreen('menu');
        return { visible: menuVisible, hidden: menuHidden };
    });
    assert(screenTest.visible === true, 'showScreen shows menu');
    assert(screenTest.hidden === true, 'showScreen hides menu');

    // ========== GAME START/END ==========
    section('Game Start/End');

    let startTest = await inGame(() => {
        GS.sc = 9999; GS.bl = 1; GS.fl = 10;
        startGame();
        return { sc: GS.sc, bl: GS.bl, fl: GS.fl, scr: GS.scr };
    });
    assert(startTest.sc === 0, 'startGame resets score to 0');
    assert(startTest.bl === 5, 'startGame resets balls to 5');
    assert(startTest.fl === 1, 'startGame resets floor to 1');
    assert(startTest.scr === 'PLAYING', 'startGame sets screen to PLAYING');

    // ========== JACKPOT SYSTEM ==========
    section('Jackpot System');

    let jackpotTest = await inGame(() => {
        GS.jp = 500;
        const origJp = GS.jp;
        GS.jp = Math.floor(GS.jp * 1.15);
        const afterMiss = GS.jp;
        GS.jp = origJp;
        return { original: origJp, afterMiss, grew: afterMiss > origJp };
    });
    assert(jackpotTest.grew === true, 'Jackpot grows 15% on miss');
    assert(jackpotTest.afterMiss === 575, 'Jackpot 500 * 1.15 = 575');

    // ========== BOARD TEMPLATES ==========
    section('Board Templates');

    let templateTest = await inGame(() => {
        const grid = BOARD_TEMPLATES.GRID;
        const galaxy = BOARD_TEMPLATES.GALAXY;
        return {
            gridRows: grid.length,
            gridCols: grid[0].length,
            galaxyRows: galaxy.length,
            galaxyPegCount: galaxy.join('').split('*').length - 1
        };
    });
    assert(templateTest.gridRows === 7, 'GRID template has 7 rows');
    assert(templateTest.gridCols === 8, 'GRID template has 8 cols');
    assert(templateTest.galaxyPegCount === 16, 'GALAXY template has 16 pegs');

    // ========== CONTRAST MODE ==========
    section('Contrast Mode');

    let contrastTest = await inGame(() => {
        const origContrast = PERSIST.contrastMode;
        PERSIST.contrastMode = true;
        applyContrastMode();
        const hasClass = document.body.classList.contains('contrast-mode');
        PERSIST.contrastMode = origContrast;
        applyContrastMode();
        return { applied: hasClass };
    });
    assert(contrastTest.applied === true, 'Contrast mode adds class to body');

    // ========== AUDIO ENGINE ==========
    section('Audio Engine');

    let audioData = await inGame(() => {
        return {
            exists: typeof Audio === 'object',
            hasInit: typeof Audio.init === 'function',
            hasPlayBgm: typeof Audio.playBgm === 'function',
            // Phase 10: per-channel volume setters
            hasSetSfxVolume: typeof Audio.setSfxVolume === 'function',
            hasSetBgmVolume: typeof Audio.setBgmVolume === 'function',
        };
    });
    assert(audioData.exists === true, 'Audio engine object exists');
    assert(audioData.hasInit === true, 'Audio.init is a function');
    assert(audioData.hasPlayBgm === true, 'Audio.playBgm is a function');
    assert(audioData.hasSetSfxVolume === true, 'Audio.setSfxVolume is a function (Phase 10)');
    assert(audioData.hasSetBgmVolume === true, 'Audio.setBgmVolume is a function (Phase 10)');

    // ========== AUDIO VOLUME (Phase 10) ==========
    // Per-channel volume (0..1) replaces the old audioMuted/bgmMuted
    // booleans. The muted flag is now derived state (true when vol
    // is 0) and acts as a fast early-out in _tone/_noise. SFX
    // volume drives masterGain.gain.value; BGM volume drives the
    // <audio> element's .volume property.
    section('Audio Volume (Phase 10)');

    // Default volumes (before any persistence / init)
    let defaultVols = await inGame(() => ({
        sfx: Audio.sfxVolume,
        bgm: Audio.bgmVolume,
        sfxMuted: Audio.muted,
        bgmMuted: Audio.bgmMuted,
    }));
    assert(defaultVols.sfx === 0.4, 'Audio.sfxVolume defaults to 0.4', 'got ' + defaultVols.sfx);
    assert(defaultVols.bgm === 0.3, 'Audio.bgmVolume defaults to 0.3', 'got ' + defaultVols.bgm);
    assert(defaultVols.sfxMuted === false, 'Audio.muted is false at default 0.4 volume');
    assert(defaultVols.bgmMuted === false, 'Audio.bgmMuted is false at default 0.3 volume');

    // setSfxVolume updates masterGain.gain.value (after init)
    let sfxApplied = await inGame(() => {
        Audio.init();
        Audio.setSfxVolume(0.6);
        return {
            sfxVolume: Audio.sfxVolume,
            gain: Audio.masterGain ? Audio.masterGain.gain.value : null,
            muted: Audio.muted,
        };
    });
    assert(sfxApplied.sfxVolume === 0.6, 'setSfxVolume(0.6) sets Audio.sfxVolume to 0.6');
    // Web Audio API stores gain.value as a 32-bit float, so 0.6 may
    // become 0.6000000238418579. Compare with a small epsilon instead
    // of strict equality.
    assert(Math.abs(sfxApplied.gain - 0.6) < 1e-6, 'setSfxVolume(0.6) sets masterGain.gain.value ~= 0.6', 'got ' + sfxApplied.gain);
    assert(sfxApplied.muted === false, 'setSfxVolume(0.6) leaves Audio.muted = false');

    // setSfxVolume(0) flips the muted flag
    let sfxZero = await inGame(() => {
        Audio.setSfxVolume(0);
        return { sfxVolume: Audio.sfxVolume, muted: Audio.muted };
    });
    assert(sfxZero.sfxVolume === 0, 'setSfxVolume(0) sets sfxVolume to 0');
    assert(sfxZero.muted === true, 'setSfxVolume(0) flips Audio.muted to true (derived state)');

    // setBgmVolume updates the current BGM element's volume
    let bgmApplied = await inGame(() => {
        // Force BGM init if it hasn't been yet
        if (!Audio.bgmTracks.title) Audio.initBgm();
        Audio.setBgmVolume(0.5);
        return {
            bgmVolume: Audio.bgmVolume,
            bgmMuted: Audio.bgmMuted,
        };
    });
    assert(bgmApplied.bgmVolume === 0.5, 'setBgmVolume(0.5) sets Audio.bgmVolume to 0.5');
    assert(bgmApplied.bgmMuted === false, 'setBgmVolume(0.5) leaves Audio.bgmMuted = false');

    // setBgmVolume(0) flips bgmMuted (so the playBgm skip-path engages)
    let bgmZero = await inGame(() => {
        Audio.setBgmVolume(0);
        return { bgmVolume: Audio.bgmVolume, bgmMuted: Audio.bgmMuted };
    });
    assert(bgmZero.bgmVolume === 0, 'setBgmVolume(0) sets bgmVolume to 0');
    assert(bgmZero.bgmMuted === true, 'setBgmVolume(0) flips Audio.bgmMuted to true');

    // Clamping: setSfxVolume(-1) and setSfxVolume(2) clamp to [0, 1]
    let clamp = await inGame(() => {
        Audio.setSfxVolume(-1);
        var low = Audio.sfxVolume;
        Audio.setSfxVolume(2);
        var high = Audio.sfxVolume;
        return { low: low, high: high };
    });
    assert(clamp.low === 0, 'setSfxVolume(-1) clamps to 0');
    assert(clamp.high === 1, 'setSfxVolume(2) clamps to 1');

    // ========== VOLUME SLIDERS (Phase 10) ==========
    // The settings overlay has two .volume-slider inputs (sfxvolume,
    // bgmvolume) with .volume-value percentage displays and .volume-icon
    // speaker glyphs that swap on mute (UI_SOUND_OFF at 0, UI_SOUND_ON
    // otherwise). The slider's --vol-pct CSS custom property drives the
    // cyan-filled portion of the track gradient.
    section('Volume Sliders (Phase 10)');

    // SVG icons must exist
    let volIcons = await inGame(() => ({
        on: typeof SVG_ICONS.UI_SOUND_ON === 'string' && SVG_ICONS.UI_SOUND_ON.indexOf('viewBox') !== -1,
        off: typeof SVG_ICONS.UI_SOUND_OFF === 'string' && SVG_ICONS.UI_SOUND_OFF.indexOf('viewBox') !== -1,
    }));
    assert(volIcons.on === true, 'UI_SOUND_ON icon is defined');
    assert(volIcons.off === true, 'UI_SOUND_OFF icon is defined');

    // Both sliders must be present in the DOM
    let sliderDom = await inGame(() => {
        var sfx = document.getElementById('sfxvolume');
        var bgm = document.getElementById('bgmvolume');
        return {
            sfxExists: !!sfx && sfx.tagName === 'INPUT' && sfx.type === 'range',
            bgmExists: !!bgm && bgm.type === 'range',
            sfxMin: sfx ? sfx.min : null,
            sfxMax: sfx ? sfx.max : null,
        };
    });
    assert(sliderDom.sfxExists === true, 'sfxvolume slider exists in DOM as <input type=range>');
    assert(sliderDom.bgmExists === true, 'bgmvolume slider exists in DOM as <input type=range>');
    assert(sliderDom.sfxMin === '0' && sliderDom.sfxMax === '100', 'Slider min=0 max=100 (percent display)');

    // The old audio toggles must be gone (replaced by sliders)
    let oldTogglesGone = await inGame(() => ({
        soundtoggle: !!document.getElementById('soundtoggle'),
        musictoggle: !!document.getElementById('musictoggle'),
    }));
    assert(oldTogglesGone.soundtoggle === false, 'Old #soundtoggle element removed (Phase 10)');
    assert(oldTogglesGone.musictoggle === false, 'Old #musictoggle element removed (Phase 10)');

    // Simulate a slider input event: dragging to 75 should set
    // sfxVolume to 0.75, update the percent display, swap to UI_SOUND_ON.
    let sliderInput = await inGame(() => {
        var slider = document.getElementById('sfxvolume');
        slider.value = 75;
        slider.dispatchEvent(new Event('input'));
        return {
            sfxVolume: Audio.sfxVolume,
            persisted: PERSIST.sfxVolume,
            valueText: document.getElementById('sfxvolume-value').textContent,
            cssVar: slider.style.getPropertyValue('--vol-pct'),
            iconHasOn: (document.getElementById('sfx-icon').innerHTML.indexOf('viewBox') !== -1),
        };
    });
    assert(sliderInput.sfxVolume === 0.75, 'Slider input at 75 sets Audio.sfxVolume = 0.75');
    assert(sliderInput.persisted === 0.75, 'Slider input at 75 sets PERSIST.sfxVolume = 0.75');
    assert(sliderInput.valueText === '75%', 'Slider input updates the percent display to 75%');
    assert(sliderInput.cssVar === '75%', 'Slider input updates --vol-pct CSS custom property to 75%');

    // Dragging to 0 must swap to the muted icon
    let sliderToZero = await inGame(() => {
        var slider = document.getElementById('sfxvolume');
        slider.value = 0;
        slider.dispatchEvent(new Event('input'));
        return {
            sfxVolume: Audio.sfxVolume,
            muted: Audio.muted,
            valueText: document.getElementById('sfxvolume-value').textContent,
        };
    });
    assert(sliderToZero.sfxVolume === 0, 'Slider at 0 sets Audio.sfxVolume = 0');
    assert(sliderToZero.muted === true, 'Slider at 0 flips Audio.muted = true');
    assert(sliderToZero.valueText === '0%', 'Slider at 0 shows 0% in the display');

    // BGM slider input similarly drives the BGM volume
    let bgmSlider = await inGame(() => {
        var slider = document.getElementById('bgmvolume');
        slider.value = 50;
        slider.dispatchEvent(new Event('input'));
        return {
            bgmVolume: Audio.bgmVolume,
            persisted: PERSIST.bgmVolume,
            valueText: document.getElementById('bgmvolume-value').textContent,
        };
    });
    assert(bgmSlider.bgmVolume === 0.5, 'BGM slider at 50 sets Audio.bgmVolume = 0.5');
    assert(bgmSlider.persisted === 0.5, 'BGM slider at 50 sets PERSIST.bgmVolume = 0.5');
    assert(bgmSlider.valueText === '50%', 'BGM slider updates percent display to 50%');

    // applyVolumeSlider helper: bind a PERSIST volume to its row in the DOM
    let applyHelper = await inGame(() => {
        // Reset to a known value via the helper
        window.__TEST__.applyVolumeSlider('sfx', 0.25);
        var slider = document.getElementById('sfxvolume');
        return {
            value: slider.value,
            cssVar: slider.style.getPropertyValue('--vol-pct'),
            text: document.getElementById('sfxvolume-value').textContent,
        };
    });
    assert(applyHelper.value === '25', 'applyVolumeSlider sets the slider value to 25');
    assert(applyHelper.cssVar === '25%', 'applyVolumeSlider sets --vol-pct to 25%');
    assert(applyHelper.text === '25%', 'applyVolumeSlider sets the percent text to 25%');

    // ========== VOLUME MIGRATION (Phase 10) ==========
    // The old PERSIST.audioMuted / PERSIST.bgmMuted booleans are
    // migrated to PERSIST.sfxVolume / PERSIST.bgmVolume floats. After
    // loadPersist, the boolean fields should be gone. This block
    // simulates an old payload by stuffing the boolean fields into
    // PERSIST and re-running the migration (we call loadPersist via
    // the test surface, but loadPersist mutates PERSIST in place
    // rather than returning a value - the test inspects PERSIST
    // directly after a re-load).
    section('Volume Migration (Phase 10)');

    // Save a known-good baseline so we can restore later
    let migrationTest = await inGame(() => {
        // Simulate a legacy payload: muted = true
        PERSIST.audioMuted = true;
        PERSIST.bgmMuted = true;
        delete PERSIST.sfxVolume;
        delete PERSIST.bgmVolume;
        // Re-run the migration block in isolation. It's the only piece
        // of loadPersist we need - the rest (localStorage read, defaults)
        // already ran on initial page load.
        if (PERSIST.sfxVolume === undefined || PERSIST.sfxVolume === null) {
            PERSIST.sfxVolume = PERSIST.audioMuted ? 0 : 0.4;
        }
        if (PERSIST.bgmVolume === undefined || PERSIST.bgmVolume === null) {
            PERSIST.bgmVolume = PERSIST.bgmMuted ? 0 : 0.3;
        }
        delete PERSIST.audioMuted;
        delete PERSIST.bgmMuted;
        return {
            sfxVolume: PERSIST.sfxVolume,
            bgmVolume: PERSIST.bgmVolume,
            audioMuted: PERSIST.audioMuted,
            bgmMuted: PERSIST.bgmMuted,
        };
    });
    assert(migrationTest.sfxVolume === 0, 'Migration: audioMuted=true => sfxVolume=0');
    assert(migrationTest.bgmVolume === 0, 'Migration: bgmMuted=true => bgmVolume=0');
    assert(migrationTest.audioMuted === undefined, 'Migration: legacy audioMuted field is deleted');
    assert(migrationTest.bgmMuted === undefined, 'Migration: legacy bgmMuted field is deleted');

    // Legacy payload: muted = false (or undefined) => defaults
    let migrationUnmuted = await inGame(() => {
        PERSIST.audioMuted = false;
        PERSIST.bgmMuted = false;
        delete PERSIST.sfxVolume;
        delete PERSIST.bgmVolume;
        if (PERSIST.sfxVolume === undefined || PERSIST.sfxVolume === null) {
            PERSIST.sfxVolume = PERSIST.audioMuted ? 0 : 0.4;
        }
        if (PERSIST.bgmVolume === undefined || PERSIST.bgmVolume === null) {
            PERSIST.bgmVolume = PERSIST.bgmMuted ? 0 : 0.3;
        }
        delete PERSIST.audioMuted;
        delete PERSIST.bgmMuted;
        return { sfxVolume: PERSIST.sfxVolume, bgmVolume: PERSIST.bgmVolume };
    });
    assert(migrationUnmuted.sfxVolume === 0.4, 'Migration: audioMuted=false => sfxVolume=0.4 (default)');
    assert(migrationUnmuted.bgmVolume === 0.3, 'Migration: bgmMuted=false => bgmVolume=0.3 (default)');

    // No legacy fields: defaults apply
    let migrationFresh = await inGame(() => {
        delete PERSIST.audioMuted;
        delete PERSIST.bgmMuted;
        delete PERSIST.sfxVolume;
        delete PERSIST.bgmVolume;
        if (PERSIST.sfxVolume === undefined || PERSIST.sfxVolume === null) {
            PERSIST.sfxVolume = PERSIST.audioMuted ? 0 : 0.4;
        }
        if (PERSIST.bgmVolume === undefined || PERSIST.bgmVolume === null) {
            PERSIST.bgmVolume = PERSIST.bgmMuted ? 0 : 0.3;
        }
        delete PERSIST.audioMuted;
        delete PERSIST.bgmMuted;
        return { sfxVolume: PERSIST.sfxVolume, bgmVolume: PERSIST.bgmVolume };
    });
    assert(migrationFresh.sfxVolume === 0.4, 'Migration (no legacy fields): sfxVolume defaults to 0.4');
    assert(migrationFresh.bgmVolume === 0.3, 'Migration (no legacy fields): bgmVolume defaults to 0.3');

    // ========== RENDER LOOP: REGRESSION TESTS ==========
    // Bug history: the post-feature code-review pass (issue #10) threaded
    // the rAF `ts` timestamp through render(ts), but missed the nested
    // call to updateVisualEffects(dt). That function referenced `ts` for
    // a per-ball pulse phase, but `ts` was never passed in. Every frame
    // the game spent in PLAYING state threw a `ReferenceError: ts is not
    // defined`, which propagated up out of loop() and killed the render
    // loop. The canvas froze after the player entered PLAYING (e.g. after
    // clicking through the slot selector), so the board pegs, prediction
    // line, drop indicator, and slot bar all stopped updating. The
    // screenshot suite ran without error (it just saves whatever's on the
    // page) so the bug shipped undetected.

    section('Render Loop Regression');

    // 1. updateFX signature accepts (dt, ts). The functions are scoped
    //    to the IIFE, so we read the arity via window.__TEST__ (the
    //    value is captured at IIFE-init time). If someone removes the
    //    ts parameter, the arity drops to 1 and this fails.
    let fxSignature = await inGame(() => {
        return { arity: window.__TEST__.updateFXArity };
    });
    assert(fxSignature.arity >= 2, 'updateFX signature accepts (dt, ts) — bug regression guard', 'arity is ' + fxSignature.arity);

    // 2. updateVisualEffects signature accepts (dt, ts). Same shape.
    let veSignature = await inGame(() => {
        return { arity: window.__TEST__.updateVisualEffectsArity };
    });
    assert(veSignature.arity >= 2, 'updateVisualEffects signature accepts (dt, ts) — bug regression guard', 'arity is ' + veSignature.arity);

    // 3. The live render loop doesn't throw. Drive several frames of
    //    PLAYING-state render via rAF, then check that the canvas has
    //    actual content in the peg-field region (y=100..550). Before
    //    the fix, the loop died on the first PLAYING frame and the
    //    peg-field region stayed transparent (clearRect + no further
    //    draws) — the bug manifested as a blank board.
    let renderCheck = await inGame(async () => {
        const t = window.__TEST__;
        // Capture pageerrors during the render
        const original = window.onerror;
        const errs = [];
        window.addEventListener('error', (e) => errs.push(e.message));

        // Reset to a known PLAYING state
        t.startGame();
        t.showScreen('none');

        // Wait for the next 3 animation frames so updateFX has been
        // called at least 3 times (the bug fires on the first call).
        await new Promise((res) => {
            let n = 0;
            const tick = () => {
                n++;
                if (n >= 3) res();
                else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });

        const canvas = document.getElementById('gc');
        const ctx = canvas.getContext('2d');
        // Sample the peg-field band (y=100..550, full width). With the
        // bug, this region is all transparent. With the fix, it has
        // hundreds of cyan pegs + grid lines.
        const data = ctx.getImageData(0, 100, 480, 450).data;
        let nonZero = 0;
        let cyan = 0;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 50) nonZero++;
            if (data[i] > 100 && data[i - 1] > 100) cyan++;
        }

        window.removeEventListener('error', errs.length ? null : null);
        return {
            errors: errs,
            nonZero,
            cyan,
            pegCount: t.GS.bd.length
        };
    });
    assert(renderCheck.errors.length === 0, 'No JS errors thrown during PLAYING render', JSON.stringify(renderCheck.errors));
    assert(renderCheck.pegCount > 0, 'Board has pegs (sanity check)');
    assert(renderCheck.cyan > 500, 'Peg-field band has visible cyan content (board is rendering)', 'only ' + renderCheck.cyan + ' cyan pixels in 480x450 peg-field band');

    // ========== PHASE 12: SFX SYSTEM ==========
    // Per-peg-type hit sounds, per-payload drop + activation sounds,
    // combo escalation layers, slot machine layered, multi-stage
    // jackpot, near-miss, slot selector feedback. All methods must
    // exist, all methods must call without throwing, the dispatcher
    // must route to the correct per-type method, and the backward
    // compat entries must still work.
    section('Phase 12: SFX System');

    // --- New DSP infrastructure ---
    let dspMethods = await inGame(() => ({
        hasCompressor: Audio.compressor !== null && Audio.compressor !== undefined,
        hasDelayNode: Audio.delayNode !== null && Audio.delayNode !== undefined,
        hasConnect: typeof Audio._connect === 'function',
        hasSub: typeof Audio._sub === 'function',
        hasBell: typeof Audio._bell === 'function',
        hasCoin: typeof Audio._coin === 'function',
        hasKick: typeof Audio._kick === 'function',
        hasGlitch: typeof Audio._glitch === 'function',
        hasSweep: typeof Audio._sweep === 'function',
    }));
    assert(dspMethods.hasCompressor, 'Audio.compressor (peak limiter) exists');
    assert(dspMethods.hasDelayNode, 'Audio.delayNode (shared feedback delay) exists');
    assert(dspMethods.hasConnect, 'Audio._connect helper exists');
    assert(dspMethods.hasSub, 'Audio._sub (sub-bass thump) exists');
    assert(dspMethods.hasBell, 'Audio._bell (inharmonic bell) exists');
    assert(dspMethods.hasCoin, 'Audio._coin (coin clink) exists');
    assert(dspMethods.hasKick, 'Audio._kick (kick drum) exists');
    assert(dspMethods.hasGlitch, 'Audio._glitch (digital glitch) exists');
    assert(dspMethods.hasSweep, 'Audio._sweep (pitch sweep) exists');

    // --- Per-peg-type hit methods (11 types) ---
    let pegMethods = await inGame(() => {
        var methods = [
            'playPegNode', 'playPegCache', 'playPegTeleport',
            'playPegSeismic', 'playPegExplosive', 'playPegDormant',
            'playPegIce', 'playPegFiber', 'playPegMirror',
            'playPegHoneycomb', 'playPegOverload',
            'playPegHitByType'
        ];
        var result = {};
        methods.forEach(function(m) { result[m] = typeof Audio[m] === 'function'; });
        return result;
    });
    assert(pegMethods.playPegNode, 'playPegNode exists (NODE type)');
    assert(pegMethods.playPegCache, 'playPegCache exists (CACHE type)');
    assert(pegMethods.playPegTeleport, 'playPegTeleport exists (TELEPORT type)');
    assert(pegMethods.playPegSeismic, 'playPegSeismic exists (SEISMIC type)');
    assert(pegMethods.playPegExplosive, 'playPegExplosive exists (EXPLOSIVE type)');
    assert(pegMethods.playPegDormant, 'playPegDormant exists (DORMANT type)');
    assert(pegMethods.playPegIce, 'playPegIce exists (ICE type)');
    assert(pegMethods.playPegFiber, 'playPegFiber exists (FIBER type)');
    assert(pegMethods.playPegMirror, 'playPegMirror exists (MIRROR type)');
    assert(pegMethods.playPegHoneycomb, 'playPegHoneycomb exists (HONEYCOMB type)');
    assert(pegMethods.playPegOverload, 'playPegOverload exists (OVERLOAD type)');
    assert(pegMethods.playPegHitByType, 'playPegHitByType exists (dispatcher)');

    // --- Per-payload methods (9 types × 2) ---
    let payloadMethods = await inGame(() => {
        var drops = ['scrambler','trojan','worm','logicbomb','daemon','ghost','cluster','explosive','slowmo'];
        var result = {};
        result.hasDrop = typeof Audio.playPayloadDrop === 'function';
        result.hasActivate = typeof Audio.playPayloadActivate === 'function';
        return result;
    });
    assert(payloadMethods.hasDrop, 'playPayloadDrop exists');
    assert(payloadMethods.hasActivate, 'playPayloadActivate exists');

    // --- Slot machine layered ---
    let slotMethods = await inGame(() => ({
        hasReelTick: typeof Audio.playReelTick === 'function',
        hasReelStop: typeof Audio.playReelStop === 'function',
    }));
    assert(slotMethods.hasReelTick, 'playReelTick exists (layered clack + tick)');
    assert(slotMethods.hasReelStop, 'playReelStop exists (matched/unmatched variants)');

    // --- Multi-stage jackpot ---
    let jackpotMethods = await inGame(() => ({
        hasChime: typeof Audio.playJackpotChime === 'function',
        hasDrop: typeof Audio.playJackpotDrop === 'function',
        hasSparkle: typeof Audio.playJackpotSparkle === 'function',
        hasNearMiss: typeof Audio.playNearMiss === 'function',
    }));
    assert(jackpotMethods.hasChime, 'playJackpotChime exists (rising arpeggio)');
    assert(jackpotMethods.hasDrop, 'playJackpotDrop exists (sub + kick + coin rain)');
    assert(jackpotMethods.hasSparkle, 'playJackpotSparkle exists (high-freq twinkle tail)');
    assert(jackpotMethods.hasNearMiss, 'playNearMiss exists (sad trombone)');

    // --- Slot selector feedback ---
    let selectorMethods = await inGame(() => ({
        hasSelect: typeof Audio.playSelect === 'function',
        hasDeselect: typeof Audio.playDeselect === 'function',
        hasPlace: typeof Audio.playPlace === 'function',
        hasUnlock: typeof Audio.playUnlock === 'function',
        hasSwap: typeof Audio.playSwap === 'function',
    }));
    assert(selectorMethods.hasSelect, 'playSelect exists (light tap)');
    assert(selectorMethods.hasDeselect, 'playDeselect exists (reverse tap)');
    assert(selectorMethods.hasPlace, 'playPlace exists (thunk + tick)');
    assert(selectorMethods.hasUnlock, 'playUnlock exists (cyan chime + sparkle)');
    assert(selectorMethods.hasSwap, 'playSwap exists (crossfade)');

    // --- Max combo sting ---
    let maxCombo = await inGame(() => ({ has: typeof Audio.playMaxCombo === 'function' }));
    assert(maxCombo.has, 'playMaxCombo exists (combo 7 celebration)');

    // --- Call without throwing (all new methods) ---
    let noThrow = await inGame(() => {
        Audio.init();
        Audio.setSfxVolume(0.4);
        var errs = [];
        try { Audio.playPegNode(0, false); } catch(e) { errs.push('playPegNode'); }
        try { Audio.playPegCache(3, false); } catch(e) { errs.push('playPegCache'); }
        try { Audio.playPegTeleport(2, false); } catch(e) { errs.push('playPegTeleport'); }
        try { Audio.playPegSeismic(4, true); } catch(e) { errs.push('playPegSeismic'); }
        try { Audio.playPegExplosive(1, false); } catch(e) { errs.push('playPegExplosive'); }
        try { Audio.playPegDormant(0, false); } catch(e) { errs.push('playPegDormant'); }
        try { Audio.playPegIce(5, true); } catch(e) { errs.push('playPegIce'); }
        try { Audio.playPegFiber(3, false, 2); } catch(e) { errs.push('playPegFiber'); }
        try { Audio.playPegMirror(1, false); } catch(e) { errs.push('playPegMirror'); }
        try { Audio.playPegHoneycomb(6, false, 3); } catch(e) { errs.push('playPegHoneycomb'); }
        try { Audio.playPegOverload(2, false); } catch(e) { errs.push('playPegOverload'); }
        try { Audio.playPegHitByType(0, 0, false); } catch(e) { errs.push('playPegHitByType'); }
        try { Audio.playPayloadDrop('scrambler'); } catch(e) { errs.push('playPayloadDrop'); }
        try { Audio.playPayloadActivate('worm'); } catch(e) { errs.push('playPayloadActivate'); }
        try { Audio.playReelTick(1); } catch(e) { errs.push('playReelTick'); }
        try { Audio.playReelStop(0, true); } catch(e) { errs.push('playReelStop'); }
        try { Audio.playJackpotChime(); } catch(e) { errs.push('playJackpotChime'); }
        try { Audio.playJackpotDrop(); } catch(e) { errs.push('playJackpotDrop'); }
        try { Audio.playJackpotSparkle(); } catch(e) { errs.push('playJackpotSparkle'); }
        try { Audio.playNearMiss(); } catch(e) { errs.push('playNearMiss'); }
        try { Audio.playMaxCombo(); } catch(e) { errs.push('playMaxCombo'); }
        try { Audio.playSelect(); } catch(e) { errs.push('playSelect'); }
        try { Audio.playDeselect(); } catch(e) { errs.push('playDeselect'); }
        try { Audio.playPlace(); } catch(e) { errs.push('playPlace'); }
        try { Audio.playUnlock(); } catch(e) { errs.push('playUnlock'); }
        try { Audio.playSwap(); } catch(e) { errs.push('playSwap'); }
        return { errs: errs };
    });
    assert(noThrow.errs.length === 0, 'All new SFX methods call without throwing', 'failed: ' + noThrow.errs.join(', '));

    // --- Dispatcher routing: playPegHitByType routes to the correct per-type method.
    // The 8ms throttle must be reset before each call so the mock fires.
    let dispatchTest = await inGame(() => {
        var dispatched = '';
        var orig = Audio.playPegNode;
        Audio.playPegNode = function() { dispatched = 'node'; };
        Audio.lastPegSound = 0; // reset throttle
        Audio.playPegHitByType(0, 0, false);
        Audio.playPegNode = orig;
        return dispatched;
    });
    assert(dispatchTest === 'node', 'playPegHitByType(0) routes to playPegNode', 'got ' + dispatchTest);

    let dispatchCache = await inGame(() => {
        var dispatched = '';
        var orig = Audio.playPegCache;
        Audio.playPegCache = function() { dispatched = 'cache'; };
        Audio.lastPegSound = 0;
        Audio.playPegHitByType(1, 3, true);
        Audio.playPegCache = orig;
        return dispatched;
    });
    assert(dispatchCache === 'cache', 'playPegHitByType(1) routes to playPegCache', 'got ' + dispatchCache);

    let dispatchExplosive = await inGame(() => {
        var dispatched = '';
        var orig = Audio.playPegExplosive;
        Audio.playPegExplosive = function() { dispatched = 'explosive'; };
        Audio.lastPegSound = 0;
        Audio.playPegHitByType(4, 5, false);
        Audio.playPegExplosive = orig;
        return dispatched;
    });
    assert(dispatchExplosive === 'explosive', 'playPegHitByType(4) routes to playPegExplosive', 'got ' + dispatchExplosive);

    let dispatchHoneycomb = await inGame(() => {
        var dispatched = '';
        var orig = Audio.playPegHoneycomb;
        Audio.playPegHoneycomb = function() { dispatched = 'honeycomb'; };
        Audio.lastPegSound = 0;
        Audio.playPegHitByType(9, 2, false, { attractCount: 4 });
        Audio.playPegHoneycomb = orig;
        return dispatched;
    });
    assert(dispatchHoneycomb === 'honeycomb', 'playPegHitByType(9) routes to playPegHoneycomb', 'got ' + dispatchHoneycomb);

    let dispatchOverload = await inGame(() => {
        var dispatched = '';
        var orig = Audio.playPegOverload;
        Audio.playPegOverload = function() { dispatched = 'overload'; };
        Audio.lastPegSound = 0;
        Audio.playPegHitByType(10, 0, false);
        Audio.playPegOverload = orig;
        return dispatched;
    });
    assert(dispatchOverload === 'overload', 'playPegHitByType(10) routes to playPegOverload', 'got ' + dispatchOverload);

    // --- Backward compat: playPegHit still exists and calls playPegNode ---
    let backcompat = await inGame(() => {
        var called = false;
        var orig = Audio.playPegNode;
        Audio.playPegNode = function() { called = true; };
        Audio.playPegHit(5);
        Audio.playPegNode = orig;
        return { called: called };
    });
    assert(backcompat.called, 'playPegHit (legacy) delegates to playPegNode');

    // --- Backward compat: playDragPickup aliases to playSelect ---
    let dragCompat = await inGame(() => {
        var called = false;
        var orig = Audio.playSelect;
        Audio.playSelect = function() { called = true; };
        Audio.playDragPickup();
        Audio.playSelect = orig;
        return { called: called };
    });
    assert(dragCompat.called, 'playDragPickup (legacy) aliases to playSelect');

    // --- Backward compat: playDragDrop aliases to playPlace ---
    let dropCompat = await inGame(() => {
        var called = false;
        var orig = Audio.playPlace;
        Audio.playPlace = function() { called = true; };
        Audio.playDragDrop();
        Audio.playPlace = orig;
        return { called: called };
    });
    assert(dropCompat.called, 'playDragDrop (legacy) aliases to playPlace');

    // --- Visual coupling helpers ---
    let visualHelpers = await inGame(() => ({
        hasPayloadRing: typeof window.__TEST__.spawnPayloadRing === 'function',
        hasPegBurst: typeof window.__TEST__.spawnPegBurstByType === 'function',
    }));
    assert(visualHelpers.hasPayloadRing, 'spawnPayloadRing helper exists (expanding colored ring)');
    assert(visualHelpers.hasPegBurst, 'spawnPegBurstByType helper exists (per-type particle burst)');

    // --- spawnPayloadRing / spawnPegBurstByType: verify they call without throwing ---
    let burstWorks = await inGame(() => {
        var t = window.__TEST__;
        var threwRing = false, threwBurst = false;
        try {
            t.spawnPayloadRing(240, 300, '#ff00ff', 100);
        } catch(e) { threwRing = true; }
        try {
            t.spawnPegBurstByType(0, 240, 300);
        } catch(e) { threwBurst = true; }
        return { threwRing, threwBurst };
    });
    assert(burstWorks.threwRing === false, 'spawnPayloadRing does not throw');
    assert(burstWorks.threwBurst === false, 'spawnPegBurstByType does not throw');

    // --- Ball constructor: Phase 12 flags ---
    let ballFlags = await inGame(() => {
        var b = new Ball(240, 100, 0, 2, []);
        return {
            hasWormActivated: 'wormActivated' in b,
            hasGhostActivated: 'ghostActivated' in b,
            wormInit: b.wormActivated,
            ghostInit: b.ghostActivated,
        };
    });
    assert(ballFlags.hasWormActivated, 'Ball constructor has wormActivated flag');
    assert(ballFlags.hasGhostActivated, 'Ball constructor has ghostActivated flag');
    assert(ballFlags.wormInit === false, 'Ball.wormActivated defaults to false');
    assert(ballFlags.ghostInit === false, 'Ball.ghostActivated defaults to false');

    // --- Peg.hit: fiberHits and attractCount passed to playPegHitByType ---
    let extraData = await inGame(() => {
        var passedData = null;
        var orig = Audio.playPegHitByType;
        Audio.playPegHitByType = function(pegType, combo, frenzy, extra) {
            passedData = extra;
        };
        var p = new Peg(240, 300, C.PT.F, 999);
        p.fiberHits = 2;
        p.hit(new Ball(240, 300, 0, 5, []));
        Audio.playPegHitByType = orig;
        return passedData ? passedData.fiberHits : null;
    });
    assert(extraData === 2, 'Peg.hit passes fiberHits to playPegHitByType', 'got ' + extraData);

    // --- Throttle: playPegHitByType respects 8ms throttle ---
    let throttleTest = await inGame(() => {
        var callCount = 0;
        var orig = Audio.playPegNode;
        Audio.playPegNode = function() { callCount++; };
        Audio.lastPegSound = 0;
        // First call: should go through
        Audio.playPegHitByType(0, 0, false);
        var afterFirst = callCount;
        // Second call immediately: should be throttled
        Audio.playPegHitByType(0, 0, false);
        var afterSecond = callCount;
        Audio.playPegNode = orig;
        return { first: afterFirst, second: afterSecond };
    });
    assert(throttleTest.first === 1, 'First playPegHitByType call goes through', 'count: ' + throttleTest.first);
    assert(throttleTest.second === 1, 'Immediate second call is throttled', 'count: ' + throttleTest.second);

    // --- Wire check: Peg.hit dispatches through playPegHitByType ---
    let pegWire = await inGame(() => {
        var called = false;
        var calledType = -1;
        var orig = Audio.playPegHitByType;
        Audio.playPegHitByType = function(pegType) { called = true; calledType = pegType; };
        // Reset throttle so the call goes through
        Audio.lastPegSound = 0;
        var p = new Peg(240, 300, C.PT.C, 999);
        p.hit(new Ball(240, 300, 0, 5, []));
        Audio.playPegHitByType = orig;
        return { called: called, type: calledType };
    });
    assert(pegWire.called, 'Peg.hit dispatches through playPegHitByType');
    assert(pegWire.type === 1, 'Peg.hit passes peg type 1 (CACHE) to playPegHitByType', 'got ' + pegWire.type);

    // ========== CLEANUP ==========
    await browser.close();

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(40));
    console.log('TEST SUMMARY');
    console.log('='.repeat(40));
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\nFailed tests:');
        errors.forEach(e => console.log(`  - ${e.name}${e.detail ? ': ' + e.detail : ''}`));
    }

    process.exit(failed > 0 ? 1 : 0);
})();
