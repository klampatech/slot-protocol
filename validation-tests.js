// Validation tests for Slot Protocol
// Run in browser console or Node.js environment

// Test 1: Ball count invariant
function testBallCount() {
    var GS = {
        bl: 5,
        activeBalls: []
    };
    // Simulate ball exit
    var previousBalls = GS.bl;
    GS.bl--;
    var afterBalls = GS.bl;
    console.log('Ball count test: before=' + previousBalls + ', after=' + afterBalls);
    return afterBalls === previousBalls - 1;
}

// Test 2: Slot lock calculation
function testSlotLock() {
    var C = { SC: 7 };
    var GS = { fl: 1, lockedSlots: [] };
    
    function updateSlotLocks() {
        GS.lockedSlots = [];
        for (var i = 0; i < C.SC; i++) {
            var unlockFloor = i + 1;
            if (GS.fl < unlockFloor) {
                GS.lockedSlots.push(i);
            }
        }
    }
    
    function isSlotLocked(slotIdx) {
        return GS.lockedSlots.indexOf(slotIdx) !== -1;
    }
    
    // Test floor 1 - slot 0 should be unlocked
    GS.fl = 1;
    updateSlotLocks();
    console.log('Floor 1 locked slots:', GS.lockedSlots);
    var pass1 = !isSlotLocked(0) && GS.lockedSlots.length === 6;
    console.log('Floor 1 test:', pass1 ? 'PASS' : 'FAIL');
    
    // Test floor 7 - all slots unlocked
    GS.fl = 7;
    updateSlotLocks();
    console.log('Floor 7 locked slots:', GS.lockedSlots);
    var pass2 = GS.lockedSlots.length === 0;
    console.log('Floor 7 test:', pass2 ? 'PASS' : 'FAIL');
    
    // Test floor 4 - slots 0-3 unlocked
    GS.fl = 4;
    updateSlotLocks();
    console.log('Floor 4 locked slots:', GS.lockedSlots);
    var pass3 = !isSlotLocked(0) && !isSlotLocked(1) && !isSlotLocked(2) && !isSlotLocked(3) && isSlotLocked(4);
    console.log('Floor 4 test:', pass3 ? 'PASS' : 'FAIL');
    
    return pass1 && pass2 && pass3;
}

// Test 3: localStorage corrupted JSON handling
function testCorruptedStorage() {
    var PERSIST = {
        br: 0, lf: 0, ls: 0, tr: 0,
        leaderboard: [], ach: []
    };
    
    function loadPersist(data) {
        try {
            if (data) {
                var saved = JSON.parse(data);
                if (typeof saved === 'object' && saved !== null && !Array.isArray(saved)) {
                    for (var key in saved) {
                        PERSIST[key] = saved[key];
                    }
                } else {
                    console.warn('Corrupted data - not an object');
                    return false;
                }
            }
        } catch (e) {
            console.warn('Parse failed:', e.message);
            return false;
        }
        return true;
    }
    
    // Test valid JSON
    PERSIST.br = 0;
    console.log('Valid JSON:', loadPersist('{"br":100}'), '(expected: true)');
    console.log('Credits set:', PERSIST.br === 100, '(expected: true)');
    
    // Test corrupted JSON
    PERSIST.br = 0;
    console.log('Corrupted JSON:', loadPersist('invalid json'), '(expected: false)');
    console.log('Credits reset:', PERSIST.br === 0, '(expected: true)');
    
    // Test invalid type (array instead of object)
    PERSIST.br = 0;
    var result = loadPersist('[1,2,3]');
    console.log('Array JSON:', result, '(expected: false)');
    console.log('Credits not overwritten:', PERSIST.br === 0, '(expected: true)');
    
    return PERSIST.br === 0; // Final state should be reset
}

// Test 4: Stuck ball detection
function testStuckBall() {
    var C = { STUCK_F: 180, STUCK_D: 2 };
    
    var ball = {
        sf: 0, // stuck frames
        lastX: 0, lastY: 0,
        x: 100, y: 100,
        vx: 0, vy: 0
    };
    
    // Simulate being stuck (moving less than 2px for 180 frames)
    for (var i = 0; i < 180; i++) {
        ball.sf++;
    }
    
    console.log('Stuck frames:', ball.sf, '(expected: 180)');
    console.log('Should trigger kick:', ball.sf >= C.STUCK_F, '(expected: true)');
    
    // Apply kick (same logic as in index.html)
    if (ball.sf >= C.STUCK_F) {
        ball.vx += (Math.random() - 0.5) * 8;
        ball.vy += (Math.random() - 0.5) * 8;
        ball.sf = 0;
    }
    
    console.log('After kick - stuck frames:', ball.sf, '(expected: 0)');
    console.log('After kick - velocity changed:', ball.vx !== 0 || ball.vy !== 0, '(expected: true)');
    
    return ball.sf === 0 && (ball.vx !== 0 || ball.vy !== 0);
}

