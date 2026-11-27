// Learn more: https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/#web-setup
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web runs SQLite compiled to WebAssembly, so Metro must be able to bundle
// .wasm files. Native builds don't use this.
//
// We use only expo-sqlite's async API, which doesn't need the cross-origin isolation
// headers (COOP/COEP) the docs also mention: those are only for its synchronous API,
// which relies on SharedArrayBuffer.
config.resolver.assetExts.push('wasm');

module.exports = config;
