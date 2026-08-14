import type {
  ProductEventRecord,
  ProductEventRepository,
  RecordProductEvent,
} from "./events";

const sensitiveKeyPattern =
  /(?:secret|token|password|credential|api[_-]?key|authorization|raw[_-]?prompt|prompt)/i;

export function sanitizeEventMetadata(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeEventMetadata(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? "[redacted]"
          : sanitizeEventMetadata(nestedValue),
      ]),
    );
  }

  return value;
}

export class ProductEventService {
  constructor(private readonly repository: ProductEventRepository) {}

  recordPriceViewed(input: Omit<RecordProductEvent, "name">): Promise<ProductEventRecord> {
    return this.record({ ...input, name: "product.price_viewed" });
  }

  recordBreakdownOpened(
    input: Omit<RecordProductEvent, "name">,
  ): Promise<ProductEventRecord> {
    return this.record({ ...input, name: "product.breakdown_opened" });
  }

  recordApprovalApproved(
    input: Omit<RecordProductEvent, "name">,
  ): Promise<ProductEventRecord> {
    return this.record({ ...input, name: "approval.approved" });
  }

  recordApprovalRejected(
    input: Omit<RecordProductEvent, "name">,
  ): Promise<ProductEventRecord> {
    return this.record({ ...input, name: "approval.rejected" });
  }

  recordProductDraftCreated(
    input: Omit<RecordProductEvent, "name">,
  ): Promise<ProductEventRecord> {
    return this.record({ ...input, name: "product.draft_created" });
  }

  private record(input: RecordProductEvent): Promise<ProductEventRecord> {
    return this.repository.record({
      ...input,
      metadata: sanitizeEventMetadata(input.metadata),
    });
  }
}
