// skills.js - simple skill registry for the roguelike
// Provides 10 placeholder skills and basic player-level state.

const SKILLS = [
    { id: 'skill_power', name: 'Power Strike', desc: 'Deal extra damage on hit.' },
    { id: 'skill_fortify', name: 'Fortify', desc: 'Increase max health.' },
    { id: 'skill_swift', name: 'Swift Foot', desc: 'Move slightly faster.' },
    { id: 'skill_focus', name: 'Focus', desc: 'Gain extra XP from enemies.' },
    { id: 'skill_barrage', name: 'Barrage', desc: 'Fire additional projectiles.' },
    { id: 'skill_magnet', name: 'Magnetism', desc: 'Pick up nearby items.' },
    { id: 'skill_armor', name: 'Armor Plating', desc: 'Reduce incoming damage.' },
    { id: 'skill_knockback', name: 'Knockback', desc: 'Small knockback on hit.' },
    { id: 'skill_expert', name: 'Expertise', desc: 'Critical hit chance up.' },
    { id: 'skill_escape', name: 'Escape Artist', desc: 'Chance to dodge attacks.' },
]

// player skill levels, stored as { skillId: level } where level is 0..5
const playerSkills = {}
for (const s of SKILLS) playerSkills[s.id] = 0

export function getAllSkills() { return SKILLS.slice() }

export function getSkillById(id) { return SKILLS.find(s => s.id === id) }

export function getPlayerSkillLevel(id) {
    if (!id) return 0
    return playerSkills[id] || 0
}

// --- Per-skill effect tables (index = level 0..5) ---
const EFFECTS = {
    // Power Strike: multiplicative damage per level (+10% per level)
    skill_power: { dmgMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5] },
    // Fortify: extra hearts per level
    skill_fortify: { hpBonus: [0, 1, 2, 3, 4, 5] },
    // Swift Foot: move speed multiplier (+10% per level)
    skill_swift: { moveMult: [1, 1.1, 1.2, 1.3, 1.4, 1.5] },
    // Focus: XP multiplier (levels: 0->1x, 1->1.5x, 2->2x, 3->2.5x, 4->3.25x, 5->4x)
    skill_focus: { xpMult: [1, 1.5, 2, 2.5, 3.25, 4] },
    // Barrage: extra projectiles mapping (level 1 -> +1, level3 -> +3, level5 -> +5)
    skill_barrage: { extraProjectiles: [0, 1, 1, 3, 3, 5] },
    // Magnet: pickup range multiplier (level1 1.5x -> level5 2.5x) linear steps
    skill_magnet: { pickupMult: [1, 1.5, 1.75, 2.0, 2.25, 2.5] },
    // Armor: damage reduction percent
    skill_armor: { dmgReductionPct: [0, 10, 20, 30, 40, 50] },
    // Knockback: small knockback strength (pixels)
    skill_knockback: { knockback: [0, 40, 60, 80, 100, 120] },
    // Expertise: crit chance percent
    skill_expert: { critPct: [0, 5, 10, 15, 20, 25] },
    // Escape: dodge chance percent
    skill_escape: { dodgePct: [0, 10, 15, 20, 25, 30] },
}

// Helper to safely read effect arrays
function _lookup(id, key, level) {
    const data = EFFECTS[id]
    if (!data || !Array.isArray(data[key])) return null
    const lv = Math.max(0, Math.min(5, level || 0))
    return data[key][lv]
}

// bump skill level by 1 up to max 5. returns new level.
export function bumpSkillLevel(id) {
    if (!id) return 0
    if (!(id in playerSkills)) playerSkills[id] = 0
    const cur = playerSkills[id] || 0
    const next = Math.min(5, cur + 1)
    playerSkills[id] = next
    // debug: bumped skill
    // try { console.log(`[skills] bumped ${id} -> ${next}`) } catch (e) {}
    return next
}

// pick N random distinct skills (shallow objects)
export function pickRandomSkills(n = 3, { excludeMaxed = true } = {}) {
    // Build a source list optionally excluding skills that are already at max level
    let source = SKILLS.slice()
    if (excludeMaxed) {
        source = source.filter(s => {
            const lvl = playerSkills[s.id] || 0
            return lvl < 5
        })
    }
    const out = []
    for (let i = 0; i < n && source.length > 0; i++) {
        const idx = Math.floor(Math.random() * source.length)
        out.push(source.splice(idx, 1)[0])
    }
    return out
}

export function resetAllSkills() {
    for (const k of Object.keys(playerSkills)) playerSkills[k] = 0
    // debug: reset all skills
    // try { console.log('[skills] reset all skills to 0') } catch (e) {}
}

// --- Derived getters (read player's current level and return modifiers) ---
export function getDamageMultiplier(skillId) {
    const lvl = getPlayerSkillLevel(skillId)
    const m = _lookup(skillId, 'dmgMult', lvl)
    return m == null ? 1 : m
}

export function getMaxHealthBonus() {
    return _lookup('skill_fortify', 'hpBonus', getPlayerSkillLevel('skill_fortify')) || 0
}

export function getMoveSpeedMultiplier() {
    return _lookup('skill_swift', 'moveMult', getPlayerSkillLevel('skill_swift')) || 1
}

export function getXPMultiplier() {
    return _lookup('skill_focus', 'xpMult', getPlayerSkillLevel('skill_focus')) || 1
}

export function getExtraProjectiles() {
    return _lookup('skill_barrage', 'extraProjectiles', getPlayerSkillLevel('skill_barrage')) || 0
}

export function getPickupRangeMultiplier() {
    return _lookup('skill_magnet', 'pickupMult', getPlayerSkillLevel('skill_magnet')) || 1
}

export function getArmorReductionPercent() {
    return _lookup('skill_armor', 'dmgReductionPct', getPlayerSkillLevel('skill_armor')) || 0
}

export function getCritChancePercent() {
    return _lookup('skill_expert', 'critPct', getPlayerSkillLevel('skill_expert')) || 0
}

export function getDodgeChancePercent() {
    return _lookup('skill_escape', 'dodgePct', getPlayerSkillLevel('skill_escape')) || 0
}

export function getKnockbackStrength() {
    return _lookup('skill_knockback', 'knockback', getPlayerSkillLevel('skill_knockback')) || 0
}

// Expose a few helpers for debugging in the dev console
try {
    globalThis.getPlayerSkillLevel = getPlayerSkillLevel
    globalThis.getPickupRangeMultiplier = getPickupRangeMultiplier
    globalThis.bumpSkillLevel = bumpSkillLevel
} catch (e) { }
