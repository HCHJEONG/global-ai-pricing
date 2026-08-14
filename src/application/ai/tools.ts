import type { LlmToolDefinition } from "./provider";
import type { z } from "zod";

export type LlmToolExecutor = {
  definition: LlmToolDefinition;
  inputSchema: z.ZodType;
  requiresApproval?: boolean;
  execute(input: unknown): Promise<unknown>;
};
