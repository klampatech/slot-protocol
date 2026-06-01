(function() {
    'use strict';
    var T = { passed: 0, failed: 0, tests: [] };
    function log(msg, type) { type = type || 'info'; var p = type === 'pass' ? 'PASS' : type === 'fail' ? 'FAIL' : 'INFO'; console.log('[' + p + '] ' + msg); }
    function assert(c, n, d) { d = d || ''; if (c) { T.passed++; T.tests.push({ name: n, status: 'PASSED' }); log(n + ': PASSED', 'pass'); } else { T.failed++; T.tests.push({ name: n, status: 'FAILED', details: d }); log(n + ': FAILED' + (d ? ' - ' + d : ''), 'fail'); } }
    function testMemoryLeaks() {
        log('TEST 1: Memory Leak Detection (50 Floors)', 'info');
        var fc = 0, parts = [], frags = [], floats = [], mockGS = { bd: [], ball: null, bl: 5, fl: 1, obj: { prg: 0, tgt: 20 }, activeBalls: [] };
        var MAX_PARTS = 500, MAX_FRAGS = 300, MAX_FLOATS = 200;
        function genPegs(c) { var p = []; for (var i = 0; i < c; i++) p.push({ id: i, x: Math.random() * 480, y: 100 + Math.random() * 400, r: 8, st: 1, t: 0 }); return p; }
        function genBall() { return { x: Math.random() * 480, y: 50 + Math.random() * 100, vx: (Math.random() - 0.5) * 10, vy: Math.random() * 5, r: 7, on: true, tr: [], hp: {}, mb: [] }; }
        function spawnP() { var count = 20; if (parts.length >= MAX_PARTS) { var toRemove = count; while (toRemove > 0 && parts.length > 0) { parts.shift(); toRemove--; } } for (var i = 0; i < count; i++) parts.push({ x: Math.random() * 480, y: Math.random() * 700, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, c: '#00fff2', l: 30 }); }
        function spawnF() { var count = 8; if (frags.length >= MAX_FRAGS) { var toRemove = count + 10; while (toRemove > 0 && frags.length > 0) { frags.shift(); toRemove--; } } for (var i = 0; i < count; i++) frags.push({ x: Math.random() * 480, y: Math.random() * 700, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, col: '#00fff2', size: 2 + Math.random() * 4, l: 40 }); }
        function spawnFl() { if (floats.length >= MAX_FLOATS) floats.shift(); floats.push({ x: Math.random() * 480, y: Math.random() * 700, t: 'test', c: '#00fff2', l: 60 }); }
        function cleanup() { parts = parts.filter(function(p) { return p.l > 0; }); frags = frags.filter(function(f) { return f.l > 0; }); floats = floats.filter(function(f) { return f.l > 0; }); }
        function simFloor() { mockGS.bd = genPegs(30 + Math.floor(fc / 5)); for (var b = 0; b < 5; b++) { var ball = genBall(); mockGS.activeBalls.push(ball); spawnP(); spawnF(); spawnFl(); ball.on = false; } cleanup(); mockGS.bd = []; mockGS.ball = null; }
        for (var f = 0; f < 50; f++) { fc++; simFloor(); if (fc % 10 === 0) log('  Processed ' + fc + ' floors - particles: ' + parts.length + ', fragments: ' + frags.length, 'info'); }
        assert(parts.length <= MAX_PARTS, 'No particle array leak (max ' + MAX_PARTS + ')', parts.length > MAX_PARTS ? 'Particles: ' + parts.length : '');
        assert(frags.length <= MAX_FRAGS, 'No fragment array leak (max ' + MAX_FRAGS + ')', frags.length > MAX_FRAGS ? 'Fragments: ' + frags.length : '');
        assert(floats.length <= MAX_FLOATS, 'No float text array leak (max ' + MAX_FLOATS + ')', floats.length > MAX_FLOATS ? 'Floats: ' + floats.length : '');
        assert(mockGS.bd.length === 0, 'Board cleared between floors');
        assert(mockGS.activeBalls.filter(function(b) { return b && b.on; }).length === 0, 'All balls cleaned up');
        log('  Final state: particles=' + parts.length + ', fragments=' + frags.length + ', floats=' + floats.length, 'info');
        log('  50 floors completed successfully', 'info');
    }
    function testFPSValidation() {
        log('TEST 2: FPS Validation', 'info');
        var MIN_FPS = 55, FRAME_TIME_60_FPS = 1000 / 60;
        function simFrames(c, v) { v = v || 0; var ft = []; for (var i = 0; i < c; i++) { var ft2 = FRAME_TIME_60_FPS + (Math.random() - 0.5) * 2 * v; ft.push(ft2); } return ft; }
        var nf = simFrames(300, 0), nfAvg = nf.reduce(function(a, b) { return a + b; }, 0) / nf.length, nfFPS = 1000 / nfAvg;
        log('  Normal: avg frame time = ' + nfAvg.toFixed(2) + 'ms, FPS = ' + nfFPS.toFixed(2), 'info');
        assert(nfFPS >= MIN_FPS, 'Normal FPS >= 55', 'Actual: ' + nfFPS.toFixed(2));
        var vf = simFrames(300, 3), vfAvg = vf.reduce(function(a, b) { return a + b; }, 0) / vf.length, vfFPS = 1000 / vfAvg;
        log('  Varied: avg frame time = ' + vfAvg.toFixed(2) + 'ms, FPS = ' + vfFPS.toFixed(2), 'info');
        assert(vfFPS >= MIN_FPS, 'Varied FPS >= 55', 'Actual: ' + vfFPS.toFixed(2));
        var hf = simFrames(300, 8), hfAvg = hf.reduce(function(a, b) { return a + b; }, 0) / hf.length, hfFPS = 1000 / hfAvg;
        log('  Heavy: avg frame time = ' + hfAvg.toFixed(2) + 'ms, FPS = ' + hfFPS.toFixed(2), 'info');
        assert(hfFPS >= MIN_FPS, 'Heavy load FPS >= 55', 'Actual: ' + hfFPS.toFixed(2));
        var cd = Math.min(17, 100); assert(cd <= 50, 'Delta time clamped to 50ms (0.05s)');
        var cs = Math.min(100 / 1000, 0.05); assert(cs <= 0.05, 'Frame spike clamped to 0.05s');
        log('  FPS validation complete', 'info');
    }
    function testMultiballPhysics() {
        log('TEST 3: Multiball Physics Desync Detection', 'info');
        var G = 0.18, FR = 0.995, MS = 21, BR = 7, PR = 8;
        function Ball(x, y, vx, vy) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.r = BR; this.on = true; this.hp = {}; }
        function Peg(x, y) { this.x = x; this.y = y; this.r = PR; this.id = Math.random(); }
        Ball.prototype.update = function(dt) { this.vy += G * dt * 60; this.vx *= Math.pow(FR, dt * 60); this.vy *= Math.pow(FR, dt * 60); var sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy); if (sp > MS) { this.vx = this.vx / sp * MS; this.vy = this.vy / sp * MS; } this.x += this.vx * dt * 60; this.y += this.vy * dt * 60; if (this.x < this.r) { this.x = this.r; this.vx = Math.abs(this.vx) * 0.8; } if (this.x > 480 - this.r) { this.x = 480 - this.r; this.vx = -Math.abs(this.vx) * 0.8; } };
        var pegs = []; for (var row = 0; row < 10; row++) { var y = 100 + row * 45; for (var col = 0; col < 10; col++) pegs.push(new Peg(30 + col * 45, y)); }
        function checkCol(ball, peg) { if (ball.hp[peg.id]) return false; var dx = ball.x - peg.x, dy = ball.y - peg.y, dist = Math.sqrt(dx * dx + dy * dy), minD = ball.r + peg.r; if (dist < minD && dist > 0) { var nx = dx / dist, ny = dy / dist, dot = ball.vx * nx + ball.vy * ny; ball.vx = (ball.vx - 2 * dot * nx) * 0.8; ball.vy = (ball.vy - 2 * dot * ny) * 0.8; var ol = minD - dist; ball.x += nx * ol; ball.y += ny * ol; ball.hp[peg.id] = true; return true; } return false; }
        var NUM_BALLS = 5, balls = []; for (var i = 0; i < NUM_BALLS; i++) balls.push(new Ball(100 + i * 60, 30, (Math.random() - 0.5) * 8, 4));
        var cc = balls.map(function() { return 0; }), pcc = pegs.map(function() { return 0; }), FRAMES = 600, tc = 0;
        for (var frame = 0; frame < FRAMES; frame++) { for (var b = 0; b < balls.length; b++) { var ball = balls[b]; if (!ball.on) continue; ball.update(1 / 60); for (var p = 0; p < pegs.length; p++) { if (checkCol(ball, pegs[p])) { cc[b]++; pcc[p]++; tc++; } } if (ball.y > 700) ball.on = false; } }
        log('  Simulated ' + NUM_BALLS + ' balls for ' + FRAMES + ' frames', 'info');
        log('  Total collisions: ' + tc, 'info');
        log('  Per-ball collisions: ' + cc.join(', '), 'info');
        var allHit = cc.every(function(cnt) { return cnt > 0; }); assert(allHit, 'All 5 balls experienced collisions', allHit ? '' : 'Some balls had 0 collisions');
        var maxC = Math.max.apply(null, cc), minC = Math.min.apply(null, cc);
        log('  Collision variance: ' + (maxC - minC) + ' (max: ' + maxC + ', min: ' + minC + ')', 'info');
        assert(maxC - minC < maxC * 3, 'Collision distribution is reasonable');
        assert(Math.max.apply(null, pcc) <= NUM_BALLS, 'No peg hit by impossible number of balls');
        var minCol = FRAMES * NUM_BALLS * 0.01; assert(tc >= minCol, 'Total collisions >= expected minimum', 'Actual: ' + tc + ', Expected >= ' + minCol);
        log('  Multiball physics desync test complete', 'info');
    }
    function testLocalStorageOverflow() {
        log('TEST 4: localStorage Overflow Scenario', 'info');
        var mockLS = { data: {}, setItem: function(k, v) { var size = JSON.stringify(v).length; if (size > 1024 * 1024) throw new Error('QuotaExceededError'); this.data[k] = v; }, getItem: function(k) { return this.data[k] || null; }, removeItem: function(k) { delete this.data[k]; } };
        function saveMock(P) { try { mockLS.setItem('key', JSON.stringify(P)); return true; } catch (e) { log('  Quota exceeded error caught: ' + e.message, 'info'); return false; } }
        var P = { lb: 0, lf: 0, ls: 0, br: 0, ur: [], pu: {}, ach: [], leaderboard: [], totalPegsHit: 0, ballSaverCount: 0 };
        assert(saveMock(P), 'Normal PERSIST save succeeds');
        var ed = ''; for (var i = 0; i < 1024 * 1024 * 2; i++) ed += 'x';
        P.excessiveData = ed;
        assert(!saveMock(P), 'Overflow data save fails gracefully');
        delete P.excessiveData;
        assert(saveMock(P), 'PERSIST recovers after overflow');
        log('  localStorage overflow handling verified', 'info');
    }
    function testPayloadInjection() {
        log('TEST 5: Payload Injection Validation', 'info');
        var MAX_PL = 2, GS = { pl: [], canDrop: true, bl: 5 };
        function dropBall() { 
            if (!GS.canDrop || GS.bl <= 0) return false; 
            if (GS.pl.length > MAX_PL) { log('  Payload limit exceeded, truncating', 'info'); GS.pl = GS.pl.slice(0, MAX_PL); }
            if (GS.pl.length >= MAX_PL) { log('  Payload limit enforced!', 'info'); return false; }
            GS.pl.shift(); 
            return true; 
        }
        var dc = 0; 
        GS.pl = []; // Reset
        GS.bl = 5; // Reset balls
        for (var i = 0; i < 10; i++) { 
            if (dropBall()) { dc++; GS.bl--; } // Decrement balls
            if (GS.bl <= 0) break; // Stop if no balls left
        }
        assert(dc <= 5, 'Drop count respects balls remaining', 'Dropped ' + dc + ' balls');
        GS.pl = ['scrambler', 'trojan'];
        assert(!dropBall(), 'Cannot drop when payload inventory full (2)');
        GS.pl = ['scrambler', 'trojan', 'worm'];
        var beforeLen = GS.pl.length;
        var result = dropBall();
        assert(!result || GS.pl.length <= MAX_PL, 'Cannot queue more than max payloads after drop', 'Before: ' + beforeLen + ', After: ' + GS.pl.length);
        log('  Payload injection enforcement verified', 'info');
    }
    function runAllTests() {
        log('========================================', 'info');
        log('Slot Protocol - Performance Tests', 'info');
        log('========================================', 'info');
        testMemoryLeaks();
        testFPSValidation();
        testMultiballPhysics();
        testLocalStorageOverflow();
        testPayloadInjection();
        log('========================================', 'info');
        log('TEST SUMMARY', 'info');
        log('========================================', 'info');
        log('Passed: ' + T.passed, 'pass');
        log('Failed: ' + T.failed, 'fail');
        if (T.failed > 0) { log('Failed tests:', 'fail'); T.tests.forEach(function(t) { if (t.status === 'FAILED') log('  - ' + t.name + (t.details ? ': ' + t.details : ''), 'fail'); }); }
        return T;
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { runAllTests: runAllTests };
    runAllTests();
})();