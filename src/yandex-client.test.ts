import { describe, it, expect, vi } from "vitest";
import { yandexTTS } from "./yandex-client.js";

describe("yandexTTS", () => {
  it("sends correct request to v3 endpoint", async () => {
    const audioData = Buffer.from("fake-audio");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            result: { audioChunk: { data: audioData.toString("base64") } },
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await yandexTTS({
      text: "Hello",
      apiKey: "test-api-key",
      voice: "alexander",
      role: "good",
      speed: 1.2,
      format: "oggopus",
      timeoutMs: 5000,
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://tts.api.cloud.yandex.net:443/tts/v3/utteranceSynthesis");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.headers.Authorization).toBe("Api-Key test-api-key");

    const body = JSON.parse(opts.body);
    expect(body.text).toBe("Hello");
    expect(body.outputAudioSpec.containerAudio.containerAudioType).toBe("OGG_OPUS");
    expect(body.hints).toEqual([{ voice: "alexander" }, { role: "good" }, { speed: "1.2" }]);
    expect(body.unsafeMode).toBe(true);

    expect(result).toEqual(audioData);

    vi.unstubAllGlobals();
  });

  it("uses IAM token auth when specified", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            result: { audioChunk: { data: Buffer.from("a").toString("base64") } },
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await yandexTTS({
      text: "test",
      apiKey: "t1.my-iam-token",
      voice: "marina",
      authType: "iamToken",
      timeoutMs: 5000,
    });

    const headers = fetchSpy.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer t1.my-iam-token");

    vi.unstubAllGlobals();
  });

  it("includes x-folder-id header when folderId is set", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            result: { audioChunk: { data: Buffer.from("a").toString("base64") } },
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await yandexTTS({
      text: "test",
      apiKey: "key",
      folderId: "b1g12345",
      voice: "ermil",
      timeoutMs: 5000,
    });

    const headers = fetchSpy.mock.calls[0][1].headers;
    expect(headers["x-folder-id"]).toBe("b1g12345");

    vi.unstubAllGlobals();
  });

  it("concatenates multi-chunk responses", async () => {
    const chunk1 = Buffer.from("part1");
    const chunk2 = Buffer.from("part2");
    const ndjson = [
      JSON.stringify({ result: { audioChunk: { data: chunk1.toString("base64") } } }),
      JSON.stringify({ result: { audioChunk: { data: chunk2.toString("base64") } } }),
    ].join("\n");

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ndjson),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await yandexTTS({
      text: "long text",
      apiKey: "key",
      voice: "ermil",
      timeoutMs: 5000,
    });

    expect(result).toEqual(Buffer.concat([chunk1, chunk2]));

    vi.unstubAllGlobals();
  });

  it("throws on API error", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await expect(
      yandexTTS({
        text: "test",
        apiKey: "bad-key",
        voice: "ermil",
        timeoutMs: 5000,
      }),
    ).rejects.toThrow("Yandex SpeechKit API error (401): Unauthorized");

    vi.unstubAllGlobals();
  });

  it("throws when response has no audio data", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ result: {} })),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await expect(
      yandexTTS({
        text: "test",
        apiKey: "key",
        voice: "ermil",
        timeoutMs: 5000,
      }),
    ).rejects.toThrow("Yandex SpeechKit returned no audio data");

    vi.unstubAllGlobals();
  });

  it("maps mp3 format correctly", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            result: { audioChunk: { data: Buffer.from("a").toString("base64") } },
          }),
        ),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await yandexTTS({
      text: "test",
      apiKey: "key",
      voice: "ermil",
      format: "mp3",
      timeoutMs: 5000,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.outputAudioSpec.containerAudio.containerAudioType).toBe("MP3");

    vi.unstubAllGlobals();
  });
});
