/**
 * Mobile tests for Slot Protocol.
 * Uses Playwright device emulation to exercise touch events and
 * mobile viewports. Regression coverage for Phase 11 (mobile compat
 * pass): board-scaling layout fix + slot-selector tap/drag fixes.
 *
 * Devices are chosen to span:
 *  - Pixel 7 (the user-reported device, 412x839, Android Chrome)
 *  - iPhone 13 (390x664, iOS Safari-shape, notched)
 *  - iPhone SE 1st gen (320x568, the smallest realistic viewport)
 *  - iPad Mini (768x1024 portrait, larger layout to catch any
 *    desktop-only assumptions)
 *
 * Each test runs in a fresh context with the device's viewport +
 * hasTouch + isMobile set, so pointer events fire as touch and the
 * layout/scale logic sees the real mobile viewport dimensions.
 *
 * The layout/scale section is the regression guard for 11-A: it
 * fails loudly if the scaler overflows the viewport (the bug the
 * user hit on Pixel 7a). The slot-selector sections are the
 * regression guard for 11-B: tap-to-swap fails on a device if
 * pointerup's elementFromPoint is not used (e.target stays frozen
 * to the pointerdown target with setPointerCapture).
 */
const { chromium, devices } = require('playwright');
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

const TARGETS = [
    { name: 'Pixel 7',  device: 'Pixel 7' },
    { name: 'iPhone 13', device: 'iPhone 13' },
    { name: 'iPhone SE', device: 'iPhone SE' },
    { name: 'iPad Mini', device: 'iPad Mini' },
];

