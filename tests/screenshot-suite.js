const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS = []; // { name, file, must: [{label, ok, detail}] }

function record(name, file, must) {
    SCREENSHOTS.push({ name, file, must });
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 960, height: 800 } });
    const page = await context.newPage();

    // Surface JS errors to the console so a buggy render loop can't
    // silently produce a blank screenshot (this is what allowed the
    // ts-reference bug in updateVisualEffects to ship undetected in
    // 8a/8b - the screenshot suite happily saved blank pages).
    const pageErrors = [];
    page.on('pageerror', (err) => {
        pageErrors.push(err.message);
    });

    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const filePath = path.join(__dirname, '..', 'index.html');
    const fileUrl = `file://${filePath}`;

    console.log('Loading game from:', fileUrl);
    await page.goto(fileUrl);
    await page.waitForTimeout(1500);

    // Click function that forces through any overlay issues
    async function clickButton(selector) {
        await page.evaluate((sel) => {
            document.querySelector(sel).click();
        }, selector);
        await page.waitForTimeout(600);
    }

    // ========== Visual assertions ==========
    // Each must[] entry is { label, fn(canvas, ctx) -> {ok, detail} }.
    // The fn receives the canvas element and its 2D context; it returns
    // {ok: boolean, detail: string}. Tests run synchronously after the
    // page settles. Failed assertions get printed and counted.
    //
    // Why this matters: a previous "all screenshots captured!" pass
    // produced several blank-board screenshots because the render loop
    // threw on the first PLAYING frame. The suite didn't notice because
    // it never read the canvas back. These assertions are the eyes.

    async function readCanvasRegion(screenshotName, must) {
        // Each must entry is a type-tagged operation. Playwright can't
        // serialize real functions across page.evaluate, so the actual
        // assertion logic lives inside the page (this function body)
        // and we just dispatch on the type.
        const result = await page.evaluate((mustSpec) => {
            const canvas = document.getElementById('gc');
            const ctx = canvas ? canvas.getContext('2d') : null;
            const out = [];
            for (const m of mustSpec) {
                try {
                    let r;
                    if (m.type === 'overlayAny') {
                        const visible = m.selectors.find(s => {
                            const el = document.querySelector(s);
                            return el && el.classList.contains('on');
                        });
                        r = {
                            ok: !!visible,
                            detail: visible ? 'visible: ' + visible : 'none of ' + m.selectors.join(', ') + ' visible'
                        };
                    } else if (m.type === 'overlay') {
                        const el = document.querySelector(m.selector);
                        r = { ok: !!(el && el.classList.contains('on')), detail: el ? '' : 'element missing' };
                    } else if (m.type === 'hudText') {
                        const el = Array.from(document.querySelectorAll('.hs, .hss, .hsj, .hsb, .hud-text'))
                            .find(e => e.textContent && e.textContent.toUpperCase().indexOf(m.text.toUpperCase()) !== -1);
                        r = { ok: !!el, detail: el ? 'found' : 'not found in HUD' };
                    } else if (m.type === 'pegBand') {
                        if (!ctx) { r = { ok: false, detail: 'no canvas context' }; }
                        else {
                            const data = ctx.getImageData(0, m.y, canvas.width, m.height).data;
                            // Count any non-near-background pixel in the
                            // peg-field band. The canvas is cleared to
                            // transparent (so unpegged areas show through
                            // to the body bg of rgb(10, 10, 18)) and the
                            // grid is drawn at alpha 0.05 (very dim). Pegs
                            // are drawn as full-color circles - any
                            // peg-type color (cyan, yellow, purple,
                            // orange, red) has at least one channel with
                            // value > 80 once alpha is applied. So we
                            // count pixels where max(R, G, B) > 60 with
                            // alpha > 40 - that catches the peg body
                            // and the bright anti-aliased edges while
                            // rejecting the dim grid lines and the
                            // background.
                            let bright = 0;
                            for (let i = 3; i < data.length; i += 4) {
                                const a = data[i];
                                const r = data[i - 3];
                                const g = data[i - 2];
                                const b = data[i - 1];
                                if (a > 40 && Math.max(r, g, b) > 60) bright++;
                            }
                            r = {
                                ok: bright >= m.minBright,
                                detail: `${bright} bright peg-band pixels in ${canvas.width}x${m.height} region (need >= ${m.minBright})`
                            };
                        }
                    } else if (m.type === 'pageError') {
                        // The test harness tracks page errors via page.on('pageerror').
                        // The page context can't see those directly, so this op
                        // is a no-op here; the harness reports any errors at the
                        // end of the run. We always pass; the harness will fail
                        // the run if any errors were captured.
                        r = { ok: true, detail: 'pageerror tracking is harness-side' };
                    } else {
                        r = { ok: false, detail: 'unknown assertion type: ' + m.type };
                    }
                    out.push({ label: m.label, ok: !!r.ok, detail: r.detail || '' });
                } catch (e) {
                    out.push({ label: m.label, ok: false, detail: 'threw: ' + e.message });
                }
            }
            return { results: out };
        }, must);
        record(screenshotName, null, result.results);
    }

    // Pixel-band helper - counts non-background pixels in a region of
    // the canvas (any peg color: cyan, yellow, purple, orange, red).
    function pegFieldBand({ y = 100, height = 450, minBright = 500 } = {}) {
        return {
            type: 'pegBand',
            y, height, minBright,
            label: `Peg field band y=${y}..${y + height} has >= ${minBright} bright (non-bg) pixels`
        };
    }

    function hudTextVisible(text) {
        return {
            type: 'hudText',
            text,
            label: `HUD contains text "${text}"`
        };
    }

    function overlayVisible(selector) {
        return {
            type: 'overlay',
            selector,
            label: `Overlay ${selector} is visible (.on class present)`
        };
    }

    // 1. Menu Screen — note: first-time visitors see the tutorial first
    //    (PERSIST.hasTut === false and PERSIST.tr === 0). The screenshot
    //    file is still called 01-menu.png because the suite has always
    //    named it that, but it actually shows the tutorial. The previous
    //    version of this suite never asserted the visible overlay, so the
    //    misnaming went unnoticed. We assert the correct overlay is on
    //    by reading the actual state, not by trusting the file name.
    console.log('Capturing: First-time screen (tutorial or menu)');
    await page.screenshot({ path: path.join(screenshotDir, '01-menu.png') });
    await readCanvasRegion('01-menu', [
        // First-time visitors see the tutorial; returning visitors see
        // the menu. Accept either overlay. If neither is visible the
        // page didn't initialize correctly.
        { type: 'overlayAny', selectors: ['#tut', '#menu'],
          label: 'Either #tut (first-time) or #menu (returning) overlay is visible' }
    ]);

    // 2. Tutorial Overlay
    console.log('Capturing: Tutorial');
    await clickButton('#tutb');
    await page.screenshot({ path: path.join(screenshotDir, '02-tutorial.png') });
    await readCanvasRegion('02-tutorial', [
        overlayVisible('#tut')
    ]);
    await clickButton('#tutcb');

    // 3. Achievements Overlay
    console.log('Capturing: Achievements');
    await clickButton('#achb');
    await page.screenshot({ path: path.join(screenshotDir, '03-achievements.png') });
    await readCanvasRegion('03-achievements', [
        overlayVisible('#ach')
    ]);
    await clickButton('#achclb');

    // 4. Leaderboard Overlay
    console.log('Capturing: Leaderboard');
    await clickButton('#lbb');
    await page.screenshot({ path: path.join(screenshotDir, '04-leaderboard.png') });
    await readCanvasRegion('04-leaderboard', [
        overlayVisible('#lb')
    ]);
    await clickButton('#lbclb');

    // 5. Settings Overlay
    console.log('Capturing: Settings');
    await clickButton('#settingsb');
    await page.screenshot({ path: path.join(screenshotDir, '05-settings.png') });
    await readCanvasRegion('05-settings', [
        overlayVisible('#settings')
    ]);
    await clickButton('#settclb');

    // 5b. Settings bottom (scroll down) - the legend is at the bottom
    console.log('Capturing: Settings (bottom)');
    await clickButton('#settingsb');
    await page.evaluate(() => {
        const el = document.getElementById('settings');
        if (el) el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '05b-settings-bottom.png') });
    await clickButton('#settclb');

    // Click on menu again to ensure we're there
    await page.evaluate(() => {
        document.querySelectorAll('.ov').forEach(o => o.classList.remove('on'));
        document.querySelector('#menu').classList.add('on');
    });
    await page.waitForTimeout(300);

    // Start a new game to test gameplay screens
    console.log('\n--- Starting Game ---');
    await clickButton('#startb');
    await page.waitForTimeout(1000);

    // 6. Slot Selector (pre-floor setup)
    console.log('Capturing: Slot Selector');
    await page.screenshot({ path: path.join(screenshotDir, '06-slot-selector.png') });
    await readCanvasRegion('06-slot-selector', [
        overlayVisible('#slot-selector')
    ]);

    // Auto-arrange slots and confirm
    await clickButton('#auto-arrange');
    await clickButton('#confirm-slots');
    await page.waitForTimeout(800);

    // 7. Game HUD (Playing) - THIS is the screenshot that was blank
    //    when the ts-reference bug shipped. Assert that the canvas
    //    has peg content.
    console.log('Capturing: Gameplay HUD');
    await page.screenshot({ path: path.join(screenshotDir, '07-gameplay.png') });
    await readCanvasRegion('07-gameplay', [
        pegFieldBand({ minBright: 500 }),
        hudTextVisible('FLOOR')
    ]);

    // 8. Drop balls by clicking
    console.log('Dropping balls...');
    await page.evaluate(() => document.querySelector('#gc').click());
    await page.waitForTimeout(4000);

    await page.evaluate(() => document.querySelector('#gc').click());
    await page.waitForTimeout(4000);

    await page.evaluate(() => document.querySelector('#gc').click());
    await page.waitForTimeout(4000);

    await page.screenshot({ path: path.join(screenshotDir, '08-mid-gameplay.png') });
    await readCanvasRegion('08-mid-gameplay', [
        pegFieldBand({ minBright: 500 })
    ]);

    // Keep dropping balls until game state changes
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => document.querySelector('#gc').click());
        await page.waitForTimeout(2500);

        // Check for overlays
        const fcVisible = await page.evaluate(() => document.querySelector('#fc').classList.contains('on'));
        const shopVisible = await page.evaluate(() => document.querySelector('#shop').classList.contains('on'));
        const reVisible = await page.evaluate(() => document.querySelector('#re').classList.contains('on'));

        if (fcVisible) {
            console.log('Floor Complete detected!');
            break;
        }
        if (reVisible) {
            console.log('Run End detected!');
            break;
        }
    }

    // Check what state we're in
    const fcVisible = await page.evaluate(() => document.querySelector('#fc').classList.contains('on'));
    const ssVisible = await page.evaluate(() => document.querySelector('#slot-selector').classList.contains('on'));
    const shopVisible = await page.evaluate(() => document.querySelector('#shop').classList.contains('on'));

    if (fcVisible) {
        // 9. Floor Complete
        await page.screenshot({ path: path.join(screenshotDir, '09-floor-complete.png') });

        // Spin jackpot
        await clickButton('#spinjp');
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(screenshotDir, '10-jackpot-spin.png') });

        await clickButton('#contb');
        await page.waitForTimeout(500);
    }

    if (ssVisible) {
        await page.screenshot({ path: path.join(screenshotDir, '10-slot-selector-2.png') });
        await clickButton('#auto-arrange');
        await clickButton('#confirm-slots');
        await page.waitForTimeout(500);
    }

    if (shopVisible) {
        // 11. Shop
        await page.screenshot({ path: path.join(screenshotDir, '11-shop.png') });
    } else {
        // Check if shop button is visible and click it
        const shopBtnVisible = await page.evaluate(() => document.querySelector('#sb').classList.contains('on'));
        if (shopBtnVisible) {
            await clickButton('#sb');
            await page.screenshot({ path: path.join(screenshotDir, '11-shop.png') });
            await clickButton('#clsb');
        }
    }

    // Continue gameplay
    console.log('Continuing gameplay...');
    for (let i = 0; i < 15; i++) {
        await page.evaluate(() => document.querySelector('#gc').click());
        await page.waitForTimeout(2000);

        const reVisible = await page.evaluate(() => document.querySelector('#re').classList.contains('on'));
        if (reVisible) {
            console.log('Run End detected!');
            break;
        }
    }

    // 12. Run End - the test may or may not reach the re overlay
    // depending on how the random board played. Capture whatever the
    // state is and just check the board is still rendering (the
    // peg-band assertion is the real safety net: if the render loop
    // dies, no matter what overlay is up, the canvas content will
    // be stale and the cyan count will drop).
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '12-run-end.png') });
    await readCanvasRegion('12-run-end', [
        pegFieldBand({ minBright: 200 })
    ]);

    // Return to menu
    await clickButton('#retb');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '13-back-to-menu.png') });

    // 14. Daily Challenge (start a new one)
    console.log('\n--- Testing Daily Challenge ---');
    // Clear daily from localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1500);
    await clickButton('#dailyb');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '14-daily-challenge.png') });

    // The daily modal (added in 2a) shows a START button that calls
    // startDailyChallenge(). The previous version of this suite clicked
    // #auto-arrange + #confirm-slots, but those are part of the slot
    // selector, not the daily modal - so the daily run never actually
    // started, and 15-daily-gameplay.png showed the modal again. Fix:
    // click the daily modal's START button.
    await page.evaluate(() => {
        // The daily modal is appended to document.body, not nested in
        // any overlay, so query it directly.
        const startBtn = document.getElementById('daily-start');
        if (startBtn) startBtn.click();
    });
    await page.waitForTimeout(1000);

    // After starting the daily, the slot selector opens (the daily
    // startGame flow goes through the normal slot arrangement). Auto-
    // arrange + confirm to get to the actual daily gameplay screen.
    await clickButton('#auto-arrange');
    await clickButton('#confirm-slots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '15-daily-gameplay.png') });
    await readCanvasRegion('15-daily-gameplay', [
        pegFieldBand({ minBright: 500 })
    ]);

    console.log('\n=== All screenshots captured! ===');
    console.log('Files saved to:', screenshotDir);

    // ========== ASSERTIONS REPORT ==========
    console.log('\n=== Visual Assertions ===');
    let totalAssertions = 0;
    let failedAssertions = 0;
    for (const s of SCREENSHOTS) {
        for (const m of s.must) {
            totalAssertions++;
            const status = m.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
            console.log(`  ${status} [${s.name}] ${m.label}${m.detail && !m.ok ? ': ' + m.detail : ''}`);
            if (!m.ok) failedAssertions++;
        }
    }
    console.log(`\n  Total: ${totalAssertions}, Failed: ${failedAssertions}`);

    if (pageErrors.length > 0) {
        console.log('\n\x1b[31m=== Page Errors Detected ===\x1b[0m');
        for (const e of pageErrors) {
            console.log('  - ' + e);
        }
        failedAssertions += pageErrors.length;
    }

    const files = fs.readdirSync(screenshotDir).sort();
    console.log('\nCaptured screens:');
    files.forEach(f => console.log('  - ' + f));

    await browser.close();

    if (failedAssertions > 0) {
        console.log(`\n\x1b[31mScreenshot suite FAILED: ${failedAssertions} visual assertion(s) failed\x1b[0m`);
        process.exit(1);
    } else {
        console.log('\n\x1b[32mAll visual assertions passed\x1b[0m');
        process.exit(0);
    }
})();
