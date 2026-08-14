import type {
  NormalizedSourceProduct,
  PricingInput,
  PricingResult,
} from "../../domain/pricing";

export type CalculationSnapshotInput = {
  product: NormalizedSourceProduct;
  pricingInput: PricingInput;
};

export type CalculationSnapshotRecord = {
  id: string;
  productId?: string;
  sourceUrl: string;
  sourceName: string;
  sourceObservedAt: string;
  calculationInput: CalculationSnapshotInput;
  calculationOutput: PricingResult;
  engineVersion: string;
  policyVersion: string;
  calculatedAt: string;
  createdAt: string;
  externalProductPayload?: unknown;
};

export type CreateCalculationSnapshot = {
  productId?: string;
  sourceUrl: string;
  sourceName: string;
  sourceObservedAt: string;
  calculationInput: CalculationSnapshotInput;
  calculationOutput: PricingResult;
  externalProductPayload?: unknown;
};

export type CalculationSnapshotRepository = {
  create(input: CreateCalculationSnapshot): Promise<CalculationSnapshotRecord>;
  findById(id: string): Promise<CalculationSnapshotRecord | undefined>;
};
