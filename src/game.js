// game.js — central game state and lifecycle handlers

// Module dependencies will be injected via initGame so this file stays decoupled.
import { clearProjectiles } from "./projectiles.js"
import { getDamageMultiplier, getKnockbackStrength, getArmorReductionPercent, getXPMultiplier, getDodgeChancePercent, getMaxHealthBonus } from "./skills.js"

let deps = {}

let score = 0
let bombs = 3
let playerHealth = 5
let invincible = false
let gameOverFlag = false
let paused = false
// Fortify: track how much Fortify bonus has been applied this round so
// we can adjust current health when the skill is leveled mid-round.
let _appliedFortifyBonus = 0

export function initGame(options = {}) {
    // expected options: spawnPlayer, spawnEnemy, renderHearts, renderBombs, setScore,
    // spawnXPGem, addXP, resetXP, resetXPFill, playDebounced, initialEnemies,
    // spawnPowerups
    deps = options
    score = 0
    bombs = options.initialBombs || 3
    // base health for the round plus Fortify bonus (applies only for this round)
    const base = options.initialHealth || 5
    let bonus = 0
    try { bonus = typeof getMaxHealthBonus === 'function' ? getMaxHealthBonus() : 0 } catch (e) { }
    playerHealth = Math.max(1, base + (bonus || 0))
    _appliedFortifyBonus = bonus || 0
    invincible = false
    gameOverFlag = false

    if (deps.setScore) deps.setScore(0)
    if (deps.renderHearts) deps.renderHearts(playerHealth)
    if (deps.renderBombs) deps.renderBombs(bombs)
    // spawn any initial powerups (optional)
    if (deps.spawnPowerups) try { deps.spawnPowerups() } catch (e) { }
}

export function isGameOver() {
    return gameOverFlag
}

export function isPaused() { return paused }

export function pauseGame() { paused = true }

export function resumeGame() { paused = false }

export function updateScore() {
    score++
    if (deps.setScore) deps.setScore(score)
}

export function addFloatingScore(position) {
    const floatingText = add([
        text("+1", { size: 24 }),
        pos(position),
        color(255, 200, 0),
        lifespan(1, { fade: 0.5 }),
        anchor("center"),
    ])
    floatingText.onUpdate(() => {
        floatingText.move(0, -800 * dt())
    })
}

export function handleProjectileEnemyCollision(p, e) {
    destroy(p)
    // base damage 1, modified by Power Strike multiplier
    try {
        const dmgMult = getDamageMultiplier('skill_power') || 1
        // if projectile was flagged critical, amplify damage
        const base = 1
        const critMult = (p && p.isCrit) ? 1.5 : 1
        const dmg = Math.max(1, Math.round(base * dmgMult * critMult))
        e.hp -= dmg
        // apply knockback to enemy if available
        const kb = getKnockbackStrength()
        try {
            if (kb && e && e.pos && p && p.pos) {
                const dir = e.pos.sub(p.pos).unit()
                e.move && e.move(dir.scale(kb))
                // also nudge position directly (in case move isn't present)
                try { e.pos = e.pos.add(dir.scale(kb * 0.25)) } catch (e) { }
            }
        } catch (err) { }
    } catch (err) {
        e.hp -= 1
    }
    if (e.hp <= 0) {
        destroy(e)
        addFloatingScore(e.pos.add(e.width / 2, e.height / 2))
        updateScore()
        if (deps.spawnXPGem) deps.spawnXPGem(e.pos)
        if (deps.spawnEnemy) wait(1.5, () => { if (!gameOverFlag) deps.spawnEnemy() })
    }
}

export function handlePlayerPickupXP(p, g) {
    try {
        const mult = getXPMultiplier ? getXPMultiplier() : 1
        const val = Math.max(1, Math.round((g.value || 1) * mult))
        if (deps.addXP) deps.addXP(val)
    } catch (e) {
        if (deps.addXP) deps.addXP(g.value || 1)
    }
    destroy(g)
}

