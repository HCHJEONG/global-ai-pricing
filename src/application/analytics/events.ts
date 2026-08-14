export type ProductEventName =
  | "product.price_viewed"
  | "product.breakdown_opened"
  | "approval.approved"
  | "approval.rejected"
  | "product.draft_created";

export type ProductEventRecord = {
  id: string;
  name: ProductEventName;
  productId?: string;
  calculationId?: string;
  approvalId?: string;
  actorId?: string;
  experimentVariant?: string;
  occurredAt: string;
  metadata?: unknown;
};

export type RecordProductEvent = {
  name: ProductEventName;
  productId?: string;
  calculationId?: string;
  approvalId?: string;
  actorId?: string;
  experimentVariant?: string;
  occurredAt?: string;
  metadata?: unknown;
};

export type ProductEventRepository = {
  record(input: RecordProductEvent): Promise<ProductEventRecord>;
  findRecent(input?: { limit?: number }): Promise<ProductEventRecord[]>;
  findByProduct(input: { productId: string }): Promise<ProductEventRecord[]>;
};
