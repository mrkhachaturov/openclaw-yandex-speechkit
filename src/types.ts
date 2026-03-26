// Minimal type stubs for OpenClaw plugin SDK.
// These mirror the subset of openclaw/plugin-sdk/core used by speech providers.
// Kept as local stubs so the package has zero runtime dependencies on openclaw.

export type SpeechProviderId = string;

export type SpeechSynthesisTarget = "audio-file" | "voice-note";

export type SpeechProviderConfiguredContext = {
  cfg?: unknown;
  config: Record<string, unknown>;
};

export type SpeechSynthesisRequest = {
  text: string;
  cfg: Record<string, unknown>;
  config: Record<string, unknown>;
  target: SpeechSynthesisTarget;
  overrides?: Record<string, unknown>;
};

export type SpeechSynthesisResult = {
  audioBuffer: Buffer;
  outputFormat: string;
  fileExtension: string;
  voiceCompatible: boolean;
};

export type SpeechVoiceOption = {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  locale?: string;
  gender?: string;
};

export type SpeechListVoicesRequest = {
  cfg?: unknown;
  config?: Record<string, unknown>;
  apiKey?: string;
  baseUrl?: string;
};

export type SpeechProviderPlugin = {
  id: SpeechProviderId;
  label: string;
  aliases?: string[];
  models?: readonly string[];
  voices?: readonly string[];
  isConfigured: (ctx: SpeechProviderConfiguredContext) => boolean;
  synthesize: (req: SpeechSynthesisRequest) => Promise<SpeechSynthesisResult>;
  listVoices?: (req: SpeechListVoicesRequest) => Promise<SpeechVoiceOption[]>;
};

export type OpenClawPluginAPI = {
  registerSpeechProvider: (provider: SpeechProviderPlugin) => void;
};

export type OpenClawPluginDefinition = {
  id: string;
  name: string;
  description: string;
  register: (api: OpenClawPluginAPI) => void;
};
