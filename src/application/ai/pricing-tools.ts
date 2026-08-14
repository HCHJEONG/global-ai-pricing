import { randomUUID } from "node:crypto";

import { z } from "zod";

import { AuditLogService } from "../audit";
import {
  calculateFixturePricingQuoteFromProduct,
  getFixturePricingQuote,
  pricingQuoteRequestSchema,
} from "../pricing";
import { evaluateApprovalPolicy } from "../../domain/approvals";
import {
  moneyFromMajorUnit,
  normalizeSourceProductFixture,
  uniqloUsProduct456009Fixture,
} from "../../domain/pricing";
import type {
  CountryCode,
  Money,
  NormalizedSourceProduct,
  PricingWarning,
  SourceProductFixture,
} from "../../domain/pricing";
import type { LlmToolExecutor } from "./tools";

const countryCodeSchema = z.enum(["US", "KR", "JP", "CN"]);
const currencyCodeSchema = z.enum(["USD", "KRW", "JPY", "CNY"]);

const moneyInputSchema = z.object({
  amount: z.string().min(1),
  currency: currencyCodeSchema,
});

const normalizedProductToolInputSchema = z.object({
  fixtureId: z.literal(uniqloUsProduct456009Fixture.fixtureId).optional(),
  rawProduct: z
    .object({
      sourceUrl: z.string().url(),
      sourceName: z.string().min(1),
      sourceMarket: countryCodeSchema,
      productName: z.string().min(1),
      productId: z.string().min(1).optional(),
      brand: z.string().min(1).optional(),
      price: moneyInputSchema,
      shippingCost: moneyInputSchema.optional(),
      originCountry: z.string().min(1).optional(),
      material: z.string().min(1).optional(),
      availability: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      observedAt: z.string().datetime({ offset: true }),
      adapterVersion: z.string().min(1),
      rawData: z.unknown().optional(),
    })
    .optional(),
});

const calculatePriceToolInputSchema = pricingQuoteRequestSchema.extend({
  normalizedProduct: z
    .custom<NormalizedSourceProduct>(
      (value) => typeof value === "object" && value !== null,
      "normalizedProduct must be an object.",
    )
    .optional(),
});

const pricingWarningSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["info", "warning", "blocking"]),
  message: z.string().min(1),
});

const blockingIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

const approvalToolInputSchema = z.object({
  calculationId: z.string().min(1),
  proposedPrice: moneyInputSchema,
  previousPrice: moneyInputSchema.optional(),
  warnings: z.array(pricingWarningSchema).default([]),
  blockingIssues: z.array(blockingIssueSchema).default([]),
  actorId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  priceChangeApprovalThresholdBasisPoints: z.number().int().positive().optional(),
});

export type AiPricingToolEvent = {
  toolName: string;
  status: "started" | "succeeded" | "failed";
  input?: unknown;
  result?: unknown;
  error?: string;
  occurredAt: string;
};

export type CreateAiPricingToolsInput = {
  auditLogService?: AuditLogService;
  onToolEvent?: (event: AiPricingToolEvent) => void | Promise<void>;
};

function toMoney(input: z.infer<typeof moneyInputSchema>): Money {
  return moneyFromMajorUnit(input.amount, input.currency);
}

function normalizeRawProduct(
  rawProduct: NonNullable<
    z.infer<typeof normalizedProductToolInputSchema>["rawProduct"]
  >,
): NormalizedSourceProduct {
  return {
    sourceUrl: rawProduct.sourceUrl,
    sourceName: rawProduct.sourceName,
    sourceMarket: rawProduct.sourceMarket,
    productName: rawProduct.productName,
    productId: rawProduct.productId,
    brand: rawProduct.brand,
    price: toMoney(rawProduct.price),
    shippingCost: rawProduct.shippingCost
      ? toMoney(rawProduct.shippingCost)
      : undefined,
    originCountry: rawProduct.originCountry,
    material: rawProduct.material,
    availability: rawProduct.availability,
    description: rawProduct.description,
    observedAt: rawProduct.observedAt,
    adapterVersion: rawProduct.adapterVersion,
    rawData: (rawProduct.rawData ?? rawProduct) as SourceProductFixture["rawExtractedFields"],
  };
}

