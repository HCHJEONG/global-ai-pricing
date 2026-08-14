import {
  apparelTariffEstimateFixture,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  pricingFixtureMetadata,
  usdKrwExchangeRateFixture,
  usToKoreaShippingRuleFixture,
} from "../../domain/pricing";
import type {
  Money,
  NormalizedSourceProduct,
  PricingPolicyFixture,
  Rate,
} from "../../domain/pricing";
import type { LlmToolDefinition } from "./provider";

export type AiPricingInputContextRequest = {
  id: string;
  locale: "ko" | "en" | "ar" | "ja" | "zh";
  text: string;
  requestedAt: string;
  actorId?: string;
};

export type AiInputContext = {
  schemaVersion: "ai-input-context-2026-08-14.unit-15";
  userRequest: AiPricingInputContextRequest;
  product: {
    sourceUrl: string;
    sourceName: string;
    sourceMarket: string;
    observedAt: string;
    adapterVersion: string;
    productId?: string;
    name: string;
    brand?: string;
    price: SerializableMoney;
    shippingCost?: SerializableMoney;
    freeShippingThreshold?: SerializableMoney;
    originCountry?: string;
    material?: string;
    availability?: string;
    description?: string;
  };
  pricingRules: {
    fixtureSet: {
      id: string;
      version: string;
      sourceObservedAt: string;
      notes: readonly string[];
    };
    exchangeRate: typeof usdKrwExchangeRateFixture;
    tariff: {
      id: string;
      sourceCountry: string;
      destinationCountry: string;
      productCategory: string;
      rate: SerializableRate;
      classificationBasis: string;
      determination: string;
      sourceObservedAt: string;
      version: string;
      disclaimer: string;
    };
    vat: {
      id: string;
      country: string;
      kind: string;
      rate: SerializableRate;
      taxableBase: string;
      sourceObservedAt: string;
      version: string;
    };
    shipping: {
      id: string;
      sourceCountry: string;
      destinationCountry: string;
      method: string;
      flatCost: SerializableMoney;
      sourceObservedAt: string;
      version: string;
    };
    pricingPolicy: {
      id: string;
      version: string;
      targetMarginRate: SerializableRate;
      paymentFeeRate: SerializableRate;
      rounding: {
        currency: PricingPolicyFixture["rounding"]["currency"];
        incrementMinor: string;
        mode: PricingPolicyFixture["rounding"]["mode"];
      };
      sourceObservedAt: string;
    };
  };
  policyConstraints: {
    approval: {
      firstExecutablePriceRequiresApproval: true;
      sensitiveMutationsRequireApproval: true;
      defaultPriceChangeThresholdBasisPoints: number;
    };
    dataQuality: {
      missingPriceBlocksCalculation: true;
      missingShippingBlocksUnlessSeededRouteExists: true;
      tariffAndVatAreEstimates: true;
    };
  };
  allowedTools: LlmToolDefinition[];
  forbiddenBehavior: string[];
};

type SerializableMoney = {
  amountMinor: string;
  currency: Money["currency"];
};

type SerializableRate = {
  basisPoints: number;
};

export type BuildAiInputContextInput = {
  userRequest: AiPricingInputContextRequest;
  product: NormalizedSourceProduct;
  allowedTools: LlmToolDefinition[];
};

function serializeMoney(value: Money): SerializableMoney {
  return {
    amountMinor: value.amountMinor.toString(),
    currency: value.currency,
  };
}

function serializeRate(value: Rate): SerializableRate {
  return {
    basisPoints: value.basisPoints,
  };
}

function sortTools(tools: LlmToolDefinition[]): LlmToolDefinition[] {
  return [...tools].sort((left, right) => left.name.localeCompare(right.name));
}

