# CLAUDE.md — openclaw-yandex-speechkit

## Package

npm: `openclaw-yandex-speechkit` — Yandex SpeechKit speech synthesis provider plugin for OpenClaw.

## Stack

TypeScript (ESM), Node.js 22+, Vitest

## Structure

```
src/
├── index.ts              # Plugin entry: register speech provider
├── speech-provider.ts    # SpeechProviderPlugin implementation (voice list, config resolution, synthesis)
├── yandex-client.ts      # Yandex SpeechKit REST API v3 HTTP client
└── types.ts              # OpenClaw plugin SDK type stubs
```

## Commands

```bash
npm install               # install dependencies
npm run build             # tsc → dist/
npm test                  # vitest run src
npm run dev               # tsc --watch
```

## Architecture

The plugin registers a `SpeechProviderPlugin` with OpenClaw's provider registry. At runtime, when `tts.provider` is set to `"yandex"`, the gateway calls `synthesize()` which makes an HTTP POST to the Yandex SpeechKit v3 REST endpoint.

The v3 REST API returns newline-delimited JSON with base64-encoded audio chunks, which are concatenated into a single Buffer.

## Key decisions

- **Local type stubs** instead of depending on `openclaw` — zero runtime dependencies, works with any OpenClaw version that has speech provider support.
- **OGG/Opus for voice-note targets** — Telegram and Discord render `.opus` files as native voice bubbles. The plugin auto-selects this format.
- **Auto-detect IAM tokens** — tokens starting with `t1.` are automatically treated as IAM tokens without explicit `authType` config.

## Commit style

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`

## Publishing

Bump version in `package.json` and `CHANGELOG.md`, commit, tag `v*`, push. GitHub Actions publishes to npm and creates the GitHub Release notes from the matching `CHANGELOG.md` entry.