async function withDevice(browser, deviceName, fn) {
    const ctx = await browser.newContext(devices[deviceName]);
    const page = await ctx.newPage();
    await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);
    await page.waitForFunction('window.__TEST__ !== undefined', { timeout: 5000 });
    try {
        await fn(page);
    } finally {
        await ctx.close();
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });

    // ========== LAYOUT / SCALING (regression for Phase 11-A) ==========
    section('Layout / Scaling');
    for (const t of TARGETS) {
        await withDevice(browser, t.device, async (page) => {
            const m = await page.evaluate(() => {
                const s = window.__slotScale || 1;
                const sr = document.getElementById('scaler').getBoundingClientRect();
                return {
                    scale: s,
                    left: sr.left, right: sr.right, top: sr.top, bottom: sr.bottom,
                    w: sr.width, h: sr.height,
                    vpW: window.innerWidth, vpH: window.innerHeight,
                };
            });
            // 1px tolerance for sub-pixel rounding.
            assert(m.scale >= 0.40 && m.scale <= 1.0, `${t.name}: scale in [0.4, 1.0]`, `scale=${m.scale.toFixed(3)}`);
            assert(m.left >= -1, `${t.name}: scaler left within viewport (>= -1)`, `left=${m.left.toFixed(1)}`);
            assert(m.right <= m.vpW + 1, `${t.name}: scaler right within viewport (<= vpW+1)`, `right=${m.right.toFixed(1)} vpW=${m.vpW}`);
            assert(m.bottom <= m.vpH + 1, `${t.name}: scaler bottom within viewport`, `bottom=${m.bottom.toFixed(1)} vpH=${m.vpH}`);
            // The scaler's visual width should match the design width × scale
            // (within 2px for rounding).
            const expectedW = 480 * m.scale;
            const expectedH = 700 * m.scale;
            assert(Math.abs(m.w - expectedW) < 2, `${t.name}: scaler width ≈ 480*scale`, `w=${m.w.toFixed(1)} expected≈${expectedW.toFixed(1)}`);
            assert(Math.abs(m.h - expectedH) < 2, `${t.name}: scaler height ≈ 700*scale`, `h=${m.h.toFixed(1)} expected≈${expectedH.toFixed(1)}`);
        });
    }

    // ========== CANVAS TAP DROPS A BALL ==========
    section('Canvas Tap Drops Ball');
    for (const t of TARGETS) {
        await withDevice(browser, t.device, async (page) => {
            await page.evaluate(() => {
                // The game script is wrapped in an IIFE, so startGame /
                // GS / showScreen are not in window scope. Reach them
                // via window.__TEST__ (exposed at the end of the IIFE).
                const T = window.__TEST__;
                T.startGame();
                // Skip the slot-selector; arrange slots programmatically
                // so the canvas is reachable.
                T.GS.unlockedSlots = [0, 1, 2, 3, 4, 5, 6];
                T.GS.slotArrangement = [1, 2, 1, 2, 1, 2, 1];
                T.showScreen('none');
            });
            await page.waitForTimeout(100);
            const before = await page.evaluate(() => window.__TEST__.GS.ball !== null ? 1 : 0);
            // Tap in the drop zone (top center of the canvas).
            await page.tap('#gc', { position: { x: 240, y: 25 } });
            await page.waitForTimeout(80);
            const after = await page.evaluate(() => window.__TEST__.GS.ball !== null ? 1 : 0);
            assert(after === before + 1, `${t.name}: canvas tap drops a ball`, `before=${before} after=${after}`);
        });
    }

    // ========== SLOT-SELECTOR TAP-TO-PLACE (Phase 11-B regression) ==========
    section('Slot-Selector: Tap-to-Place');
    for (const t of TARGETS) {
        await withDevice(browser, t.device, async (page) => {
            await page.evaluate(() => {
                window.__TEST__.startGame();
                // startGame calls initSlotArrangement which calls
                // renderSlotSelector, so the .slot-pool-item and
                // .slot-pos elements are populated.
            });
            await page.waitForTimeout(150);
            // Tap a pool item -> selection set.
            await page.tap('.slot-pool-item[data-pool-idx="0"]');
            await page.waitForTimeout(60);
            const sel = await page.evaluate(() => window.__TEST__.GS.selectedSlot ? window.__TEST__.GS.selectedSlot.source : null);
            assert(sel === 'pool', `${t.name}: tap pool item selects it`, `sel=${sel}`);
            // Tap a position -> place the slot.
            await page.tap('.slot-pos[data-pos="0"]');
            await page.waitForTimeout(60);
            const arrangement = await page.evaluate(() => window.__TEST__.GS.slotArrangement[0]);
            assert(arrangement !== null && arrangement !== undefined,
                `${t.name}: tap position after pool fill assigns slot`, `arrangement[0]=${arrangement}`);
        });
    }

    // ========== SLOT-SELECTOR TAP-TO-SWAP (Phase 11-B regression) ==========
    section('Slot-Selector: Tap-to-Swap');
    for (const t of TARGETS) {
        await withDevice(browser, t.device, async (page) => {
            await page.evaluate(() => {
                const T = window.__TEST__;
                T.startGame();
                // After startGame the slot-selector is open. Set up two
                // occupied positions programmatically, then re-render.
                // We use slot types 1 (CR) and 2 (AM) so the swap is
                // distinguishable in the assertion.
                T.GS.unlockedSlots = [0, 1];
                T.GS.slotArrangement = [1, 2, null, null, null, null, null];
                T.renderSlotSelector();
            });
            await page.waitForTimeout(150);
            // Tap pos 0 -> select for swap.
            await page.tap('.slot-pos[data-pos="0"]');
            await page.waitForTimeout(60);
            const sel = await page.evaluate(() => window.__TEST__.GS.selectedSlot ? window.__TEST__.GS.selectedSlot.source : null);
            assert(sel && sel.indexOf('pos') === 0, `${t.name}: tap pos 0 selects it for swap`, `sel=${sel}`);
            // Tap pos 1 -> swap.
            await page.tap('.slot-pos[data-pos="1"]');
            await page.waitForTimeout(60);
            const result = await page.evaluate(() => ({ a0: window.__TEST__.GS.slotArrangement[0], a1: window.__TEST__.GS.slotArrangement[1] }));
            assert(result.a0 === 2 && result.a1 === 1,
                `${t.name}: tap pos 0 then pos 1 swaps slots (was 1,2; expect 2,1)`,
                `a0=${result.a0} a1=${result.a1}`);
        });
    }

    // ========== SLOT-SELECTOR DRAG-AND-DROP (Phase 11-B regression) ==========
    section('Slot-Selector: Drag-and-Drop');
    for (const t of TARGETS) {
        await withDevice(browser, t.device, async (page) => {
            await page.evaluate(() => {
                window.__TEST__.startGame();
            });
            await page.waitForTimeout(150);
            // Synthetic drag via PointerEvent dispatching. page.mouse
            // on a touch context is unreliable for cross-gesture
            // simulation (some Chromium builds don't translate mouse
            // to touch for the full pointermove sequence), and the
            // slot-selector IIFE is event-target-agnostic once the
            // listeners are wired. The synthetic events exercise the
            // exact same listener paths as real touch: pointerdown on
            // the pool item bubbles up to _slotSel, the handler
            // records drag state, pointermove past threshold starts
            // the drag, pointerup drops on the position.
            const dragged = await page.evaluate(async () => {
                const pool = document.querySelector('.slot-pool-item[data-pool-idx="0"]');
                const pos = document.querySelector('.slot-pos[data-pos="2"]');
                if (!pool || !pos) return { ok: false, reason: 'elements not found' };
                const poolRect = pool.getBoundingClientRect();
                const posRect = pos.getBoundingClientRect();
                const startX = poolRect.left + poolRect.width / 2;
                const startY = poolRect.top + poolRect.height / 2;
                const endX = posRect.left + posRect.width / 2;
                const endY = posRect.top + posRect.height / 2;
                const opts = (x, y) => ({
                    bubbles: true, cancelable: true,
                    pointerId: 1, pointerType: 'touch',
                    clientX: x, clientY: y, isPrimary: true,
                });
                // 1. pointerdown on the pool item (bubbles to _slotSel).
                pool.dispatchEvent(new PointerEvent('pointerdown', opts(startX, startY)));
                // 2. pointermove past threshold (10px) - dispatch on
                //    document so the window-level fallback listener
                //    (installed if setPointerCapture no-ops on the
                //    synthetic event) also fires. The Phase 11 IIFE
                //    is symmetric between the two paths.
                await new Promise(r => setTimeout(r, 20));
                const dx = endX - startX, dy = endY - startY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                // First move: just past the 10px threshold.
                const firstStepX = startX + (dx / dist) * 15;
                const firstStepY = startY + (dy / dist) * 15;
                document.dispatchEvent(new PointerEvent('pointermove', opts(firstStepX, firstStepY)));
                await new Promise(r => setTimeout(r, 20));
                // Subsequent moves: halfway, then onto the target.
                document.dispatchEvent(new PointerEvent('pointermove', opts(startX + dx * 0.5, startY + dy * 0.5)));
                await new Promise(r => setTimeout(r, 20));
                document.dispatchEvent(new PointerEvent('pointermove', opts(endX, endY)));
                await new Promise(r => setTimeout(r, 20));
                // 3. pointerup on the target (on document so the
                //    fallback listener also catches it).
                document.dispatchEvent(new PointerEvent('pointerup', opts(endX, endY)));
                await new Promise(r => setTimeout(r, 60));
                return { ok: true, arrangement: window.__TEST__.GS.slotArrangement[2] };
            });
            assert(dragged.ok && dragged.arrangement !== null && dragged.arrangement !== undefined,
                `${t.name}: drag pool to position 2 assigns slot`, `arrangement[2]=${dragged.arrangement}`);
        });
    }

    await browser.close();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Mobile test results: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        console.log('\nFailed tests:');
        for (const e of errors) {
            console.log(`  - ${e.name}${e.detail ? ': ' + e.detail : ''}`);
        }
        process.exit(1);
    }
})();
