// audio.js — audio volume helpers and music playback

let masterVolume = 1
// defaults: music 15%, sfx 50%
let musicVolume = 0.15
let sfxVolume = 0.5

export function getMasterVolume() { return masterVolume }
export function getMusicVolume() { return musicVolume }
export function getSfxVolume() { return sfxVolume }

export function setMasterVolume(v) { masterVolume = Math.max(0, Math.min(1, v)) }
export function setMusicVolume(v) { musicVolume = Math.max(0, Math.min(1, v)) }
export function setSfxVolume(v) { sfxVolume = Math.max(0, Math.min(1, v)) }

// Provided for pause menu to call after changing the music slider.
// Currently a no-op (engine-specific volume updates are handled where music is played).
export function updateMusicVolume() {
    // Update currently playing music object's volume if possible.
    try {
        if (currentMusicObj) {
            // kaboom sound object may provide a .volume(value) method
            if (typeof currentMusicObj.volume === 'function') {
                currentMusicObj.volume(masterVolume * musicVolume)
            } else if (typeof currentMusicObj.setVolume === 'function') {
                currentMusicObj.setVolume(masterVolume * musicVolume)
            } else if ('volume' in currentMusicObj) {
                currentMusicObj.volume = masterVolume * musicVolume
            }
        }
        if (currentMusicElem) {
            currentMusicElem.volume = masterVolume * musicVolume
        }
    } catch (e) {
        // ignore runtime update failures
    }
}

// convenience: apply master & sfx multiplier to a provided opts object
export function applySfxVolume(opts = {}) {
    const base = (opts && typeof opts.volume === 'number') ? opts.volume : 1
    const vol = base * masterVolume * sfxVolume
    return Object.assign({}, opts, { volume: vol })
}

// --- music playback helpers ---
let currentMusicObj = null
let currentMusicElem = null

export function playMusic(name, opts = {}) {
    // stop any existing music
    stopMusic()
    const vol = masterVolume * musicVolume * (opts.volume === undefined ? 1 : opts.volume)
    // try to use Kaboom's play() first
    try {
        if (typeof play === 'function') {
            currentMusicObj = play(name, Object.assign({}, opts, { loop: !!opts.loop, volume: vol }))
            currentMusicElem = null
            return currentMusicObj
        }
    } catch (e) {
        // fall back to HTMLAudio
    }
    // fallback: create an HTMLAudioElement that points to the sounds folder
    try {
        const audioPath = `assetsSounds/${name}.mp3`
        const a = new Audio(audioPath)
        a.loop = !!opts.loop
        a.volume = vol
        a.play().catch(() => { /* ignore play errors (autoplay) */ })
        currentMusicElem = a
        currentMusicObj = null
        return a
    } catch (e) {
        console.warn('Failed to play music:', e)
        return null
    }
}

export function stopMusic() {
    try {
        if (currentMusicObj && typeof currentMusicObj.stop === 'function') currentMusicObj.stop()
    } catch (e) { }
    try {
        if (currentMusicElem) {
            currentMusicElem.pause()
            currentMusicElem.currentTime = 0
        }
    } catch (e) { }
    currentMusicObj = null
    currentMusicElem = null
}
