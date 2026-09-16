const BASE_URL = 'http://localhost:8000'
globalThis.localStorage = { store: {}, getItem(k){ return this.store[k] ?? null } }

function taggingWsUrl() {
  const base = `${BASE_URL.replace(/^http/, 'ws')}/ws/tagging`
  const token = localStorage.getItem('auth_token')
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

console.log('no token   ->', taggingWsUrl())
localStorage.store.auth_token = 'eyJhbG.abc+/=xyz'
console.log('with token ->', taggingWsUrl())
