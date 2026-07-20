// Polyfill: define 'self' for Node.js (fixes webpack runtime in Next.js 15 server bundles)
if (typeof self === 'undefined') {
  globalThis.self = globalThis;
}