export function buildAiInputContext(
  input: BuildAiInputContextInput,
): AiInputContext {
  const { product, userRequest } = input;

  return {
    schemaVersion: "ai-input-context-2026-08-14.unit-15",
    userRequest,
    product: {
      sourceUrl: product.sourceUrl,
      sourceName: product.sourceName,
      sourceMarket: product.sourceMarket,
      observedAt: product.observedAt,
      adapterVersion: product.adapterVersion,
      productId: product.productId,
      name: product.productName,
      brand: product.brand,
      price: serializeMoney(product.price),
      shippingCost: product.shippingCost
        ? serializeMoney(product.shippingCost)
        : undefined,
      freeShippingThreshold: product.freeShippingThreshold
        ? serializeMoney(product.freeShippingThreshold)
        : undefined,
      originCountry: product.originCountry,
      material: product.material,
      availability: product.availability,
      description: product.description,
    },
    pricingRules: {
      fixtureSet: pricingFixtureMetadata,
      exchangeRate: usdKrwExchangeRateFixture,
      tariff: {
        id: apparelTariffEstimateFixture.id,
        sourceCountry: apparelTariffEstimateFixture.sourceCountry,
        destinationCountry: apparelTariffEstimateFixture.destinationCountry,
        productCategory: apparelTariffEstimateFixture.productCategory,
        rate: serializeRate(apparelTariffEstimateFixture.rate),
        classificationBasis: apparelTariffEstimateFixture.classificationBasis,
        determination: apparelTariffEstimateFixture.determination,
        sourceObservedAt: apparelTariffEstimateFixture.sourceObservedAt,
        version: apparelTariffEstimateFixture.version,
        disclaimer: apparelTariffEstimateFixture.disclaimer,
      },
      vat: {
        id: koreaVatRuleFixture.id,
        country: koreaVatRuleFixture.country,
        kind: koreaVatRuleFixture.kind,
        rate: serializeRate(koreaVatRuleFixture.rate),
        taxableBase: koreaVatRuleFixture.taxableBase,
        sourceObservedAt: koreaVatRuleFixture.sourceObservedAt,
        version: koreaVatRuleFixture.version,
      },
      shipping: {
        id: usToKoreaShippingRuleFixture.id,
        sourceCountry: usToKoreaShippingRuleFixture.sourceCountry,
        destinationCountry: usToKoreaShippingRuleFixture.destinationCountry,
        method: usToKoreaShippingRuleFixture.method,
        flatCost: serializeMoney(usToKoreaShippingRuleFixture.flatCost),
        sourceObservedAt: usToKoreaShippingRuleFixture.sourceObservedAt,
        version: usToKoreaShippingRuleFixture.version,
      },
      pricingPolicy: {
        id: koreaPricingPolicyFixture.id,
        version: koreaPricingPolicyFixture.version,
        targetMarginRate: serializeRate(koreaPricingPolicyFixture.targetMarginRate),
        paymentFeeRate: serializeRate(koreaPricingPolicyFixture.paymentFeeRate),
        rounding: {
          currency: koreaPricingPolicyFixture.rounding.currency,
          incrementMinor:
            koreaPricingPolicyFixture.rounding.incrementMinor.toString(),
          mode: koreaPricingPolicyFixture.rounding.mode,
        },
        sourceObservedAt: koreaPricingPolicyFixture.sourceObservedAt,
      },
    },
    policyConstraints: {
      approval: {
        firstExecutablePriceRequiresApproval: true,
        sensitiveMutationsRequireApproval: true,
        defaultPriceChangeThresholdBasisPoints: 1000,
      },
      dataQuality: {
        missingPriceBlocksCalculation: true,
        missingShippingBlocksUnlessSeededRouteExists: true,
        tariffAndVatAreEstimates: true,
      },
    },
    allowedTools: sortTools(input.allowedTools),
    forbiddenBehavior: [
      "Do not invent product prices, exchange rates, tariff rates, VAT rates, shipping costs, or margin rules.",
      "Do not present estimated tariff or VAT values as official customs, tax, or legal determinations.",
      "Do not bypass approval policy or claim that a sensitive mutation has been executed without an approved tool result.",
      "Do not call tools that are not listed in allowedTools.",
      "Do not expose secrets, credentials, raw prompts, or private environment values.",
    ],
  };
}
