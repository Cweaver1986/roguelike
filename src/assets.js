// assets.js — asset lists and loader

export const assetsCharacters = [
    "player",
    "player2",
    "player3",
];

export const assetsEnemies = [
    "zombie1",
    "zombie2",
    "zombie3",
    "zombie4",
];

export const assetsGame = [
    "background",
    "heart",
    "scoreboard",
    "miniMapBorder",
    "pauseMenu",
    "xpGem",
    "xpBar",
    "xpBarFull",
];

export const assetsWeapons = [
    "bullet",
    "bomb",
];

export const assetsPowerups = [
    "magnet",
    "fastAttack",
    "fastMovement"
];

export const assetsSounds = [
    "bulletsound",
    "explosion",
    "spooky",
    "zombie1",
    "zombie2",
    "zombie3",
];

export const assetsButtons = [
    "restart",
    "gameOver",
];

export const zombieSounds = ["zombie1", "zombie2", "zombie3"]

// loadAll schedules loadSprite/loadSound calls on the kaboom global (imported by main.js)
export function loadAll() {
    // Kaboom registers global loadSprite/loadSound functions after initialization.
    // Call the global loader functions directly (do not call methods on the kaboom initializer).
    assetsCharacters.forEach(name => loadSprite(name, `assetsCharacters/${name}.png`));
    assetsEnemies.forEach(name => loadSprite(name, `assetsEnemies/${name}.png`));
    assetsGame.forEach(name => loadSprite(name, `assetsGame/${name}.png`));
    assetsWeapons.forEach(name => loadSprite(name, `assetsWeapons/${name}.png`));
    assetsPowerups.forEach(name => loadSprite(name, `assetsPowerups/${name}.png`));
    assetsButtons.forEach(name => loadSprite(name, `assetsButtons/${name}.png`));
    assetsSounds.forEach(name => loadSound(name, `assetsSounds/${name}.mp3`));
    // loadSprite & loadSound register resources synchronously in Kaboom,
    // so we can resolve immediately.
    return Promise.resolve();
}
