const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 960, height: 800 } });
    const page = await context.newPage();
    
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
    
    // 1. Menu Screen
    console.log('Capturing: Menu Screen');
    await page.screenshot({ path: path.join(screenshotDir, '01-menu.png') });
    
    // 2. Tutorial Overlay
    console.log('Capturing: Tutorial');
    await clickButton('#tutb');
    await page.screenshot({ path: path.join(screenshotDir, '02-tutorial.png') });
    await clickButton('#tutcb');
    
    // 3. Achievements Overlay
    console.log('Capturing: Achievements');
    await clickButton('#achb');
    await page.screenshot({ path: path.join(screenshotDir, '03-achievements.png') });
    await clickButton('#achclb');
    
    // 4. Leaderboard Overlay
    console.log('Capturing: Leaderboard');
    await clickButton('#lbb');
    await page.screenshot({ path: path.join(screenshotDir, '04-leaderboard.png') });
    await clickButton('#lbclb');
    
    // 5. Settings Overlay
    console.log('Capturing: Settings');
    await clickButton('#settingsb');
    await page.screenshot({ path: path.join(screenshotDir, '05-settings.png') });
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
    
    // Auto-arrange slots and confirm
    await clickButton('#auto-arrange');
    await clickButton('#confirm-slots');
    await page.waitForTimeout(500);
    
    // 7. Game HUD (Playing)
    console.log('Capturing: Gameplay HUD');
    await page.screenshot({ path: path.join(screenshotDir, '07-gameplay.png') });
    
    // 8. Drop balls by clicking
    console.log('Dropping balls...');
    await page.evaluate(() => document.querySelector('#gc').click());
    await page.waitForTimeout(4000);
    
    await page.evaluate(() => document.querySelector('#gc').click());
    await page.waitForTimeout(4000);
    
    await page.evaluate(() => document.querySelector('#gc').click());
    await page.waitForTimeout(4000);
    
    await page.screenshot({ path: path.join(screenshotDir, '08-mid-gameplay.png') });
    
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
    
    // 12. Run End
    await page.waitForTimeout(1000);
    const reVisible2 = await page.evaluate(() => document.querySelector('#re').classList.contains('on'));
    if (reVisible2) {
        await page.screenshot({ path: path.join(screenshotDir, '12-run-end.png') });
    } else {
        await page.screenshot({ path: path.join(screenshotDir, '12-run-end.png') });
    }
    
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
    
    // Setup daily game
    await clickButton('#auto-arrange');
    await clickButton('#confirm-slots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '15-daily-gameplay.png') });
    
    console.log('\n=== All screenshots captured! ===');
    console.log('Files saved to:', screenshotDir);
    
    const files = fs.readdirSync(screenshotDir).sort();
    console.log('\nCaptured screens:');
    files.forEach(f => console.log('  - ' + f));
    
    await browser.close();
})();
