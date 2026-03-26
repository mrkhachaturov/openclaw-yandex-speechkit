# openclaw-yandex-speechkit

Yandex SpeechKit speech synthesis provider for [OpenClaw](https://github.com/openclaw/openclaw).

Adds Yandex SpeechKit as a TTS provider, enabling voice replies in Telegram, Talk Mode, and any channel that supports voice messages. Uses the [SpeechKit REST API v3](https://yandex.cloud/docs/speechkit/tts/api/tts-v3-rest) with OGG/Opus output for compact, Telegram-native voice bubbles.

## Install

```bash
openclaw plugins install openclaw-yandex-speechkit
```

Or install manually and register in your config:

```bash
npm install openclaw-yandex-speechkit
```

## Configuration

Set your Yandex Cloud credentials:

```bash
# In .openclaw/.env
YANDEX_API_KEY=your-api-key
YANDEX_FOLDER_ID=your-folder-id
```

Then configure TTS in `openclaw.json`:

```json5
{
  "tts": {
    "provider": "yandex"
  },
  "plugins": {
    "entries": {
      "openclaw-yandex-speechkit": {
        "enabled": true,
        "config": {
          "apiKey": "${YANDEX_API_KEY}",
          "folderId": "${YANDEX_FOLDER_ID}",
          "voice": "alexander",
          "role": "good",
          "speed": 1.0
        }
      }
    }
  }
}
```

### Authentication

Two auth modes are supported:

| Mode | Env var | Header | Use case |
|------|---------|--------|----------|
| API Key | `YANDEX_API_KEY` | `Api-Key <key>` | Service accounts, long-lived |
| IAM Token | `YANDEX_IAM_TOKEN` | `Bearer <token>` | Short-lived (12h), federated accounts |

The plugin auto-detects IAM tokens (they start with `t1.`). You can also set `authType` explicitly in config.

When using IAM tokens, `folderId` is required.

## Voices

16 voices across 5 languages:

| Voice | Gender | Language | Roles |
|-------|--------|----------|-------|
| alexander | Male | Russian | good, evil, neutral |
| ermil | Male | Russian | good, neutral |
| zahar | Male | Russian | good, evil |
| filipp | Male | Russian | — |
| madirus | Male | Russian | — |
| marina | Female | Russian | friendly, whisper, neutral |
| oksana | Female | Russian | friendly, strict, neutral |
| jane | Female | Russian | good, evil, neutral |
| omazh | Female | Russian | good, evil, neutral |
| masha | Female | Russian | good, strict, friendly |
| dasha | Female | Russian | friendly, good, neutral |
| amira | Female | Kazakh | — |
| madi | Male | Kazakh | — |
| john | Male | English | good, neutral |
| lea | Female | German | — |
| nigora | Female | Uzbek | — |

See the [full voice reference](https://yandex.cloud/docs/speechkit/tts/voices) for details.

## Audio formats

| Format | Config value | Extension | Best for |
|--------|-------------|-----------|----------|
| OGG/Opus | `oggopus` | `.opus` | Telegram voice bubbles (default) |
| MP3 | `mp3` | `.mp3` | General playback |
| WAV | `wav` | `.wav` | Lossless, post-processing |

The plugin automatically selects OGG/Opus for voice-note targets (Telegram, Discord) and uses the configured format for other contexts.

## Config reference

All fields under `plugins.entries.openclaw-yandex-speechkit.config`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apiKey` | string | `$YANDEX_API_KEY` | API key or IAM token |
| `folderId` | string | `$YANDEX_FOLDER_ID` | Yandex Cloud folder ID |
| `voice` | string | `ermil` | Voice name |
| `role` | string | — | Voice role (emotion): good, evil, friendly, strict, neutral, whisper |
| `speed` | number | `1.0` | Speaking speed (0.1 - 3.0) |
| `format` | string | `oggopus` | Output format: oggopus, mp3, wav |
| `authType` | string | auto | Auth mode: `apiKey` or `iamToken` (auto-detected from token prefix) |

## Development

```bash
git clone git@github.com:mrkhachaturov/openclaw-yandex-speechkit.git
cd openclaw-yandex-speechkit
npm install
npm run build
npm test
```

### Local development with OpenClaw

Install as a path-based plugin:

```json5
// .openclaw/config/plugins.json5
{
  "entries": {
    "yandex-speechkit": { "enabled": true }
  },
  "installs": {
    "yandex-speechkit": {
      "source": "path",
      "installPath": "/path/to/openclaw-yandex-speechkit"
    }
  }
}
```

## License

MIT
