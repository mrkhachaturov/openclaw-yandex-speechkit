import type {
  SpeechProviderPlugin,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
  SpeechVoiceOption,
} from "./types.js";
import { yandexTTS } from "./yandex-client.js";

const DEFAULT_VOICE = "ermil";
const DEFAULT_FORMAT = "oggopus";
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * All publicly available Yandex SpeechKit voices.
 *
 * Russian:  ermil, zahar, marina, oksana, jane, omazh, masha, alexander, dasha, filipp, madirus
 * Kazakh:   amira, madi
 * English:  john
 * German:   lea
 * Uzbek:    nigora
 *
 * See: https://yandex.cloud/docs/speechkit/tts/voices
 */
export const YANDEX_VOICES: ReadonlyArray<{
  id: string;
  name: string;
  gender: string;
  locale: string;
}> = [
  // Russian
  { id: "ermil", name: "Ermil", gender: "male", locale: "ru-RU" },
  { id: "zahar", name: "Zahar", gender: "male", locale: "ru-RU" },
  { id: "alexander", name: "Alexander", gender: "male", locale: "ru-RU" },
  { id: "filipp", name: "Filipp", gender: "male", locale: "ru-RU" },
  { id: "madirus", name: "Madirus", gender: "male", locale: "ru-RU" },
  { id: "marina", name: "Marina", gender: "female", locale: "ru-RU" },
  { id: "oksana", name: "Oksana", gender: "female", locale: "ru-RU" },
  { id: "jane", name: "Jane", gender: "female", locale: "ru-RU" },
  { id: "omazh", name: "Omazh", gender: "female", locale: "ru-RU" },
  { id: "masha", name: "Masha", gender: "female", locale: "ru-RU" },
  { id: "dasha", name: "Dasha", gender: "female", locale: "ru-RU" },
  // Kazakh
  { id: "amira", name: "Amira", gender: "female", locale: "kk-KK" },
  { id: "madi", name: "Madi", gender: "male", locale: "kk-KK" },
  // English
  { id: "john", name: "John", gender: "male", locale: "en-US" },
  // German
  { id: "lea", name: "Lea", gender: "female", locale: "de-DE" },
  // Uzbek
  { id: "nigora", name: "Nigora", gender: "female", locale: "uz-UZ" },
] as const;

export const YANDEX_VOICE_IDS = YANDEX_VOICES.map((v) => v.id);

/** Voice roles (emotional coloring) available for select voices. */
export const YANDEX_ROLES = [
  "neutral",
  "good",
  "evil",
  "friendly",
  "strict",
  "whisper",
] as const;

/** Supported audio output formats. */
export const YANDEX_FORMATS = ["oggopus", "mp3", "wav"] as const;

function resolveApiKey(): string | undefined {
  return process.env.YANDEX_API_KEY || process.env.YANDEX_IAM_TOKEN || undefined;
}

function resolveAuthType(): "apiKey" | "iamToken" {
  if (process.env.YANDEX_IAM_TOKEN && !process.env.YANDEX_API_KEY) {
    return "iamToken";
  }
  return "apiKey";
}

type ResolvedYandexConfig = {
  apiKey?: string;
  folderId?: string;
  voice: string;
  role?: string;
  speed?: number;
  format: string;
  authType: "apiKey" | "iamToken";
  timeoutMs: number;
};

/**
 * Resolve Yandex config from two possible locations:
 *   1. plugins.entries.yandex.config  — plugin config (standard for external plugins)
 *   2. tts.yandex                     — inline TTS config (works if schema is extended)
 *   3. Environment variables          — fallback
 *
 * Plugin config takes priority over tts.yandex when both exist.
 */
