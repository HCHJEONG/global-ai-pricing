import type { LlmProviderMessage } from "./provider";

export type PromptTemplate = {
  system: string;
  user: string;
};

export function buildPromptMessages(template: PromptTemplate): LlmProviderMessage[] {
  return [
    { role: "system", content: template.system },
    { role: "user", content: template.user },
  ];
}
