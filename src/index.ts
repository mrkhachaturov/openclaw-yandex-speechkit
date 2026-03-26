import type { OpenClawPluginDefinition } from "./types.js";
import { buildYandexSpeechProvider } from "./speech-provider.js";

export { buildYandexSpeechProvider, YANDEX_VOICES, YANDEX_VOICE_IDS, YANDEX_ROLES, YANDEX_FORMATS } from "./speech-provider.js";
export { yandexTTS, type YandexTTSParams } from "./yandex-client.js";

const plugin: OpenClawPluginDefinition = {
  id: "openclaw-yandex-speechkit",
  name: "Yandex SpeechKit",
  description: "Yandex SpeechKit speech synthesis provider for OpenClaw",
  register(api) {
    api.registerSpeechProvider(buildYandexSpeechProvider());
  },
};

export default plugin;
