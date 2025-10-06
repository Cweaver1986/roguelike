// utils.js
// Small shared helpers

const _lastPlay = {}
export function playDebounced(name, opts = {}, minGap = 100) {
    const now = Date.now()
    if (!_lastPlay[name] || now - _lastPlay[name] > minGap) {
        _lastPlay[name] = now
        play(name, opts)
    }
}
