import { z } from "zod";

import {
  apparelTariffEstimateFixture,
  calculateLandedPrice,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  normalizeSourceProductFixture,
  uniqloUsProduct456009Fixture,
  usdKrwExchangeRateFixture,
  usToKoreaShippingRuleFixture,
} from "../../domain/pricing";
import type {
  CountryCode,
  Money,
  NormalizedSourceProduct,
  PricingResult,
  PricingWarning,
  SourceProductFixture,
} from "../../domain/pricing";

const countryCodeSchema = z.enum(["US", "KR", "JP", "CN"]);

export const pricingQuoteRequestSchema = z.object({
  fixtureId: z.literal(uniqloUsProduct456009Fixture.fixtureId).default(
    uniqloUsProduct456009Fixture.fixtureId,
  ),
  destinationCountry: countryCodeSchema.default("KR"),
  calculatedAt: z.string().datetime({ offset: true }).optional(),
});

type PricingQuoteRequest = z.input<typeof pricingQuoteRequestSchema>;

export type PricingQuoteBlockingIssue = {
  code: string;
  message: string;
};

export type PricingQuoteProductSummary = {
  productId: string;
  name: string;
  brand?: string;
  price: Money;
  rawPrice?: {
    amount: string;
    currency: Money["currency"];
    taxPolicy?: "exclusive" | "inclusive" | "unknown";
  };
  sourceName: string;
  sourceUrl: string;
  sourceMarket: CountryCode;
  observedAt: string;
  adapterVersion: string;
  availability?: string;
  description?: string;
};

export type PricingQuoteSuccess = {
  status: "success";
  product: PricingQuoteProductSummary;
  destinationCountry: CountryCode;
  source: {
    fixtureId: string;
    fixtureVersion: string;
    sourceObservedAt: string;
  };
  result: PricingResult;
};

export type PricingQuoteBlocked = {
  status: "blocked";
  product?: Partial<PricingQuoteProductSummary>;
  destinationCountry?: CountryCode;
  blockingIssues: PricingQuoteBlockingIssue[];
  warnings: PricingWarning[];
};

export type PricingQuote = PricingQuoteSuccess | PricingQuoteBlocked;

const moneySchema = z.object({
  amountMinor: z.bigint(),
  currency: z.enum(["USD", "KRW", "JPY", "CNY"]),
});

const normalizedProductSchema = z.object({
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1),
  sourceMarket: countryCodeSchema,
  productName: z.string().min(1),
  productId: z.string().min(1),
  brand: z.string().min(1).optional(),
  price: moneySchema,
  shippingCost: moneySchema.optional(),
  originCountry: z.string().min(1).optional(),
  material: z.string().min(1).optional(),
  availability: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  observedAt: z.string().min(1),
  adapterVersion: z.string().min(1),
});

type ServiceProduct = z.infer<typeof normalizedProductSchema>;

function warning(
  code: string,
  message: string,
  severity: PricingWarning["severity"] = "warning",
): PricingWarning {
  return { code, severity, message };
}

function blockingIssue(code: string, message: string): PricingQuoteBlockingIssue {
  return { code, message };
}

function summarizeProduct(
  product: Partial<NormalizedSourceProduct>,
): Partial<PricingQuoteProductSummary> {
  return {
    productId: product.productId,
    name: product.productName,
    brand: product.brand,
    price: product.price,
    rawPrice: product.rawData?.price,
    sourceName: product.sourceName,
    sourceUrl: product.sourceUrl,
    sourceMarket: product.sourceMarket,
    observedAt: product.observedAt,
    adapterVersion: product.adapterVersion,
    availability: product.availability,
    description: product.description,
  };
}

function resolveShippingCost(
  product: ServiceProduct,
  destinationCountry: CountryCode,
): { shippingCost?: Money; warnings: PricingWarning[] } {
  if (product.shippingCost) {
    return { shippingCost: product.shippingCost, warnings: [] };
  }

  if (
    product.sourceMarket === usToKoreaShippingRuleFixture.sourceCountry &&
    destinationCountry === usToKoreaShippingRuleFixture.destinationCountry
  ) {
    return {
      shippingCost: usToKoreaShippingRuleFixture.flatCost,
      warnings: [
        warning(
          "FIXTURE_SHIPPING_RULE_USED",
          "Product shipping was missing, so the seeded US-to-Korea standard shipping rule was used.",
        ),
      ],
    };
  }

  return {
    warnings: [],
  };
}

