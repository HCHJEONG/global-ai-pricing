import { z } from "zod";

import {
  createAiPricingTools,
  runAiToolHarness,
  type AiToolHarnessResult,
} from "@/application/ai";
import { createGeminiVertexProvider } from "@/infrastructure/ai";
import { resolveLocale } from "@/lib/i18n";

export const runtime = "nodejs";

const demoFixtureId = "uniqlo-us-456009-2026-08-14";
const demoCalculatedAt = "2026-08-14T12:00:00.000+09:00";

const askPricingAiRequestSchema = z.object({
  locale: z.enum(["ko", "en", "ja", "zh", "ar"]).default("ko"),
  question: z.string().trim().min(2).max(800),
});

function serializeForPrompt(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, nestedValue) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue,
    2,
  );
}

function responseLanguage(locale: string): string {
  return (
    {
      ar: "Arabic",
      en: "English",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
    } as const
  )[resolveLocale(locale)];
}

function summarizeHarnessFailure(results: AiToolHarnessResult[]): string {
  const failed = results.find((result) => result.status !== "executed");

  if (!failed) {
    return "AI tool execution did not return a pricing result.";
  }

  if (failed.status === "approval_required") {
    return "AI requested a tool that requires approval and cannot be executed from Ask AI.";
  }

  return failed.reason.message;
}

export async function POST(request: Request) {
  const parsed = askPricingAiRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid AI question payload." },
      { status: 400 },
    );
  }

  try {
    const provider = createGeminiVertexProvider();
    const allowedTools = createAiPricingTools().filter(
      (tool) => tool.definition.name === "calculate_price",
    );
    const toolDefinitions = allowedTools.map((tool) => tool.definition);
    const toolPlanResponse = await provider.generate({
      messages: [
        {
          role: "system",
          content: [
            "You are the tool-planning step for Global AI Pricing.",
            "Return only valid JSON. Do not include markdown, prose, or commentary.",
            "Use only tools listed in the allowed tools JSON.",
            "Do not invent product prices, exchange rates, taxes, tariffs, or shipping costs.",
            "For this Ask AI demo, request one calculate_price call for the seeded product fixture and Korea destination.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `User question: ${parsed.data.question}`,
            "",
            "Allowed tools JSON:",
            serializeForPrompt(toolDefinitions),
            "",
            "Required tool call shape:",
            serializeForPrompt({
              toolCalls: [
                {
                  name: "calculate_price",
                  input: {
                    fixtureId: demoFixtureId,
                    destinationCountry: "KR",
                    calculatedAt: demoCalculatedAt,
                  },
                },
              ],
            }),
          ].join("\n"),
        },
      ],
      timeoutMs: 20_000,
    });

    const toolResults = await runAiToolHarness({
      response: { text: toolPlanResponse.text },
      tools: allowedTools,
    });
    const pricingToolResult = toolResults.find(
      (result) =>
        result.status === "executed" &&
        result.call.name === "calculate_price",
    );

    if (!pricingToolResult || pricingToolResult.status !== "executed") {
      return Response.json(
        { error: summarizeHarnessFailure(toolResults) },
        { status: 409 },
      );
    }

    const response = await provider.generate({
      messages: [
        {
          role: "system",
          content: [
            "You are an AI pricing analyst embedded in Global AI Pricing.",
            "Answer only from the verified tool result and policy context.",
            "Do not invent product prices, exchange rates, taxes, tariffs, or shipping costs.",
            "Do not present tariff or VAT estimates as official customs, tax, or legal advice.",
            "If the user asks for an action outside explanation, say that this dashboard currently supports explanation only.",
            `Respond in ${responseLanguage(parsed.data.locale)}.`,
          ].join("\n"),
        },
        {
          role: "tool",
          content: [
            "Tool result from calculate_price:",
            serializeForPrompt(pricingToolResult.result),
          ].join("\n"),
        },
        {
          role: "user",
          content: parsed.data.question,
        },
      ],
      timeoutMs: 20_000,
    });

    return Response.json({
      answer: response.text,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI pricing explanation failed.",
      },
      { status: 503 },
    );
  }
}
