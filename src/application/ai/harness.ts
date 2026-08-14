import { z } from "zod";

import type { LlmProviderResponse } from "./provider";
import type { LlmToolExecutor } from "./tools";

const toolCallSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  input: z.unknown().default({}),
});

const toolOutputSchema = z.union([
  z.object({
    toolCalls: z.array(toolCallSchema),
  }),
  z.object({
    tool_calls: z.array(toolCallSchema),
  }),
  z.object({
    calls: z.array(toolCallSchema),
  }),
  toolCallSchema.transform((toolCall) => ({ toolCalls: [toolCall] })),
]);

export type AiToolCall = z.infer<typeof toolCallSchema>;

export type AiToolHarnessResult =
  | {
      status: "executed";
      call: AiToolCall;
      result: unknown;
    }
  | {
      status: "approval_required";
      call: AiToolCall;
      approvalRequest: {
        toolName: string;
        input: unknown;
        reason: string;
      };
    }
  | {
      status: "rejected";
      call?: AiToolCall;
      reason: {
        code:
          | "INVALID_MODEL_OUTPUT"
          | "UNKNOWN_TOOL"
          | "INVALID_TOOL_INPUT"
          | "TOOL_EXECUTION_FAILED";
        message: string;
      };
    };

export type RunAiToolHarnessInput = {
  response: Pick<LlmProviderResponse, "text" | "raw">;
  tools: LlmToolExecutor[];
};

type ParsedToolOutput = {
  toolCalls: AiToolCall[];
};

function normalizeParsedToolOutput(value: z.output<typeof toolOutputSchema>) {
  if ("toolCalls" in value) {
    return value;
  }

  if ("tool_calls" in value) {
    return { toolCalls: value.tool_calls };
  }

  return { toolCalls: value.calls };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];

    if (!fencedJson) {
      throw new Error("Model output must be valid JSON containing tool calls.");
    }

    return JSON.parse(fencedJson);
  }
}

export function parseAiToolCalls(
  response: Pick<LlmProviderResponse, "text" | "raw">,
): ParsedToolOutput {
  const candidate = response.raw ?? parseJson(response.text);
  const parsed = toolOutputSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new Error(
      `Model output did not match the tool-call schema: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "root"} ${issue.message}`)
        .join("; ")}`,
    );
  }

  return normalizeParsedToolOutput(parsed.data);
}

export async function runAiToolHarness(
  input: RunAiToolHarnessInput,
): Promise<AiToolHarnessResult[]> {
  let parsed: ParsedToolOutput;

  try {
    parsed = parseAiToolCalls(input.response);
  } catch (error) {
    return [
      {
        status: "rejected",
        reason: {
          code: "INVALID_MODEL_OUTPUT",
          message: error instanceof Error ? error.message : "Invalid model output.",
        },
      },
    ];
  }

  const toolsByName = new Map(
    input.tools.map((tool) => [tool.definition.name, tool] as const),
  );

  return Promise.all(
    parsed.toolCalls.map(async (call): Promise<AiToolHarnessResult> => {
      const tool = toolsByName.get(call.name);

      if (!tool) {
        return {
          status: "rejected",
          call,
          reason: {
            code: "UNKNOWN_TOOL",
            message: `Tool ${call.name} is not in the allowlist.`,
          },
        };
      }

      const parsedInput = tool.inputSchema.safeParse(call.input);

      if (!parsedInput.success) {
        return {
          status: "rejected",
          call,
          reason: {
            code: "INVALID_TOOL_INPUT",
            message: parsedInput.error.issues
              .map((issue) => `${issue.path.join(".") || "input"} ${issue.message}`)
              .join("; "),
          },
        };
      }

      if (tool.requiresApproval) {
        return {
          status: "approval_required",
          call: {
            ...call,
            input: parsedInput.data,
          },
          approvalRequest: {
            toolName: tool.definition.name,
            input: parsedInput.data,
            reason: "Sensitive mutation requires approval before execution.",
          },
        };
      }

      try {
        return {
          status: "executed",
          call: {
            ...call,
            input: parsedInput.data,
          },
          result: await tool.execute(parsedInput.data),
        };
      } catch (error) {
        return {
          status: "rejected",
          call: {
            ...call,
            input: parsedInput.data,
          },
          reason: {
            code: "TOOL_EXECUTION_FAILED",
            message:
              error instanceof Error ? error.message : "Tool execution failed.",
          },
        };
      }
    }),
  );
}