export function calculateFixturePricingQuoteFromProduct(input: {
  product: Partial<NormalizedSourceProduct>;
  destinationCountry: CountryCode;
  calculatedAt?: string;
}): PricingQuote {
  const warnings: PricingWarning[] = [];
  const parsedProduct = normalizedProductSchema.safeParse(input.product);

  if (!parsedProduct.success) {
    const missingProductPrice = parsedProduct.error.issues.some(
      (issue) => issue.path[0] === "price",
    );
    const requiredMetadataIssues = parsedProduct.error.issues.filter((issue) =>
      ["productId", "productName", "sourceName", "sourceUrl", "observedAt"].includes(
        String(issue.path[0]),
      ),
    );

    return {
      status: "blocked",
      product: summarizeProduct(input.product),
      destinationCountry: input.destinationCountry,
      blockingIssues: [
        ...requiredMetadataIssues.map((issue) =>
          blockingIssue(
            "INVALID_PRODUCT_METADATA",
            `Product ${issue.path.join(".")} is required for pricing.`,
          ),
        ),
        ...(missingProductPrice
          ? [
              blockingIssue(
                "MISSING_PRODUCT_PRICE",
                "Product price and supported currency are required before pricing can be calculated.",
              ),
            ]
          : []),
        ...parsedProduct.error.issues
          .filter(
            (issue) =>
              !["price", "productId", "productName", "sourceName", "sourceUrl", "observedAt"].includes(
                String(issue.path[0]),
              ),
          )
          .map((issue) =>
            blockingIssue(
              "INVALID_PRODUCT_INPUT",
              `Product ${issue.path.join(".")} is invalid: ${issue.message}`,
            ),
          ),
      ],
      warnings,
    };
  }

  const product = parsedProduct.data;

  if (product.sourceMarket !== "US") {
    return {
      status: "blocked",
      product: summarizeProduct(product),
      destinationCountry: input.destinationCountry,
      blockingIssues: [
        blockingIssue(
          "UNSUPPORTED_SOURCE_MARKET",
          `No seeded pricing scenario exists for source market ${product.sourceMarket}.`,
        ),
      ],
      warnings,
    };
  }

  if (input.destinationCountry !== "KR") {
    return {
      status: "blocked",
      product: summarizeProduct(product),
      destinationCountry: input.destinationCountry,
      blockingIssues: [
        blockingIssue(
          "UNSUPPORTED_DESTINATION",
          `No seeded pricing scenario exists for destination ${input.destinationCountry}.`,
        ),
      ],
      warnings,
    };
  }

  if (product.price.currency !== usdKrwExchangeRateFixture.fromCurrency) {
    return {
      status: "blocked",
      product: summarizeProduct(product),
      destinationCountry: input.destinationCountry,
      blockingIssues: [
        blockingIssue(
          "UNSUPPORTED_PRODUCT_CURRENCY",
          `Product currency ${product.price.currency} is not supported by the seeded exchange-rate scenario.`,
        ),
      ],
      warnings,
    };
  }

  const shippingResolution = resolveShippingCost(product, input.destinationCountry);
  warnings.push(...shippingResolution.warnings);

  if (!shippingResolution.shippingCost) {
    return {
      status: "blocked",
      product: summarizeProduct(product),
      destinationCountry: input.destinationCountry,
      blockingIssues: [
        blockingIssue(
          "MISSING_SHIPPING_COST",
          "Product shipping was missing and no seeded shipping fallback supports this route.",
        ),
      ],
      warnings,
    };
  }

  if (!product.originCountry) {
    warnings.push(
      warning(
        "MISSING_ORIGIN_COUNTRY",
        "Origin country is missing, so tariff and customs behavior remain reduced-confidence estimates.",
      ),
    );
  }

  if (!product.material) {
    warnings.push(
      warning(
        "MISSING_MATERIAL",
        "Material is missing, so tariff classification confidence is reduced.",
      ),
    );
  }

  if (!product.availability) {
    warnings.push(
      warning(
        "MISSING_AVAILABILITY",
        "Availability was not observed in the product fixture.",
        "info",
      ),
    );
  }

  if (!product.description) {
    warnings.push(
      warning(
        "MISSING_DESCRIPTION",
        "Description was not observed in the product fixture.",
        "info",
      ),
    );
  }

  const result = calculateLandedPrice(
    {
      productCost: product.price,
      sourceCountry: product.sourceMarket,
      destinationCountry: input.destinationCountry,
      shippingCost: shippingResolution.shippingCost,
      tariffRate: apparelTariffEstimateFixture.rate,
      vatRate: koreaVatRuleFixture.rate,
      exchangeRate: usdKrwExchangeRateFixture,
      paymentFeeRate: koreaPricingPolicyFixture.paymentFeeRate,
      targetMarginRate: koreaPricingPolicyFixture.targetMarginRate,
      rounding: koreaPricingPolicyFixture.rounding,
      pricingPolicyVersion: koreaPricingPolicyFixture.version,
    },
    { calculatedAt: input.calculatedAt },
  );

  return {
    status: "success",
    product: summarizeProduct(product) as PricingQuoteProductSummary,
    destinationCountry: input.destinationCountry,
    source: {
      fixtureId: uniqloUsProduct456009Fixture.fixtureId,
      fixtureVersion: uniqloUsProduct456009Fixture.adapterVersion,
      sourceObservedAt: uniqloUsProduct456009Fixture.observedAt,
    },
    result: {
      ...result,
      warnings: [...warnings, ...result.warnings],
    },
  };
}

export function getFixturePricingQuote(request: PricingQuoteRequest = {}): PricingQuote {
  const parsedRequest = pricingQuoteRequestSchema.safeParse(request);

  if (!parsedRequest.success) {
    return {
      status: "blocked",
      blockingIssues: parsedRequest.error.issues.map((issue) =>
        blockingIssue(
          "INVALID_PRICING_REQUEST",
          `${issue.path.join(".")} is invalid: ${issue.message}`,
        ),
      ),
      warnings: [],
    };
  }

  const fixtureById: Record<string, SourceProductFixture> = {
    [uniqloUsProduct456009Fixture.fixtureId]: uniqloUsProduct456009Fixture,
  };
  const fixture = fixtureById[parsedRequest.data.fixtureId];

  if (!fixture) {
    return {
      status: "blocked",
      destinationCountry: parsedRequest.data.destinationCountry,
      blockingIssues: [
        blockingIssue(
          "UNKNOWN_PRODUCT_FIXTURE",
          `No product fixture exists for ${parsedRequest.data.fixtureId}.`,
        ),
      ],
      warnings: [],
    };
  }

  return calculateFixturePricingQuoteFromProduct({
    product: normalizeSourceProductFixture(fixture),
    destinationCountry: parsedRequest.data.destinationCountry,
    calculatedAt: parsedRequest.data.calculatedAt,
  });
}
