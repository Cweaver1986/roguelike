import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs"

// === Kaboom Init ===
// Initialize Kaboom with a black background
kaboom({ background: [0, 0, 0] })

// === Load assets ===
// Load character sprites
const assetsCharacters = [
    "player", "player2", "player3",
];
assetsCharacters.forEach(name => {
    loadSprite(name, `assetsCharacters/${name}.png`);
});

// Load enemy sprites
const assetsEnemies = [
    "enemy1", "enemy2", "enemy3", "enemy4",
];
assetsEnemies.forEach(name => {
    loadSprite(name, `assetsEnemies/${name}.png`);
});

// Load game UI / art assets
const assetsGame = [
    "background", "heart", "scoreboard", "xpGem", "xpBar", "xpBarFull"
];
assetsGame.forEach(name => {
    loadSprite(name, `assetsGame/${name}.png`);
});

// Load weapon sprites
const assetsWeapons = [
    "bullet", "bomb",
];
assetsWeapons.forEach(name => {
    loadSprite(name, `assetsWeapons/${name}.png`);
});

// Load sounds
const assetsSounds = [
    "bulletsound", "explosion", "spooky", "zombie1", "zombie2", "zombie3"
];
assetsSounds.forEach(name => {
    loadSound(name, `assetsSounds/${name}.mp3`);
});

// Load UI button sprites
const assetsButtons = [
    "restart", "gameOver",
];
assetsButtons.forEach(name => {
    loadSprite(name, `assetsButtons/${name}.png`);
});

// Array of zombie ambient sounds (used later during the game)
const zombieSounds = ["zombie1", "zombie2", "zombie3"]
zombieSounds.forEach(s => loadSound(s, `assetsSounds/${s}.mp3`))

// === Constants ===
const PLAYER_SPEED = 120
const ENEMY_SPEED = 75
// padding for enemy spawn inside the screen bounds
const ENEMY_PADDING = 64 // Increased from 32 to 64
const INITIAL_ENEMIES = 5
const w = width()
const h = height()

// Difficulty scaling settings
const MAX_ENEMIES = 25
// current maximum allowed enemies (grows over time)
let currentMaxEnemies = INITIAL_ENEMIES

// === Game state ===
let player
let playerHealth = 5
let invincible = false
let gameOverFlag = false
let bombs = 3
let score = 0
// which way the player is currently facing (used for movement/shooting)
let facing = vec2(1, 0)

// === XP / Leveling ===
let xp = 0
let level = 1
const MAX_LEVELS = 25
const BASE_XP = 10
const XP_STEP = 5

// Simple formula for XP needed to reach the next level
function xpToNext(lev) {
    return BASE_XP + (lev - 1) * XP_STEP
}

// === HUD Elements ===

// === HUD / Audio helpers ===
// sound debounce helper to avoid spamming short sounds
const _lastPlay = {}
function playDebounced(name, opts = {}, minGap = 100) {
    const now = Date.now()
    if (!_lastPlay[name] || now - _lastPlay[name] > minGap) {
        _lastPlay[name] = now
        play(name, opts)
    }
}

// Bomb HUD pooling: pre-create small bomb sprites for the HUD and reuse them
const MAX_BOMB_DISPLAY = 8
let bombPool = []
function initBombPool() {
    if (bombPool.length > 0) return
    for (let i = 0; i < MAX_BOMB_DISPLAY; i++) {
        const b = add([sprite("bomb"), pos(-100, -100), scale(0.15), fixed(), "hudBomb"])
        b.hidden = true
        bombPool.push(b)
    }
}

function renderBombs() {
    initBombPool()
    for (let i = 0; i < bombPool.length; i++) {
        const b = bombPool[i]
        if (i < bombs) {
            // position visible bombs in a row
            b.pos = vec2(24 + i * 32, 50)
            b.hidden = false
        } else {
            b.hidden = true
        }
    }
}
// render initial bomb HUD
renderBombs();

// Heart HUD pooling: reuse heart sprites for the HP display
const MAX_HEART_DISPLAY = 10
let heartPool = []
function initHeartPool() {
    if (heartPool.length > 0) return
    for (let i = 0; i < MAX_HEART_DISPLAY; i++) {
        const h = add([sprite("heart"), pos(-100, -100), scale(0.085), fixed(), "hudHeart"])
        h.hidden = true
        heartPool.push(h)
    }
}

function renderHearts() {
    initHeartPool()
    for (let i = 0; i < heartPool.length; i++) {
        const h = heartPool[i]
        if (i < playerHealth) {
            // place hearts from left to right
            h.pos = vec2(24 + i * 32, 12)
            h.hidden = false
        } else {
            h.hidden = true
        }
    }
}
// render initial hearts
renderHearts();
// Score text in the HUD
const scoreText = add([
    text(`0`, { size: 24 }),
    pos(w / 2, 45),
    anchor("center"),
    fixed(),
    color(200, 200, 0),
    z(2)
]);

// Scoreboard background graphic for the score text
const scoreboardSprite = add([
    sprite("scoreboard"),
    pos(w / 2, 40),
    anchor("center"),
    fixed(),
    scale(0.5), // adjust as needed
    z(1)
]);

