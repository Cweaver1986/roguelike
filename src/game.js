// game.js
// Central game state and handlers: score, bombs, health, collisions, game over & restart

// Module dependencies will be injected via initGame so this file stays decoupled.
import { clearProjectiles } from "./projectiles.js"

let deps = {}

let score = 0
let bombs = 3
let playerHealth = 5
let invincible = false
let gameOverFlag = false

export function initGame(options = {}) {
    // expected options: spawnPlayer, spawnEnemy, renderHearts, renderBombs, setScore,
    // spawnXPGem, addXP, resetXP, resetXPFill, playDebounced, initialEnemies
    deps = options
    score = 0
    bombs = options.initialBombs || 3
    playerHealth = options.initialHealth || 5
    invincible = false
    gameOverFlag = false

    if (deps.setScore) deps.setScore(0)
    if (deps.renderHearts) deps.renderHearts(playerHealth)
    if (deps.renderBombs) deps.renderBombs(bombs)
}

export function isGameOver() {
    return gameOverFlag
}

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
    e.hp -= 1
    if (e.hp <= 0) {
        destroy(e)
        addFloatingScore(e.pos.add(e.width / 2, e.height / 2))
        updateScore()
        if (deps.spawnXPGem) deps.spawnXPGem(e.pos)
        if (deps.addXP) deps.addXP(1)
        if (deps.spawnEnemy) wait(1.5, () => { if (!gameOverFlag) deps.spawnEnemy() })
    }
}

export function handlePlayerPickupXP(p, g) {
    if (deps.addXP) deps.addXP(g.value || 1)
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
        if (deps.addXP) deps.addXP(1)
        if (deps.spawnEnemy) wait(1.5, () => { if (!gameOverFlag) deps.spawnEnemy() })
    }
}

export function playerHitByEnemy(enemy, playerEntity) {
    if (!invincible) {
        invincible = true
        playerHealth -= 1
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
        "ui",
    ])

    const restartBtn = add([
        sprite("restart"),
        pos(width() / 2, height() / 2 + 50),
        area(),
        anchor("center"),
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
}