export function handleBombPress() {
    if (bombs <= 0 || gameOverFlag) return
    bombs--
    if (deps.renderBombs) deps.renderBombs(bombs)
    for (const enemy of get("enemy")) {
        if (deps.playDebounced) deps.playDebounced("explosion", { volume: 0.09 }, 200)

        destroy(enemy)
        addFloatingScore(enemy.pos)
        updateScore()
        if (deps.spawnXPGem) deps.spawnXPGem(enemy.pos)
        if (deps.spawnEnemy) wait(1.5, () => { if (!gameOverFlag) deps.spawnEnemy() })
    }
}

export function playerHitByEnemy(enemy, playerEntity) {
    if (!invincible) {
        invincible = true
        // check dodge chance first (Escape skill)
        try {
            const dodge = typeof getDodgeChancePercent === 'function' ? getDodgeChancePercent() : 0
            if (dodge && Math.random() * 100 < dodge) {
                // dodged — no damage
                wait(0.5, () => invincible = false)
                return
            }
        } catch (e) { }
        // base damage 1; reduce by armor percent from skill_armor
        try {
            const armorPct = getArmorReductionPercent() || 0
            const dmg = Math.max(1, Math.round(1 * (1 - armorPct / 100)))
            playerHealth -= dmg
        } catch (e) {
            playerHealth -= 1
        }
        if (deps.renderHearts) deps.renderHearts(playerHealth)
        // push player back a bit
        if (playerEntity && enemy) playerEntity.move(playerEntity.pos.sub(enemy.pos).unit().scale(50))
        wait(0.5, () => invincible = false)
        if (playerHealth <= 0) gameOver()
    }
}

export function gameOver() {
    gameOverFlag = true
    // remove player entity if present
    const p = get("player")[0]
    if (p) destroy(p)
    destroyAll("enemy")
    // clear projectiles via central module
    clearProjectiles()

    add([
        sprite("gameOver"),
        pos(width() / 2, height() / 2 - 50),
        anchor("center"),
        fixed(),
        "ui",
    ])

    const restartBtn = add([
        sprite("restart"),
        pos(width() / 2, height() / 2 + 50),
        area(),
        anchor("center"),
        fixed(),
        "restartBtn",
    ])

    onClick("restartBtn", () => {
        destroy(restartBtn)
        restartGame()
    })
}

export function restartGame() {
    gameOverFlag = false
    playerHealth = deps.initialHealth || 5
    bombs = deps.initialBombs || 3
    score = 0

    if (deps.resetXP) deps.resetXP()
    if (deps.resetXPFill) deps.resetXPFill()
    // reset skill state if the caller provided a reset hook
    if (deps.resetSkills) try { deps.resetSkills() } catch (e) { }

    if (deps.renderHearts) deps.renderHearts(playerHealth)
    if (deps.renderBombs) deps.renderBombs(bombs)
    if (deps.setScore) deps.setScore(0)

    destroyAll("enemy")
    // ensure projectiles are cleared
    clearProjectiles()
    destroyAll("xpGem")
    destroyAll("ui")
    destroyAll("restartBtn")

    // spawn a fresh player and initial enemies via injected functions
    if (deps.spawnPlayer) deps.spawnPlayer()
    const initial = deps.initialEnemies || 5
    for (let i = 0; i < initial; i++) {
        if (deps.spawnEnemy) deps.spawnEnemy()
    }
    // spawn powerups again after restart if provided
    if (deps.spawnPowerups) try { deps.spawnPowerups() } catch (e) { }
}

// Called when Fortify skill changes to apply any additional bonus for the
// remainder of this round. Increases playerHealth by the delta between the
// new bonus and the previously applied bonus, and updates the HUD if available.
export function refreshFortifyBonus() {
    try {
        const newBonus = typeof getMaxHealthBonus === 'function' ? getMaxHealthBonus() : 0
        const delta = Math.max(0, (newBonus || 0) - (_appliedFortifyBonus || 0))
        if (delta > 0) {
            playerHealth = playerHealth + delta
            _appliedFortifyBonus = newBonus || 0
            if (deps.renderHearts) deps.renderHearts(playerHealth)
        }
    } catch (e) { }
}

export function getAppliedFortifyBonus() { return _appliedFortifyBonus }