// XP bar at bottom center (frame sprite)
function createXPBar() {
    const bar = add([
        sprite("xpBar"),
        pos(w / 2, h - 24),
        anchor("center"),
        fixed(),
        scale(1),
        z(3),
        "xpBar"
    ])
    return bar
}
const xpBarEntity = createXPBar()

// XP UI: a simple rectangle fill that grows left-to-right under the xpBar frame
const XP_BAR_WIDTH = 180
const XP_BAR_HEIGHT = 12
// tuning offsets (adjust these to align the fill with your artwork)
const XP_FILL_OFFSET_X = -20 // left offset (negative moves fill left)
const XP_FILL_OFFSET_Y = -8 // up offset (negative moves fill up)
const XP_FILL_SCALE_FACTOR = 1.3
// compute initial fill position relative to the xpBar sprite
const leftX = xpBarEntity.pos.x - XP_BAR_WIDTH / 2 + XP_FILL_OFFSET_X
const fillY = xpBarEntity.pos.y + XP_FILL_OFFSET_Y
const xpFill = add([
    rect(XP_BAR_WIDTH, XP_BAR_HEIGHT),
    pos(leftX, fillY),
    anchor("topleft"),
    fixed(),
    color(255, 200, 0),
    z(4),
    // start scaled to zero width; onUpdate will lerp this toward target
    scale(0, 1.1),
])

// XP level + counter displayed above the bar
const xpText = add([
    text(`LV ${level} ${xp}/${xpToNext(level)}`, { size: 14 }),
    pos(xpBarEntity.pos.x, xpBarEntity.pos.y - 22),
    anchor("center"),
    fixed(),
    color(255, 255, 255),
    z(4),
])

function updateXPUI() {
    const req = xpToNext(level)
    const ratio = Math.min(1, xp / req)
    if (xpFill) {
        // set target scale (multiplied by fill factor); xpFill will smoothly lerp to this
        xpFill.targetScaleX = ratio * XP_FILL_SCALE_FACTOR
    }
    xpText.text = `LV ${level} ${xp}/${req}`
}

// Smoothly animate the xpFill scale towards targetScaleX
if (typeof xpFill !== 'undefined') {
    // initialize target
    xpFill.targetScaleX = xpFill.targetScaleX || 0
    xpFill.onUpdate(() => {
        const cur = xpFill.scale.x || 0
        const target = xpFill.targetScaleX || 0
        const speed = 6 // higher = snappier
        const next = cur + (target - cur) * Math.min(1, speed * dt())
        xpFill.scale.x = next
        if (Math.abs(next - target) < 0.001) xpFill.scale.x = target
    })
}

function checkLevelUp() {
    while (level < MAX_LEVELS && xp >= xpToNext(level)) {
        xp -= xpToNext(level)
        level++
        // level-up: you could give perks here (left intentionally simple)
    }
    updateXPUI()
}

function spawnXPGem(atPos) {
    add([
        sprite("xpGem"),
        pos(atPos),
        scale(0.2),
        area(),
        anchor("center"),
        "xpGem",
        { value: 1 }
    ])
}

// === Utility Functions ===
function updateScore() {
    score++
    scoreText.text = `${score}`
}

