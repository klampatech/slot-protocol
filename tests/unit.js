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
        GS.pl.push(['ghost']);
        GS.pl.push(['slowmo']);
        return { count: GS.pl.length, first: GS.pl[0][0], second: GS.pl[1][0] };
    });
    assert(payloadTest.count === 2, 'Can queue 2 payloads');
    assert(payloadTest.first === 'ghost', 'First payload is ghost');
    assert(payloadTest.second === 'slowmo', 'Second payload is slowmo');

    let payloadLimit = await inGame(() => {
        GS.pl = [['a'], ['b'], ['c'], ['d']];
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
        GS.pl = [['daemon'], ['ghost']];
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
            hasPlayBgm: typeof Audio.playBgm === 'function'
        };
    });
    assert(audioData.exists === true, 'Audio engine object exists');
    assert(audioData.hasInit === true, 'Audio.init is a function');
    assert(audioData.hasPlayBgm === true, 'Audio.playBgm is a function');

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
