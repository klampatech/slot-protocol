// Slot Protocol - SVG Icon Library (Phase 3: Blade Runner 2049 visual overhaul)
//
// Visual rules for every icon in this file:
//   - 24x24 viewBox, centered designs
//   - 1.5-1.75px stroke, no fills (or very thin inner highlight)
//   - Two-tone: outer outline in the type color, optional inner accent
//   - Reads at 16px (HUD chips, button icons) and 40px (decorative)
//   - Distinct silhouettes per type - trojan/cluster/explosive all read
//     differently so a player can identify them at a glance
//
// The shape language is geometric line art with one or two accent marks;
// no clipart-style emoji or three-color clipart. The icon is a wireframe
// of the concept, not a pictogram.
var SVG_ICONS = {
    // ========== PEG TYPES (11) ==========
    // Cyan node - the default peg. Specular dot at 10 o'clock reads as
    // "lit glass" - the most common shape in the game so it stays minimal.
    PEG_NODE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#00fff2" stroke-width="1.75"/><circle cx="9" cy="9" r="1.5" fill="#00fff2" opacity="0.8"/></svg>',

    // Yellow cache - diamond (4-sided) with a center cross. Diamond shape
    // is visually distinct from the round nodes; cross reads as "+ value".
    PEG_CACHE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L21 12L12 21L3 12Z" fill="none" stroke="#ffff00" stroke-width="1.75" stroke-linejoin="round"/><path d="M8 12H16M12 8V16" stroke="#ffff00" stroke-width="1.5" stroke-linecap="round"/></svg>',

    // Purple teleport - concentric circles + inward chevron, reads as
    // "swirl" without the swoopy curves that read as clipart.
    PEG_TELEPORT: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#9944ff" stroke-width="1.75"/><circle cx="12" cy="12" r="4" fill="none" stroke="#cc99ff" stroke-width="1.25" stroke-dasharray="2 1.5"/><path d="M12 9L9 12L12 15M12 9L15 12L12 15" fill="none" stroke="#cc99ff" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    // Orange seismic - ring with 4 short cardinal tick marks, plus an inner
    // dot. Tick marks read as "concentric shockwave" without literal rings.
    PEG_SEISMIC: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ff6600" stroke-width="1.75"/><path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke="#ff8833" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="#ffcc00"/></svg>',

    // Red explosive - circle with 8-point starburst (4 long axes + 4 short
    // diagonals). Reads as "impact" / "danger" - the most aggressive peg.
    PEG_EXPLOSIVE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="7" fill="none" stroke="#ff2244" stroke-width="1.75"/><path d="M12 2L12 7M12 17L12 22M2 12L7 12M17 12L22 12" stroke="#ff2244" stroke-width="1.75" stroke-linecap="round"/><path d="M5 5L8 8M16 16L19 19M5 19L8 16M16 8L19 5" stroke="#ff6666" stroke-width="1.25" stroke-linecap="round"/><circle cx="12" cy="12" r="2.5" fill="#ff2244"/></svg>',

    // Grey dormant - dashed circle (inactive) with a small center dot.
    // The dash pattern is the visual signal: "not yet awake".
    PEG_DORMANT: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#666688" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="1.5" fill="#8888aa"/></svg>',

    // Light blue ice - 6-sided snowflake-like radial lines, hexagon silhouette.
    // Distinct from the round Node so the player can read it at a glance.
    PEG_ICE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#88ddff" stroke-width="1.75"/><path d="M12 4V20M4 12H20M6.3 6.3L17.7 17.7M17.7 6.3L6.3 17.7" stroke="#88ddff" stroke-width="1.25" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="#fff" opacity="0.8"/></svg>',

    // Orange-red fiber - circle with 3 horizontal striations, "strands"
    // of fiber-optic cable. The striation count = tier.
    PEG_FIBER: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ff8844" stroke-width="1.75"/><path d="M5 9H19M5 12H19M5 15H19" stroke="#ffaa66" stroke-width="1.5" stroke-linecap="round"/></svg>',

    // White mirror - circle with cross-hair (X + plus). Reads as
    // "reflective surface" without literal mirror-curves.
    PEG_MIRROR: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ffffff" stroke-width="1.75"/><path d="M4 12H20M12 4V20M6.3 6.3L17.7 17.7M17.7 6.3L6.3 17.7" stroke="#ffffff" stroke-width="1.25" stroke-linecap="round" opacity="0.7"/></svg>',

    // Gold honeycomb - hexagon outline + smaller inner hexagon. Pure hex
    // silhouette, no extras; the only round-disrupter in the game.
    PEG_HONEYCOMB: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5Z" fill="none" stroke="#ffcc00" stroke-width="1.75" stroke-linejoin="round"/><path d="M12 8L16.5 10.25V14.75L12 17L7.5 14.75V10.25Z" fill="none" stroke="#ffcc00" stroke-width="1.25" stroke-linejoin="round" opacity="0.7"/></svg>',

    // Pink overload - circle with lightning bolt (jagged Z shape).
    // Lightning is a universal "electric/overload" symbol.
    PEG_OVERLOAD: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ff4488" stroke-width="1.75"/><path d="M13 4L8 13H12L11 20L16 11H12L13 4Z" fill="#ff4488" stroke="#ff4488" stroke-width="0.5" stroke-linejoin="round"/></svg>',

    // ========== SLOT TYPES (8) ==========
    // Empty slot - dashed square. Reads as "no slot assigned".
    SLOT_EMPTY: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="#555566" stroke-width="1.5" stroke-dasharray="3 2"/></svg>',

    // Credits - circle with $ glyph stylized as two parallel lines
    // through a vertical bar (avoids the text "$" which reads as
    // font-dependent).
    SLOT_CREDITS: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#00ff88" stroke-width="1.75"/><path d="M12 5V19" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/><path d="M15 8.5C15 8.5 14 7 12 7C10 7 9 8 9 9.5C9 11 10 11.5 12 12C14 12.5 15 13 15 14.5C15 16 14 17 12 17C10 17 9 15.5 9 15.5" fill="none" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/></svg>',

    // Amplify - two upward chevrons stacked. "Boost" without using +.
    SLOT_AMPLIFY: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L12 6L19 13" fill="none" stroke="#ff00ff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19L12 12L19 19" fill="none" stroke="#ff00ff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/></svg>',

    // Payload - square with corner brackets + central "?" drawn as a hook.
    // "?" is a literal slot for "random", not text.
    SLOT_PAYLOAD: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4V8M4 4H8M20 4H16M20 4V8M4 20V16M4 20H8M20 20H16M20 20V16" stroke="#9944ff" stroke-width="1.75" stroke-linecap="round" fill="none"/><path d="M9 9C9 7.5 10.5 6.5 12 6.5C13.5 6.5 15 7.5 15 9C15 10.5 13.5 11 12 11V13" fill="none" stroke="#9944ff" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="#9944ff"/></svg>',

    // Crumble - 3 fragments separated by gaps. Reads as "break" without
    // a literal hammer.
    SLOT_CRUMBLE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4L8 4L8 8L4 8Z" fill="none" stroke="#ff6600" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 4L20 4L20 8L16 8Z" fill="none" stroke="#ff6600" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 12L14 12L14 16L10 16Z" fill="none" stroke="#ff6600" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 16L8 16L8 20L4 20Z" fill="none" stroke="#ff6600" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 16L20 16L20 20L16 20Z" fill="none" stroke="#ff6600" stroke-width="1.5" stroke-linejoin="round"/></svg>',

    // Shield - shield silhouette + inner checkmark.
    SLOT_SHIELD: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L20 6V12C20 16 12 21 12 21C12 21 4 16 4 12V6L12 3Z" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linejoin="round"/><path d="M8.5 12L11 14.5L15.5 10" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    // Overclock - clock face with hands. Distinct from amplify's chevrons.
    SLOT_OVERCLOCK: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ffff00" stroke-width="1.75"/><path d="M12 7V12L15 10" fill="none" stroke="#ffff00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke="#ffff00" stroke-width="1.25" stroke-linecap="round"/></svg>',

    // Jackpot - 5-point star (the classic reward star) with an inner
    // glow ring. Reads as "prize" universally.
    SLOT_JACKPOT: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 8.5L21.5 9L16 14L17.5 21L12 17L6.5 21L8 14L2.5 9L9.5 8.5Z" fill="none" stroke="#ffcc00" stroke-width="1.75" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="#ffcc00"/></svg>',

    // ========== PAYLOAD TYPES (9) ==========
    // Scrambler - U-turn arrow (180° reversal of direction).
    PAYLOAD_SCRAMBLER: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H17C19 12 19 9 17 7L14 4" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 4L18 4L18 8" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    // Trojan - shield with a "breach" (broken top edge). Distinct from
    // SLOT_SHIELD's intact shield.
    PAYLOAD_TROJAN: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L20 6V12C20 16 12 21 12 21C12 21 4 16 4 12V6L7 5" fill="none" stroke="#ff00ff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4L20 6" stroke="#ff00ff" stroke-width="1.75" stroke-linecap="round"/><circle cx="12" cy="13" r="2.5" fill="none" stroke="#ff00ff" stroke-width="1.5"/></svg>',

    // Worm - chain link / connecting segments. Reads as "passes through".
    PAYLOAD_WORM: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 12H17" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round"/><rect x="3" y="8" width="8" height="8" rx="4" fill="none" stroke="#00fff2" stroke-width="1.75"/><rect x="13" y="8" width="8" height="8" rx="4" fill="none" stroke="#00fff2" stroke-width="1.75"/><circle cx="7" cy="12" r="1" fill="#00fff2"/><circle cx="17" cy="12" r="1" fill="#00fff2"/></svg>',

    // Logic Bomb - bomb silhouette with a fuse + "x3" stamp drawn as a
    // tiny "×3" symbol. Bomb reads even at 16px.
    PAYLOAD_LOGIC_BOMB: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="14" r="7" fill="none" stroke="#ff2244" stroke-width="1.75"/><path d="M16 9L18 7" stroke="#ffcc00" stroke-width="1.75" stroke-linecap="round"/><path d="M18 7C19 5 21 5 21 3" fill="none" stroke="#ffcc00" stroke-width="1.5" stroke-linecap="round"/><path d="M8.5 11.5L13.5 16.5M13.5 11.5L8.5 16.5" stroke="#ff2244" stroke-width="1.25" stroke-linecap="round"/><path d="M14 14H17" stroke="#ff2244" stroke-width="1.25" stroke-linecap="round"/></svg>',

    // Daemon - horned silhouette. Two short upturned curves + a center eye.
    PAYLOAD_DAEMON: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 9C5 6 8 4 12 4C16 4 19 6 19 9" fill="none" stroke="#ff4488" stroke-width="1.75" stroke-linecap="round"/><path d="M4 9L2 6M20 9L22 6" stroke="#ff4488" stroke-width="1.75" stroke-linecap="round"/><path d="M7 11C7 16 9 19 12 19C15 19 17 16 17 11" fill="none" stroke="#ff4488" stroke-width="1.75" stroke-linejoin="round"/><circle cx="12" cy="13" r="1.5" fill="#ffcc00"/></svg>',

    // Ghost - rounded ghost silhouette. Two eyes (small circles) + wavy
    // bottom edge. Classic, instantly readable.
    PAYLOAD_GHOST: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 20V10C5 6 8 3 12 3C16 3 19 6 19 10V20L17 18L15 20L13 18L11 20L9 18L7 20L5 18Z" fill="none" stroke="#ffffff" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"/><circle cx="9.5" cy="10" r="1.25" fill="#ffffff"/><circle cx="14.5" cy="10" r="1.25" fill="#ffffff"/></svg>',

    // Cluster - 3 connected nodes (triangle layout, lines connecting them).
    // Distinct from trojan's shield and explosive's starburst.
    PAYLOAD_CLUSTER: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L12 18M5 19L17 9M5 9L17 19" stroke="#ff00ff" stroke-width="1.25" stroke-linecap="round" opacity="0.6"/><circle cx="12" cy="5" r="3" fill="none" stroke="#ff00ff" stroke-width="1.75"/><circle cx="5" cy="19" r="3" fill="none" stroke="#ff00ff" stroke-width="1.75"/><circle cx="19" cy="19" r="3" fill="none" stroke="#ff00ff" stroke-width="1.75"/></svg>',

    // Explosive (payload) - central burst with rays of varying length.
    // Smaller / more compact than the explosive peg.
    PAYLOAD_EXPLOSIVE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" fill="#ff6600"/><path d="M12 2L12 5M12 19L12 22M2 12L5 12M19 12L22 12M5 5L7 7M17 7L19 5M5 19L7 17M17 17L19 19" stroke="#ff6600" stroke-width="1.75" stroke-linecap="round"/></svg>',

    // Slowmo - clock with a "rewind" arrow loop. Reads as "time".
    PAYLOAD_SLOWMO: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#88ddff" stroke-width="1.75"/><path d="M16 8C15 6.5 13.5 5.5 12 5.5C10.5 5.5 9 6.5 8 8" fill="none" stroke="#88ddff" stroke-width="1.5" stroke-linecap="round"/><path d="M16 8L13 8L13 5" fill="none" stroke="#88ddff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9V13L14.5 11" fill="none" stroke="#88ddff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    // Chain Reaction - concentric explosion rings with radial lines.
    // Reads as "AoE blast" - the expanding rings suggest area effect.
    // Red (#ff4444) matches the explosive peg family.
    PAYLOAD_CHAIN_REACTION: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" fill="none" stroke="#ff4444" stroke-width="1.75"/><circle cx="12" cy="12" r="8" fill="none" stroke="#ff4444" stroke-width="1.25" opacity="0.6"/><path d="M12 2L12 5M12 19L12 22M2 12L5 12M19 12L22 12M5 5L7 7M17 7L19 5M5 19L7 17M17 17L19 19" stroke="#ff4444" stroke-width="1.5" stroke-linecap="round"/></svg>',

    // Synergy - diamond with connecting inner lines. Reads as
    // "connection / amplification" - the cross-hairs suggest targeted
    // enhancement. Light blue (#88ddff) pairs with the ice peg color.
    PAYLOAD_SYNERGY: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L21 12L12 21L3 12Z" fill="none" stroke="#88ddff" stroke-width="1.75" stroke-linejoin="round"/><path d="M8 12H16M12 8V16" stroke="#88ddff" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="#88ddff" opacity="0.8"/></svg>',

    // Magnetize - concentric rings radiating inward (gravity well).
    // Reads as "attraction / pull" - rings converging on center.
    // Cyan (#00ccff) is between the node cyan and ice blue.
    PAYLOAD_MAGNETIZE: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2" fill="#00ccff"/><circle cx="12" cy="12" r="5" fill="none" stroke="#00ccff" stroke-width="1.5" opacity="0.8"/><circle cx="12" cy="12" r="8" fill="none" stroke="#00ccff" stroke-width="1.25" opacity="0.5"/><circle cx="12" cy="12" r="10.5" fill="none" stroke="#00ccff" stroke-width="1" opacity="0.3"/></svg>',

    // ========== UI ICONS ==========
    // Trophy - cup on a base. Used in leaderboard.
    UI_TROPHY: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 4H17V10C17 13 15 15 12 15C9 15 7 13 7 10V4Z" fill="none" stroke="#ffcc00" stroke-width="1.75" stroke-linejoin="round"/><path d="M7 6H4V8C4 10 5 11 7 11" fill="none" stroke="#ffcc00" stroke-width="1.5" stroke-linecap="round"/><path d="M17 6H20V8C20 10 19 11 17 11" fill="none" stroke="#ffcc00" stroke-width="1.5" stroke-linecap="round"/><path d="M9 19H15M12 15V19M10 21H14" fill="none" stroke="#ffcc00" stroke-width="1.75" stroke-linecap="round"/></svg>',

    // Star - 5-point star.
    UI_STAR: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 8.5L21.5 9L16 14L17.5 21L12 17L6.5 21L8 14L2.5 9L9.5 8.5Z" fill="none" stroke="#ffcc00" stroke-width="1.75" stroke-linejoin="round"/></svg>',

    // Heart - filled heart with cutout.
    UI_HEART: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C12 21 4 14.5 4 9C4 6 6.5 4 9 4C10.5 4 12 5 12 5C12 5 13.5 4 15 4C17.5 4 20 6 20 9C20 14.5 12 21 12 21Z" fill="none" stroke="#ff2244" stroke-width="1.75" stroke-linejoin="round"/></svg>',

    // Lock - body + arch. Used for locked slots.
    UI_LOCK: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="11" width="14" height="10" rx="1.5" fill="none" stroke="#8888aa" stroke-width="1.75"/><path d="M8 11V7C8 5 10 3 12 3C14 3 16 5 16 7V11" fill="none" stroke="#8888aa" stroke-width="1.75" stroke-linecap="round"/><circle cx="12" cy="16" r="1.5" fill="#8888aa"/></svg>',

    // Check - single checkmark. Used for unlocked achievements.
    UI_CHECK: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12L10 17L19 7" fill="none" stroke="#00ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    // Arrow right - used in menu footer.
    UI_ARROW_RIGHT: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 12H20M14 6L20 12L14 18" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    // Bolt - lightning, for "reset / danger" / contrast mode.
    UI_BOLT: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L5 13H11L10 22L19 11H13L13 2Z" fill="none" stroke="#ffff00" stroke-width="1.75" stroke-linejoin="round"/></svg>',

    // Plus - "drop a slot here" affordance on unlocked-empty positions.
    UI_PLUS: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ffff00" stroke-width="1.75" stroke-dasharray="3 2"/><path d="M12 8V16M8 12H16" stroke="#ffff00" stroke-width="1.75" stroke-linecap="round"/></svg>',

    // Plus (cyan variant) - "locked position you can unlock this floor".
    // Phase 9: replaces the magenta UI_UNLOCK on locked-but-unlockable
    // positions. Solid stroke (not dashed) so the affordance reads as
    // 'ready', not 'pending'.
    UI_PLUS_CYAN: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#00fff2" stroke-width="1.75"/><path d="M12 8V16M8 12H16" stroke="#00fff2" stroke-width="2" stroke-linecap="round"/></svg>',

    // Gear - settings. Slightly stylized with 6 teeth.
    UI_GEAR: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" fill="none" stroke="#ffffff" stroke-width="1.75"/><path d="M12 2V4M12 20V22M2 12H4M20 12H22M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round"/></svg>',

    // Calendar - daily challenge button.
    UI_CALENDAR: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="1.5" fill="none" stroke="#00fff2" stroke-width="1.75"/><path d="M3 10H21" stroke="#00fff2" stroke-width="1.75"/><path d="M8 3V7M16 3V7" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round"/><rect x="7" y="13" width="3" height="3" fill="#00fff2"/></svg>',

    // Question / Info - tutorial button.
    UI_QUESTION: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="none" stroke="#00fff2" stroke-width="1.75"/><path d="M9.5 9C9.5 7.5 10.5 6.5 12 6.5C13.5 6.5 14.5 7.5 14.5 9C14.5 10.5 12 10.5 12 13" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="#00fff2"/></svg>',

    // Medal - achievements button. Ribbon + disk.
    UI_MEDAL: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="9" r="5" fill="none" stroke="#ffcc00" stroke-width="1.75"/><circle cx="12" cy="9" r="2" fill="none" stroke="#ffcc00" stroke-width="1.25"/><path d="M8 13L6 22L12 18L18 22L16 13" fill="none" stroke="#ffcc00" stroke-width="1.75" stroke-linejoin="round"/></svg>',

    // Dollar - menu stat.
    UI_DOLLAR: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="none" stroke="#00ff88" stroke-width="1.75"/><path d="M12 6V18M15 8.5C15 8.5 14 7 12 7C10 7 9 8 9 9.5C9 11 10 11.5 12 12C14 12.5 15 13 15 14.5C15 16 14 17 12 17C10 17 9 15.5 9 15.5" fill="none" stroke="#00ff88" stroke-width="1.5" stroke-linecap="round"/></svg>',

    // Flag - menu stat (best floor).
    UI_FLAG: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 3V21" stroke="#00fff2" stroke-width="1.75" stroke-linecap="round"/><path d="M5 4H17L14 8L17 12H5" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linejoin="round"/></svg>',

    // Ball - menu stat (total runs).
    UI_BALL: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ffff00" stroke-width="1.75"/><circle cx="9" cy="9" r="1.5" fill="#ffff00" opacity="0.8"/></svg>',

    // Coin - for total runs stat.
    UI_RUNS: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="none" stroke="#ff00ff" stroke-width="1.75"/><path d="M12 6L18 12L12 18L6 12Z" fill="none" stroke="#ff00ff" stroke-width="1.5"/></svg>',

    // Speaker (on) - speaker body with two arcs representing sound waves.
    // Used in the settings volume row when the channel is non-zero.
    // The two arcs at decreasing opacity read as "sound radiating out"
    // without literal sine-wave curves. The two-tone stroke (cyan body,
    // lighter wave) matches the rest of the icon set.
    UI_SOUND_ON: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L6 9H2V15H6L11 19V5Z" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linejoin="round"/><path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6696 17.0039 11.995C17.0039 13.3204 16.4774 14.5924 15.54 15.53" fill="none" stroke="#88eeff" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/><path d="M19.07 4.93C20.9447 6.80317 21.9979 9.3233 21.9979 11.995C21.9979 14.6667 20.9447 17.1868 19.07 19.06" fill="none" stroke="#88eeff" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/></svg>',

    // Speaker (off) - speaker body with a red X over the wave area.
    // Used in the settings volume row when the channel is at 0 (muted).
    // The X is in #ff2244 (the same red as the explosive peg) so the
    // muted state is instantly readable - matches the rest of the icon
    // set's "danger means red" convention. The speaker body stays cyan
    // so the control's identity is preserved when toggling on/off.
    UI_SOUND_OFF: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 5L6 9H2V15H6L11 19V5Z" fill="none" stroke="#00fff2" stroke-width="1.75" stroke-linejoin="round"/><line x1="16" y1="9" x2="22" y2="15" stroke="#ff2244" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="#ff2244" stroke-width="2" stroke-linecap="round"/></svg>',

    // ========== HELPER FUNCTIONS ==========
    // Lookup by enum index. Returns an SVG string suitable for innerHTML.
    getPegIcon: function(type) {
        var names = ['NODE','CACHE','TELEPORT','SEISMIC','EXPLOSIVE','DORMANT','ICE','FIBER','MIRROR','HONEYCOMB','OVERLOAD'];
        return this['PEG_' + (names[type] || 'NODE')];
    },
    getSlotIcon: function(type) {
        var names = ['EMPTY','CREDITS','AMPLIFY','PAYLOAD','CRUMBLE','SHIELD','OVERCLOCK','JACKPOT'];
        return this['SLOT_' + (names[type] || 'EMPTY')];
    },
    getPayloadIcon: function(type) {
        // Accepts either a payload name string (e.g. 'scrambler',
        // 'chain_reaction') or a numeric index (legacy). Strings
        // are uppercased and prefixed with 'PAYLOAD_'; indices
        // fall through to the legacy array lookup (kept for
        // backward compat with any external callers).
        if (typeof type === 'string') {
            var key = 'PAYLOAD_' + type.toUpperCase().replace(/-/g, '_');
            return this[key] || this.PAYLOAD_SCRAMBLER;
        }
        // Legacy integer index path
        var names = ['SCRAMBLER','TROJAN','WORM','LOGIC_BOMB','DAEMON','GHOST','CLUSTER','EXPLOSIVE','SLOWMO'];
        return this['PAYLOAD_' + (names[type] || 'SCRAMBLER')];
    }
};