function addFloatingScore(position) {
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

function spawnPlayer() {
    player = add([
        sprite("player"),
        scale(0.2),
        pos(w / 2, h / 2),
        anchor("center"),
        area({ scale: .7 }),
        //color(0, 255, 0),
        "player"
    ])
}

function spawnEnemy() {
    if (gameOverFlag) return
    // Pick a random enemy sprite
    const enemySprites = ["enemy1", "enemy2", "enemy3", "enemy4"];
    const spriteName = enemySprites[Math.floor(Math.random() * enemySprites.length)];
    const minDistance = 200; // Minimum distance from player

    let x, y;
    do {
        x = rand(ENEMY_PADDING, w - ENEMY_PADDING);
        y = rand(ENEMY_PADDING, h - ENEMY_PADDING);
    } while (player && vec2(x, y).dist(player.pos) < minDistance);

    add([
        sprite(spriteName),
        scale(0.4),
        pos(x, y),
        anchor("center"),
        area({ scale: .7 }),
        "enemy",
        { hp: 1 },
    ]);
}

function getShootDir() {
    return mousePos().sub(player.pos).unit()
}

// === Game Setup ===

// Play spooky music
play("spooky", {
    loop: true,
    volume: .12 // adjust as needed
});

// Add tiled background
const tileSize = 102 // adjust to match your background.png size
for (let x = 0; x < w; x += tileSize) {
    for (let y = 0; y < h; y += tileSize) {
        add([
            sprite("background"),
            pos(x, y),
            anchor("topleft"),
            scale(.25),
            z(-1),
            color(150, 150, 150)
        ])
    }
}

spawnPlayer()
for (let i = 0; i < INITIAL_ENEMIES; i++) spawnEnemy()

// Increase difficulty: every 9 seconds, increase the current max by 1 (up to MAX_ENEMIES)
loop(9, () => {
    if (gameOverFlag) return
    if (currentMaxEnemies < MAX_ENEMIES) {
        currentMaxEnemies++
        // spawn one immediately so the total can reach the new cap
        if (get("enemy").length < currentMaxEnemies) {
            spawnEnemy()
        }
    }
})

// Maintain a dynamic minimum active enemy floor: half of the current max
loop(1, () => {
    if (gameOverFlag) return
    const minActive = Math.floor(currentMaxEnemies / 2)
    const current = get("enemy").length
    if (current < minActive) {
        // spawn one per second until we reach the minimum to avoid sudden bursts
        spawnEnemy()
    }
})

// Play a random zombie sound every 12s if any enemies exist
loop(12, () => {
    const enemies = get("enemy")
    if (enemies.length > 0) {
        const snd = zombieSounds[Math.floor(Math.random() * zombieSounds.length)]
        play(snd, { volume: 0.1 })
    }
})

// === Player Movement ===
onUpdate(() => {
    let x = 0, y = 0
    if (isKeyDown("a")) x -= 1.5
    if (isKeyDown("d")) x += 1.5
    if (isKeyDown("w")) y -= 1.5
    if (isKeyDown("s")) y += 1.5
    if (x || y) {
        facing = vec2(x, y).unit()
        player.move(x * PLAYER_SPEED, y * PLAYER_SPEED)
    }
    // Rotate player to face direction of fire (mouse cursor)
    const dir = getShootDir();
    const angle = dir.angle() * (3 / Math.PI);
    player.angle = angle + 90;
    // Rotation logic removed
})

// === Auto Attack ===
loop(0.4, () => {
    if (gameOverFlag) return
    const dir = getShootDir()
    playDebounced("bulletsound", { volume: 0.075 }, 90)
    // Offset bullet spawn to barrel
    const barrelOffset = 32 // adjust as needed for your sprite
    const spawnPos = player.pos.add(dir.scale(barrelOffset))
    // Rotate bullet to match player angle minus 140 degrees
    const bulletAngle = player.angle - 90
    const bullet = add([
        sprite("bullet"),
        pos(spawnPos),
        area(),
        anchor("center"),
        scale(0.14),
        move(dir, 400),
        rotate(bulletAngle),
        "projectile",
    ])
})

// === Enemy Movement & Collision ===
onUpdate("enemy", (e) => {
    const dir = player.pos.sub(e.pos).unit()
    e.move(dir.scale(ENEMY_SPEED))
    // Rotate enemy to face player
    const angle = dir.angle() * (3 / Math.PI)
    e.angle = angle + 90
    if (!invincible && player.isColliding(e)) {
        invincible = true
        playerHealth -= 1
        renderHearts();
        player.move(player.pos.sub(e.pos).unit().scale(50))
        wait(0.5, () => invincible = false)
        if (playerHealth <= 0) gameOver()
    }
})

// === Bomb Feature ===
onKeyPress("b", () => {
    if (bombs <= 0 || gameOverFlag) return
    bombs--
    renderBombs();
    for (const enemy of get("enemy")) {
        playDebounced("explosion", { volume: 0.09 }, 200)

        destroy(enemy)
        addFloatingScore(enemy.pos)
        updateScore()
        // spawn xp gem for each destroyed enemy by bomb
        spawnXPGem(enemy.pos)
        checkLevelUp()
        wait(1.5, () => spawnEnemy())
    }
})

// === Projectile/Enemy Collision ===
onCollide("projectile", "enemy", (p, e) => {
    destroy(p)
    e.hp -= 1
    if (e.hp <= 0) {
        destroy(e)
        addFloatingScore(e.pos.add(e.width / 2, e.height / 2))
        updateScore()
        // spawn xp gem worth 1
        spawnXPGem(e.pos)
        checkLevelUp()
        wait(1.5, () => spawnEnemy())
    }
})
// (bomb loop handles xp spawn below)
// Player picking up XP gems
onCollide("player", "xpGem", (p, g) => {
    xp += g.value || 1
    destroy(g)
    checkLevelUp()
})

// === Game Over & Restart ===
function restartGame() {
    gameOverFlag = false
    playerHealth = 5
    bombs = 3
    score = 0
    // reset XP and level
    xp = 0
    level = 1
    updateXPUI()
    // reset visual fill
    if (xpFill) xpFill.scale.x = 0
    renderHearts();
    renderBombs();
    scoreText.text = `Score: 0`
    destroyAll("enemy")
    destroyAll("projectile")
    destroyAll("xpGem")
    destroyAll("ui")
    destroyAll("restartBtn")
    spawnPlayer()
    for (let i = 0; i < INITIAL_ENEMIES; i++) spawnEnemy()
}

function gameOver() {
    gameOverFlag = true
    destroy(player)
    destroyAll("enemy")
    destroyAll("projectile")
    add([
        sprite("gameOver"),
        pos(width() / 2, height() / 2 - 50),
        anchor("center"),
        "ui"
    ])
    const restartBtn = add([
        sprite("restart"),
        pos(width() / 2, height() / 2 + 50),
        area(),
        anchor("center"),
        "restartBtn"
    ])

    onClick("restartBtn", () => {
        destroy(restartBtn)
        restartGame()
    })
}