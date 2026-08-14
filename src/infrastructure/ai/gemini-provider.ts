import { GoogleAuth } from "google-auth-library";

import type {
  LlmProvider,
  LlmProviderRequest,
  LlmProviderResponse,
} from "../../application/ai";
import { readVertexAiProviderConfig, type VertexAiProviderConfig } from "./config";

type AccessTokenClient = {
  getAccessToken(): Promise<string | { token?: string | null } | null>;
};

type AuthClientFactory = (config: VertexAiProviderConfig) => Promise<AccessTokenClient>;

type Fetcher = typeof fetch;

type VertexGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const vertexScope = "https://www.googleapis.com/auth/cloud-platform";

export class GeminiVertexProvider implements LlmProvider {
  readonly provider = "gemini-vertex";
  readonly model: string;

  private readonly config: VertexAiProviderConfig;
  private readonly createAuthClient: AuthClientFactory;
  private readonly fetcher: Fetcher;

  constructor(options: {
    config?: VertexAiProviderConfig;
    createAuthClient?: AuthClientFactory;
    fetcher?: Fetcher;
  } = {}) {
    const config = options.config ?? readVertexAiProviderConfig();
    if (!config) {
      throw new Error(
        "Vertex AI Gemini provider requires GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_CLOUD_PROJECT.",
      );
    }

    this.config = config;
    this.model = config.model;
    this.createAuthClient = options.createAuthClient ?? createGoogleAuthClient;
    this.fetcher = options.fetcher ?? fetch;
  }

  async generate(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const client = await this.createAuthClient(this.config);
    const accessToken = normalizeAccessToken(await client.getAccessToken());

    if (!accessToken) {
      throw new Error("Vertex AI Gemini provider could not resolve an access token.");
    }

    const response = await this.fetcher(this.endpointUrl(), {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: request.messages.map((message) => ({
          role: toVertexRole(message.role),
          parts: [{ text: message.content }],
        })),
      }),
      signal: AbortSignal.timeout(request.timeoutMs ?? 15000),
    });

    if (!response.ok) {
      throw new Error(`Vertex AI Gemini request failed with status ${response.status}.`);
    }

    const raw = (await response.json()) as VertexGenerateContentResponse;
    const text = raw.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      throw new Error("Vertex AI Gemini response did not include text content.");
    }

    return {
      text,
      provider: this.provider,
      model: this.model,
      raw,
    };
  }

  private endpointUrl() {
    const host =
      this.config.location === "global"
        ? "aiplatform.googleapis.com"
        : `${this.config.location}-aiplatform.googleapis.com`;

    return `https://${host}/v1/projects/${this.config.project}/locations/${this.config.location}/publishers/google/models/${this.config.model}:generateContent`;
  }
}

async function createGoogleAuthClient(
  config: VertexAiProviderConfig,
): Promise<AccessTokenClient> {
  const auth = new GoogleAuth({
    keyFile: config.credentialsFile,
    scopes: [vertexScope],
  });

  return auth.getClient();
}

function normalizeAccessToken(token: string | { token?: string | null } | null) {
  if (typeof token === "string") {
    return token;
  }

  return token?.token ?? null;
}

function toVertexRole(role: LlmProviderRequest["messages"][number]["role"]) {
  if (role === "assistant") {
    return "model";
  }

  return "user";
}

export function createGeminiVertexProvider() {
  return new GeminiVertexProvider();
}