function defineTool<TInput, TResult>(input: {
  definition: LlmToolExecutor["definition"];
  inputSchema: z.ZodType<TInput>;
  onToolEvent?: CreateAiPricingToolsInput["onToolEvent"];
  execute(input: TInput): Promise<TResult> | TResult;
}): LlmToolExecutor {
  return {
    definition: input.definition,
    inputSchema: input.inputSchema,
    async execute(rawInput: unknown): Promise<TResult> {
      const parsedInput = rawInput as TInput;

      await input.onToolEvent?.({
        toolName: input.definition.name,
        status: "started",
        input: parsedInput,
        occurredAt: new Date().toISOString(),
      });

      try {
        const result = await input.execute(parsedInput);
        await input.onToolEvent?.({
          toolName: input.definition.name,
          status: "succeeded",
          input: parsedInput,
          result,
          occurredAt: new Date().toISOString(),
        });
        return result;
      } catch (error) {
        await input.onToolEvent?.({
          toolName: input.definition.name,
          status: "failed",
          input: parsedInput,
          error: error instanceof Error ? error.message : "Tool execution failed.",
          occurredAt: new Date().toISOString(),
        });
        throw error;
      }
    },
  };
}

export function createAiPricingTools(
  input: CreateAiPricingToolsInput = {},
): LlmToolExecutor[] {
  return [
    defineTool({
      definition: {
        name: "normalize_product_data",
        description:
          "Normalize fixture or extracted product data into the pricing product shape.",
        inputSchema: {
          type: "object",
          properties: {
            fixtureId: { type: "string" },
            rawProduct: { type: "object" },
          },
        },
      },
      inputSchema: normalizedProductToolInputSchema,
      onToolEvent: input.onToolEvent,
      execute(toolInput) {
        if (toolInput.fixtureId) {
          return {
            status: "success" as const,
            product: normalizeSourceProductFixture(uniqloUsProduct456009Fixture),
            source: "fixture" as const,
          };
        }

        if (!toolInput.rawProduct) {
          throw new Error("Either fixtureId or rawProduct is required.");
        }

        return {
          status: "success" as const,
          product: normalizeRawProduct(toolInput.rawProduct),
          source: "rawProduct" as const,
        };
      },
    }),
    defineTool({
      definition: {
        name: "calculate_price",
        description:
          "Calculate a deterministic landed pricing quote for a normalized or fixture product.",
        inputSchema: {
          type: "object",
          properties: {
            fixtureId: { type: "string" },
            destinationCountry: { type: "string" },
            calculatedAt: { type: "string" },
            normalizedProduct: { type: "object" },
          },
        },
      },
      inputSchema: calculatePriceToolInputSchema,
      onToolEvent: input.onToolEvent,
      execute(toolInput) {
        if (toolInput.normalizedProduct) {
          return calculateFixturePricingQuoteFromProduct({
            product: toolInput.normalizedProduct,
            destinationCountry: toolInput.destinationCountry as CountryCode,
            calculatedAt: toolInput.calculatedAt,
          });
        }

        return getFixturePricingQuote(toolInput);
      },
    }),
    defineTool({
      definition: {
        name: "request_price_approval",
        description:
          "Evaluate approval policy and create an approval request when pricing needs human review.",
        inputSchema: {
          type: "object",
          properties: {
            calculationId: { type: "string" },
            proposedPrice: { type: "object" },
            previousPrice: { type: "object" },
            warnings: { type: "array" },
            blockingIssues: { type: "array" },
            actorId: { type: "string" },
            reason: { type: "string" },
          },
          required: ["calculationId", "proposedPrice"],
        },
      },
      inputSchema: approvalToolInputSchema,
      onToolEvent: input.onToolEvent,
      async execute(toolInput) {
        const proposedPrice = toMoney(toolInput.proposedPrice);
        const decision = evaluateApprovalPolicy({
          proposedPrice,
          previousPrice: toolInput.previousPrice
            ? toMoney(toolInput.previousPrice)
            : undefined,
          warnings: toolInput.warnings as PricingWarning[],
          blockingIssues: toolInput.blockingIssues,
          priceChangeApprovalThresholdBasisPoints:
            toolInput.priceChangeApprovalThresholdBasisPoints,
        });

        if (decision.outcome === "blocked") {
          return {
            status: "blocked" as const,
            calculationId: toolInput.calculationId,
            decision,
          };
        }

        const approval = {
          id: randomUUID(),
          calculationId: toolInput.calculationId,
          status: decision.initialState,
          reason:
            toolInput.reason ??
            decision.reasons.map((reason) => reason.message).join(" "),
        };

        await input.auditLogService?.recordApprovalRequested(approval, {
          actorId: toolInput.actorId,
          metadata: {
            toolName: "request_price_approval",
            decision,
            proposedPrice,
          },
        });

        return {
          status: decision.outcome,
          approval,
          decision,
        };
      },
    }),
  ];
}

export const aiPricingToolNames = [
  "normalize_product_data",
  "calculate_price",
  "request_price_approval",
] as const satisfies readonly string[];
