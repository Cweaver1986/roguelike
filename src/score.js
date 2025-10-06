// score.js
// Manages score state and optional persistence, and notifies HUD via callback

let score = 0
let onScoreChanged = null
const STORAGE_KEY = "roguelike_score"

export function initScore(options = {}) {
    const { persist = false, initial = 0, onChange } = options
    onScoreChanged = onChange || null
    if (persist) {
        const saved = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
        score = isNaN(saved) ? initial : saved
    } else {
        score = initial
    }
    if (onScoreChanged) onScoreChanged(score)
}

export function getScore() {
    return score
}

export function setScore(n) {
    score = n || 0
    if (onScoreChanged) onScoreChanged(score)
    try { localStorage.setItem(STORAGE_KEY, `${score}`) } catch (e) { }
}

export function addScore(n = 1) {
    score += n
    if (onScoreChanged) onScoreChanged(score)
    try { localStorage.setItem(STORAGE_KEY, `${score}`) } catch (e) { }
    return score
}

export function resetScore() {
    score = 0
    if (onScoreChanged) onScoreChanged(score)
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) { }
}