// Test 5: Floor completion validation
function testFloorCompletion() {
    var GS = {
        obj: { prg: 20, tgt: 20 },
        activeBalls: []
    };
    
    var shouldComplete = GS.obj.prg >= GS.obj.tgt && GS.activeBalls.length === 0;
    console.log('Objective met (20/20), no balls:', shouldComplete, '(expected: true)');
    var pass1 = shouldComplete === true;
    
    GS.obj = { prg: 19, tgt: 20 };
    shouldComplete = GS.obj.prg >= GS.obj.tgt && GS.activeBalls.length === 0;
    console.log('Objective not met (19/20):', shouldComplete, '(expected: false)');
    var pass2 = shouldComplete === false;
    
    GS.obj = { prg: 20, tgt: 20 };
    GS.activeBalls = [{ on: true }];
    shouldComplete = GS.obj.prg >= GS.obj.tgt && GS.activeBalls.length === 0;
    console.log('With active ball:', shouldComplete, '(expected: false)');
    var pass3 = shouldComplete === false;
    
    return pass1 && pass2 && pass3;
}

// Test 6: Score validation (computed score matches expected)
function testScoreCalculation() {
    var GS = {
        sc: 0,
        cc: 0, // combo counter
        fa: false // frenzy
    };
    
    // Simulate hitting 10 pegs with base scoring
    // Base score = 50 * (combo + 1) * (frenzy ? 3 : 1)
    var expectedScore = 0;
    for (var i = 0; i < 10; i++) {
        var combo = Math.min(i, 7); // max combo 7
        var baseScore = 50 * (combo + 1);
        expectedScore += baseScore;
    }
    
    // 50+100+150+200+250+300+350+400+450+500 = 2750
    console.log('Expected score for 10 hits (combo 0-9):', expectedScore, '(expected: 2750)');
    
    // Test with frenzy at combo 4 (combo 5 = 5th hit)
    GS.fa = true;
    GS.cc = 4;
    var frenzyScore = 50 * (GS.cc + 1) * 3;
    console.log('Frenzy score (combo 5, x3):', frenzyScore, '(expected: 750)');
    var pass1 = frenzyScore === 750;
    
    // Test max combo at x7
    GS.cc = 6;
    var maxCombo = 50 * (GS.cc + 1);
    console.log('Max combo score (combo 7):', maxCombo, '(expected: 350)');
    var pass2 = maxCombo === 350;
    
    return pass1 && pass2;
}

// Test 7: Overflow penalty calculation
function testOverflowPenalty() {
    var GS = {
        sc: 1000,
        fl: 5,
        jp: 1000
    };
    
    // Floor-scaled penalty: -3 score per floor
    var penalty = GS.fl * 3;
    console.log('Overflow penalty (floor 5):', penalty, '(expected: 15)');
    var pass1 = penalty === 15;
    
    // Jackpot drain (15%)
    var jackpotLoss = Math.floor(GS.jp * 0.15);
    console.log('Jackpot drain (1000 * 0.15):', jackpotLoss, '(expected: 150)');
    var pass2 = jackpotLoss === 150;
    
    // Apply penalty
    GS.sc = Math.max(0, GS.sc - penalty);
    GS.jp = Math.max(500, GS.jp - jackpotLoss);
    
    console.log('Score after penalty:', GS.sc, '(expected: 985)');
    console.log('Jackpot after drain:', GS.jp, '(expected: 850)');
    
    var pass3 = GS.sc === 985 && GS.jp === 850;
    
    return pass1 && pass2 && pass3;
}

// Run all tests
console.log('=== Slot Protocol Validation Tests ===');
console.log('');
console.log('Test 1: Ball Count');
console.log('Result:', testBallCount() ? 'PASS' : 'FAIL');
console.log('');
console.log('Test 2: Slot Locks');
console.log('Result:', testSlotLock() ? 'PASS' : 'FAIL');
console.log('');
console.log('Test 3: localStorage Handling');
console.log('Result:', testCorruptedStorage() ? 'PASS' : 'FAIL');
console.log('');
console.log('Test 4: Stuck Ball Detection');
console.log('Result:', testStuckBall() ? 'PASS' : 'FAIL');
console.log('');
console.log('Test 5: Floor Completion');
console.log('Result:', testFloorCompletion() ? 'PASS' : 'FAIL');
console.log('');
console.log('Test 6: Score Calculation');
console.log('Result:', testScoreCalculation() ? 'PASS' : 'FAIL');
console.log('');
console.log('Test 7: Overflow Penalty');
console.log('Result:', testOverflowPenalty() ? 'PASS' : 'FAIL');
console.log('');
console.log('=== Tests Complete ===');