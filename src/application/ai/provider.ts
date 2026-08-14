export type LlmProviderRole = "system" | "user" | "assistant" | "tool";

export type LlmProviderMessage = {
  role: LlmProviderRole;
  content: string;
};

export type LlmToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type LlmProviderRequest = {
  messages: LlmProviderMessage[];
  tools?: LlmToolDefinition[];
  timeoutMs?: number;
};

export type LlmProviderResponse = {
  text: string;
  provider: string;
  model: string;
  raw?: unknown;
};

export interface LlmProvider {
  readonly provider: string;
  readonly model: string;
  generate(request: LlmProviderRequest): Promise<LlmProviderResponse>;
}
