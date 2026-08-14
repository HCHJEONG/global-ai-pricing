import { z } from "zod";

import { getFixturePricingQuote } from "@/application/pricing";
import { createGeminiVertexProvider } from "@/infrastructure/ai";
import { resolveLocale } from "@/lib/i18n";

export const runtime = "nodejs";

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

  const quote = getFixturePricingQuote({
    calculatedAt: "2026-08-14T12:00:00.000+09:00",
    destinationCountry: "KR",
  });

  if (quote.status !== "success") {
    return Response.json(
      { error: "Pricing quote is unavailable for AI explanation." },
      { status: 409 },
    );
  }

  try {
    const provider = createGeminiVertexProvider();
    const response = await provider.generate({
      messages: [
        {
          role: "system",
          content: [
            "You are an AI pricing analyst embedded in Global AI Pricing.",
            "Answer only from the provided deterministic pricing quote and policy context.",
            "Do not invent product prices, exchange rates, taxes, tariffs, or shipping costs.",
            "Do not present tariff or VAT estimates as official customs, tax, or legal advice.",
            "If the user asks for an action outside explanation, say that this dashboard currently supports explanation only.",
            `Respond in ${responseLanguage(parsed.data.locale)}.`,
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `User question: ${parsed.data.question}`,
            "",
            "Pricing quote JSON:",
            serializeForPrompt({
              product: quote.product,
              destinationCountry: quote.destinationCountry,
              source: quote.source,
              result: quote.result,
            }),
          ].join("\n"),
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
