/**
 * Yandex SpeechKit REST API v3 client.
 *
 * Endpoint: POST /tts/v3/utteranceSynthesis
 * Docs: https://yandex.cloud/docs/speechkit/tts/api/tts-v3-rest
 *
 * Supports two auth modes:
 *   - API Key:   Authorization: Api-Key <key>
 *   - IAM Token: Authorization: Bearer <token>
 *
 * Response is newline-delimited JSON. Each line contains a result object
 * with base64-encoded audio in result.audioChunk.data.
 */

const DEFAULT_HOST = "https://tts.api.cloud.yandex.net:443";

/** Map config format names to v3 containerAudioType enum values. */
const FORMAT_MAP: Record<string, string> = {
  oggopus: "OGG_OPUS",
  mp3: "MP3",
  wav: "WAV",
};

export type YandexTTSParams = {
  text: string;
  apiKey: string;
  folderId?: string;
  voice: string;
  lang?: string;
  role?: string;
  speed?: number;
  format?: string;
  sampleRateHertz?: number;
  /** Controls the Authorization header format. Default: "apiKey". */
  authType?: "apiKey" | "iamToken";
  timeoutMs: number;
};

export async function yandexTTS(params: YandexTTSParams): Promise<Buffer> {
  const {
    text,
    apiKey,
    folderId,
    voice,
    role,
    speed,
    format = "oggopus",
    authType = "apiKey",
    timeoutMs,
  } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const hints: Array<Record<string, string | number>> = [{ voice }];
    if (role) {
      hints.push({ role });
    }
    if (speed != null) {
      hints.push({ speed: String(speed) });
    }

    const containerAudioType = FORMAT_MAP[format] ?? "OGG_OPUS";

    const body = JSON.stringify({
      text,
      outputAudioSpec: {
        containerAudio: { containerAudioType },
      },
      hints,
      loudnessNormalizationType: "LUFS",
      unsafeMode: true,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authType === "iamToken") {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      headers.Authorization = `Api-Key ${apiKey}`;
    }
    if (folderId) {
      headers["x-folder-id"] = folderId;
    }

    const response = await fetch(`${DEFAULT_HOST}/tts/v3/utteranceSynthesis`, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Yandex SpeechKit API error (${response.status}): ${errorBody}`);
    }

    // v3 REST returns newline-delimited JSON, each line has base64-encoded audio.
    const responseText = await response.text();
    const chunks: Buffer[] = [];
    for (const line of responseText.trim().split("\n")) {
      if (!line) {
        continue;
      }
      const obj = JSON.parse(line);
      const b64 = obj.result?.audioChunk?.data;
      if (b64) {
        chunks.push(Buffer.from(b64, "base64"));
      }
    }

    if (chunks.length === 0) {
      throw new Error("Yandex SpeechKit returned no audio data");
    }

    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeout);
  }
}
