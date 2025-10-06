// utils.js — small shared helpers

import { applySfxVolume } from "./audio.js"

const _lastPlay = {}
export function playDebounced(name, opts = {}, minGap = 100) {
    const now = Date.now()
    if (!_lastPlay[name] || now - _lastPlay[name] > minGap) {
        _lastPlay[name] = now
        const finalOpts = applySfxVolume(opts)
        play(name, finalOpts)
    }
}
