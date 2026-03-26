import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildYandexSpeechProvider, YANDEX_VOICES, YANDEX_VOICE_IDS } from "./speech-provider.js";

describe("buildYandexSpeechProvider", () => {
  const provider = buildYandexSpeechProvider();

  it("has correct id and label", () => {
    expect(provider.id).toBe("yandex");
    expect(provider.label).toBe("Yandex SpeechKit");
  });

  it("includes aliases", () => {
    expect(provider.aliases).toContain("yandex-speechkit");
    expect(provider.aliases).toContain("speechkit");
  });

  it("exposes voice ids", () => {
    expect(provider.voices).toEqual(YANDEX_VOICE_IDS);
    expect(provider.voices).toContain("alexander");
    expect(provider.voices).toContain("marina");
    expect(provider.voices).toContain("john");
  });

  describe("isConfigured", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.YANDEX_API_KEY;
      delete process.env.YANDEX_IAM_TOKEN;
    });

    it("returns true when plugin config has apiKey", () => {
      const result = provider.isConfigured({
        cfg: { plugins: { entries: { "openclaw-yandex-speechkit": { config: { apiKey: "test-key" } } } } },
        config: {},
      });
      expect(result).toBe(true);
    });

    it("returns true when YANDEX_API_KEY env is set", () => {
      process.env.YANDEX_API_KEY = "env-key";
      const result = provider.isConfigured({ config: {} });
      expect(result).toBe(true);
    });

    it("returns true when YANDEX_IAM_TOKEN env is set", () => {
      process.env.YANDEX_IAM_TOKEN = "t1.iam-token";
      const result = provider.isConfigured({ config: {} });
      expect(result).toBe(true);
    });

    it("returns false when no key is available", () => {
      const result = provider.isConfigured({ config: {} });
      expect(result).toBe(false);
    });

    afterEach(() => {
      process.env = originalEnv;
    });
  });

  describe("listVoices", () => {
    it("returns all known voices with metadata", async () => {
      const voices = await provider.listVoices!({});
      expect(voices.length).toBe(YANDEX_VOICES.length);
      const alexander = voices.find((v) => v.id === "alexander");
      expect(alexander).toEqual({
        id: "alexander",
        name: "Alexander",
        gender: "male",
        locale: "ru-RU",
      });
    });

    it("includes multilingual voices", async () => {
      const voices = await provider.listVoices!({});
      const ids = voices.map((v) => v.id);
      expect(ids).toContain("john"); // English
      expect(ids).toContain("amira"); // Kazakh
      expect(ids).toContain("lea"); // German
      expect(ids).toContain("nigora"); // Uzbek
    });
  });
});

describe("synthesize", () => {
  it("throws when no API key is available", async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.YANDEX_API_KEY;
    delete process.env.YANDEX_IAM_TOKEN;

    const provider = buildYandexSpeechProvider();
    await expect(
      provider.synthesize({
        text: "test",
        cfg: {},
        config: {},
        target: "audio-file",
      }),
    ).rejects.toThrow("Yandex API key missing");

    process.env = originalEnv;
  });

  it("selects oggopus for voice-note target", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            result: { audioChunk: { data: Buffer.from("audio").toString("base64") } },
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const provider = buildYandexSpeechProvider();
    const cfg = { plugins: { entries: { "openclaw-yandex-speechkit": { config: { apiKey: "key", voice: "alexander" } } } } };
    const result = await provider.synthesize({
      text: "test",
      cfg,
      config: {},
      target: "voice-note",
    });

    expect(result.outputFormat).toBe("oggopus");
    expect(result.fileExtension).toBe(".opus");
    expect(result.voiceCompatible).toBe(true);

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.outputAudioSpec.containerAudio.containerAudioType).toBe("OGG_OPUS");

    vi.unstubAllGlobals();
  });

  it("uses configured format for audio-file target", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            result: { audioChunk: { data: Buffer.from("audio").toString("base64") } },
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const provider = buildYandexSpeechProvider();
    const cfg = { plugins: { entries: { "openclaw-yandex-speechkit": { config: { apiKey: "key", format: "mp3" } } } } };
    const result = await provider.synthesize({
      text: "test",
      cfg,
      config: {},
      target: "audio-file",
    });

    expect(result.outputFormat).toBe("mp3");
    expect(result.fileExtension).toBe(".mp3");
    expect(result.voiceCompatible).toBe(false);

    vi.unstubAllGlobals();
  });
});
