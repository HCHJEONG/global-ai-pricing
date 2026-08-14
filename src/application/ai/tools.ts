import type { LlmToolDefinition } from "./provider";

export type LlmToolExecutor = {
  definition: LlmToolDefinition;
  execute(input: unknown): Promise<unknown>;
};
