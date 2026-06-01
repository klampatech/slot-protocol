// Slot Protocol - SVG Icon Library
var SVG_ICONS = {
    // PEG TYPE ICONS (11 types)
    PEG_NODE: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#00fff2"/><circle cx="9" cy="9" r="2" fill="rgba(255,255,255,0.5)"/></svg>',
    PEG_CACHE: '<svg viewBox="0 0 24 24"><path d="M12 3L22 12L12 21L2 12Z" fill="#ffff00"/><text x="12" y="15" text-anchor="middle" fill="#996600" font-size="10" font-weight="bold">$</text></svg>',
    PEG_TELEPORT: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#9944ff"/><path d="M12 6C15 6 18 9 18 12C18 15 15 18 12 18" stroke="#cc99ff" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="#fff"/></svg>',
    PEG_SEISMIC: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff6600"/><path d="M12 4L12 8M12 16L12 20M4 12L8 12M16 12L20 12" stroke="#ff8833" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="#ffcc00"/></svg>',
    PEG_EXPLOSIVE: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff2244"/><path d="M12 5L12 8M12 16L12 19M5 12L8 12M16 12L19 12" stroke="#ff6666" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" fill="#ff0000"/><path d="M10 9L12 12L10 13L11 15L13 12L15 13L14 11L12 10L13 8L11 9Z" fill="#ffff00"/></svg>',
    PEG_DORMANT: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#444466" opacity="0.7" stroke="#666688" stroke-width="1" stroke-dasharray="3 2"/><text x="12" y="16" text-anchor="middle" fill="#8888aa" font-size="8">Z</text></svg>',
    PEG_ICE: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#88ddff"/><path d="M12 5L12 19M5 12L19 12M7 7L17 17M17 7L7 17" stroke="#fff" stroke-width="1" opacity="0.7"/></svg>',
    PEG_FIBER: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff8844"/><path d="M6 8L18 8M6 12L18 12M6 16L18 16" stroke="#ffaa66" stroke-width="2" stroke-linecap="round"/></svg>',
    PEG_MIRROR: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#eeeeee"/><circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="2" fill="none"/></svg>',
    PEG_HONEYPOT: '<svg viewBox="0 0 24 24"><path d="M12 3L20 8L20 16L12 21L4 16L4 8Z" fill="#ffcc00"/><text x="12" y="14" text-anchor="middle" fill="#996600" font-size="7" font-weight="bold">5</text></svg>',
    PEG_OVERLOAD: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff4488"/><path d="M12 5L12 8M12 16L12 19M5 12L8 12M16 12L19 12" stroke="#ff88aa" stroke-width="2" stroke-linecap="round"/></svg>',
    // SLOT TYPE ICONS
    SLOT_EMPTY: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="#555566" stroke-width="2" stroke-dasharray="4 2" fill="none"/></svg>',
    SLOT_CREDITS: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00ff88"/><text x="12" y="16" text-anchor="middle" fill="#004422" font-size="12" font-weight="bold">$</text></svg>',
    SLOT_AMPLIFY: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ff00ff"/><path d="M12 7V17M7 12H17" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    SLOT_PAYLOAD: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#9944ff"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">?</text></svg>',
    SLOT_CRUMBLE: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#ff6600"/><path d="M8 8L10 12L8 16M12 8L14 12L12 16M16 8L14 12L16 16" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
    SLOT_SHIELD: '<svg viewBox="0 0 24 24"><path d="M12 3L20 6V12C20 16 12 21 12 21C12 21 4 16 4 12V6L12 3Z" fill="#00fff2"/><path d="M9 12L11 14L15 10" stroke="#004422" stroke-width="2" stroke-linecap="round"/></svg>',
    SLOT_OVERCLOCK: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffff00"/><path d="M12 6V12L16 10" stroke="#996600" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.5" fill="#996600"/></svg>',
    SLOT_JACKPOT: '<svg viewBox="0 0 24 24"><path d="M12 2L14 8L20 9L15 14L17 21L12 17L7 21L9 14L4 9L10 8Z" fill="#ffcc00"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>',
    // PAYLOAD ICONS
    PAYLOAD_SCRAMBLER: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" stroke="#00fff2" stroke-width="2" fill="none"/><path d="M8 12L12 8V16ZM16 12L12 8V16" stroke="#00fff2" stroke-width="2" stroke-linecap="round"/></svg>',
    PAYLOAD_TROJAN: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="4" fill="#ff00ff"/><circle cx="16" cy="8" r="4" fill="#ff00ff" opacity="0.7"/><circle cx="12" cy="14" r="4" fill="#ff00ff" opacity="0.5"/></svg>',
    PAYLOAD_WORM: '<svg viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="4" fill="#00fff2"/><circle cx="8" cy="12" r="3" fill="#006666"/><circle cx="16" cy="12" r="3" fill="#006666"/></svg>',
    PAYLOAD_LOGIC_BOMB: '<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="#ff2244"/><text x="12" y="16" text-anchor="middle" fill="#ffff00" font-size="8" font-weight="bold">3x</text></svg>',
    PAYLOAD_DAEMON: '<svg viewBox="0 0 24 24"><path d="M12 3L20 6V12C20 16 12 21 12 21C12 21 4 16 4 12V6L12 3Z" fill="#ff4488"/><circle cx="12" cy="12" r="4" fill="#ffff00"/></svg>',
    PAYLOAD_GHOST: '<svg viewBox="0 0 24 24"><path d="M6 20V10C6 6 9 3 12 3C15 3 18 6 18 10V20L16 18V20H14L12 18L10 20H8L6 18V20Z" fill="#fff" opacity="0.6"/><circle cx="9" cy="8" r="1.5" fill="#000"/><circle cx="15" cy="8" r="1.5" fill="#000"/></svg>',
    PAYLOAD_CLUSTER: '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="5" fill="#ff00ff"/><circle cx="7" cy="16" r="5" fill="#ff00ff" opacity="0.7"/><circle cx="17" cy="16" r="5" fill="#ff00ff" opacity="0.7"/></svg>',
    PAYLOAD_EXPLOSIVE: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff6600"/><path d="M12 4L12 8M12 16L12 20M4 12L8 12M16 12L20 12" stroke="#ff9900" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="#ffff00"/></svg>',
    PAYLOAD_SLOWMO: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#88ddff" opacity="0.7"/><path d="M8 12H16M8 9H14M8 15H14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    // UI ICONS
    UI_TROPHY: '<svg viewBox="0 0 24 24"><path d="M12 17C15 17 18 14 18 10V4H6V10C6 14 9 17 12 17Z" fill="#ffcc00"/><rect x="8" y="20" width="8" height="2" rx="1" fill="#ff8800"/></svg>',
    UI_STAR: '<svg viewBox="0 0 24 24"><path d="M12 2L14 8L20 9L15 14L17 21L12 17L7 21L9 14L4 9L10 8Z" fill="#ffcc00"/></svg>',
    UI_HEART: '<svg viewBox="0 0 24 24"><path d="M12 21C12 21 4 14 4 8.5C4 5.4 6.4 3 9.5 3C11 3 12 4 12 4C12 4 13 3 14.5 3C17.6 3 20 5.4 20 8.5C20 14 12 21 12 21Z" fill="#ff2244"/></svg>',
    UI_LOCK: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="12" rx="2" fill="#555566"/><circle cx="12" cy="16" r="2" fill="#ffff00"/></svg>',
    UI_CHECK: '<svg viewBox="0 0 24 24"><path d="M9 12L11 14L15 10" stroke="#00ff88" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
    UI_ARROW_RIGHT: '<svg viewBox="0 0 24 24"><path d="M5 12H19M13 6L19 12L13 18" stroke="#00fff2" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    // Helper to get icon by peg type
    getPegIcon: function(type) { return this['PEG_' + ['NODE','CACHE','TELEPORT','SEISMIC','EXPLOSIVE','DORMANT','ICE','FIBER','MIRROR','HONEYPOT','OVERLOAD'][type] || 'PEG_NODE']; },
    // Helper to get icon by slot type
    getSlotIcon: function(type) { return this['SLOT_' + ['EMPTY','CREDITS','AMPLIFY','PAYLOAD','CRUMBLE','SHIELD','OVERCLOCK','JACKPOT'][type] || 'SLOT_EMPTY']; },
    // Helper to get icon by payload type
    getPayloadIcon: function(type) { return this['PAYLOAD_' + ['SCRAMBLER','TROJAN','WORM','LOGIC_BOMB','DAEMON','GHOST','CLUSTER','EXPLOSIVE','SLOWMO'][type] || 'PAYLOAD_SCRAMBLER']; }
};