function resolveConfig(req: { cfg: Record<string, unknown>; config: Record<string, unknown> }): ResolvedYandexConfig {
  // Path 1: plugin config at plugins.entries.yandex.config
  const plugins = req.cfg?.plugins as Record<string, unknown> | undefined;
  const entries = plugins?.entries as Record<string, Record<string, unknown>> | undefined;
  const pluginConfig = entries?.["openclaw-yandex-speechkit"]?.config as Record<string, unknown> | undefined;

  // Path 2: inline tts.yandex config (if someone extends the schema)
  const ttsYandex = (req.config as Record<string, Record<string, unknown>>).yandex;

  // Merge: plugin config wins over tts.yandex
  const yandex = { ...ttsYandex, ...pluginConfig };

  const apiKey = (yandex.apiKey as string) || resolveApiKey();
  const folderId = (yandex.folderId as string) || process.env.YANDEX_FOLDER_ID || undefined;
  const voice = (yandex.voice as string)?.trim() || DEFAULT_VOICE;
  const role = (yandex.role as string)?.trim() || undefined;
  const speed = typeof yandex.speed === "number" ? yandex.speed : undefined;
  const format = (yandex.format as string)?.trim() || DEFAULT_FORMAT;
  const timeoutMs =
    typeof (req.config as Record<string, unknown>).timeoutMs === "number"
      ? ((req.config as Record<string, unknown>).timeoutMs as number)
      : DEFAULT_TIMEOUT_MS;

  let authType: "apiKey" | "iamToken" =
    (yandex.authType as "apiKey" | "iamToken") || resolveAuthType();
  // If the key looks like an IAM token (starts with t1.), auto-detect
  if (apiKey?.startsWith("t1.") && !yandex.authType) {
    authType = "iamToken";
  }

  return { apiKey, folderId, voice, role, speed, format, authType, timeoutMs };
}

export function buildYandexSpeechProvider(): SpeechProviderPlugin {
  return {
    id: "yandex",
    label: "Yandex SpeechKit",
    aliases: ["yandex-speechkit", "speechkit"],
    voices: YANDEX_VOICE_IDS,

    isConfigured: ({ cfg, config }): boolean => {
      // Check plugin config path: plugins.entries.yandex.config.apiKey
      const plugins = (cfg as Record<string, unknown>)?.plugins as Record<string, unknown> | undefined;
      const entries = plugins?.entries as Record<string, Record<string, unknown>> | undefined;
      const pluginApiKey = entries?.["openclaw-yandex-speechkit"]?.config as Record<string, unknown> | undefined;

      // Check tts.yandex.apiKey (if schema is extended)
      const ttsYandex = (config as Record<string, Record<string, unknown>>).yandex ?? {};

      return Boolean(
        (pluginApiKey?.apiKey as string) ||
        (ttsYandex.apiKey as string) ||
        process.env.YANDEX_API_KEY ||
        process.env.YANDEX_IAM_TOKEN,
      );
    },

    listVoices: async (): Promise<SpeechVoiceOption[]> => {
      return YANDEX_VOICES.map((v) => ({
        id: v.id,
        name: v.name,
        gender: v.gender,
        locale: v.locale,
      }));
    },

    synthesize: async (req: SpeechSynthesisRequest): Promise<SpeechSynthesisResult> => {
      const resolved = resolveConfig(req);
      if (!resolved.apiKey) {
        throw new Error("Yandex API key missing (set YANDEX_API_KEY env var or apiKey in plugins.entries.openclaw-yandex-speechkit.config)");
      }

      // OGG/Opus is ideal for Telegram voice bubbles; MP3 for everything else.
      const format = req.target === "voice-note" ? "oggopus" : resolved.format;

      const audioBuffer = await yandexTTS({
        text: req.text,
        apiKey: resolved.apiKey,
        folderId: resolved.folderId,
        voice: resolved.voice,
        role: resolved.role,
        speed: resolved.speed,
        format,
        authType: resolved.authType,
        timeoutMs: resolved.timeoutMs,
      });

      const isOpus = format === "oggopus";
      return {
        audioBuffer,
        outputFormat: format,
        fileExtension: isOpus ? ".opus" : format === "wav" ? ".wav" : ".mp3",
        voiceCompatible: isOpus,
      };
    },
  };
}
