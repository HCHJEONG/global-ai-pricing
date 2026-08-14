import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const brands = sqliteTable(
  "brands",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("brands_name_unique").on(table.name)],
);

export const countries = sqliteTable("countries", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  defaultCurrencyCode: text("default_currency_code").notNull(),
  marketRole: text("market_role").notNull(),
  ...timestamps,
});

export const currencies = sqliteTable("currencies", {
  code: text("code").primaryKey(),
  minorUnits: integer("minor_units").notNull(),
  symbol: text("symbol").notNull(),
  ...timestamps,
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceMarketCode: text("source_market_code").notNull(),
    externalProductId: text("external_product_id"),
    name: text("name").notNull(),
    brandId: text("brand_id").references(() => brands.id),
    rawPayloadJson: text("raw_payload_json"),
    sourceObservedAt: text("source_observed_at").notNull(),
    adapterVersion: text("adapter_version").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_source_url_unique").on(table.sourceUrl),
    index("products_external_product_id_idx").on(table.externalProductId),
  ],
);

export const variants = sqliteTable(
  "variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    sku: text("sku"),
    color: text("color"),
    size: text("size"),
    availability: text("availability"),
    ...timestamps,
  },
  (table) => [index("variants_product_id_idx").on(table.productId)],
);

export const exchangeRates = sqliteTable(
  "exchange_rates",
  {
    id: text("id").primaryKey(),
    fromCurrencyCode: text("from_currency_code").notNull(),
    toCurrencyCode: text("to_currency_code").notNull(),
    rate: text("rate").notNull(),
    basis: text("basis").notNull(),
    observedAt: text("observed_at").notNull(),
    source: text("source").notNull(),
    version: text("version"),
    ...timestamps,
  },
  (table) => [
    index("exchange_rates_pair_observed_idx").on(
      table.fromCurrencyCode,
      table.toCurrencyCode,
      table.observedAt,
    ),
  ],
);

export const taxRules = sqliteTable("tax_rules", {
  id: text("id").primaryKey(),
  countryCode: text("country_code").notNull(),
  kind: text("kind").notNull(),
  rateBasisPoints: integer("rate_basis_points").notNull(),
  taxableBase: text("taxable_base").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  source: text("source").notNull(),
  sourceObservedAt: text("source_observed_at").notNull(),
  version: text("version").notNull(),
  ...timestamps,
});

export const tariffRules = sqliteTable("tariff_rules", {
  id: text("id").primaryKey(),
  sourceCountryCode: text("source_country_code").notNull(),
  destinationCountryCode: text("destination_country_code").notNull(),
  productCategory: text("product_category").notNull(),
  rateBasisPoints: integer("rate_basis_points").notNull(),
  classificationBasis: text("classification_basis").notNull(),
  determination: text("determination").notNull(),
  source: text("source").notNull(),
  sourceObservedAt: text("source_observed_at").notNull(),
  version: text("version").notNull(),
  disclaimer: text("disclaimer").notNull(),
  ...timestamps,
});

export const shippingRules = sqliteTable("shipping_rules", {
  id: text("id").primaryKey(),
  sourceCountryCode: text("source_country_code").notNull(),
  destinationCountryCode: text("destination_country_code").notNull(),
  method: text("method").notNull(),
  flatCostAmountMinor: text("flat_cost_amount_minor").notNull(),
  flatCostCurrencyCode: text("flat_cost_currency_code").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  source: text("source").notNull(),
  sourceObservedAt: text("source_observed_at").notNull(),
  version: text("version").notNull(),
  ...timestamps,
});

export const pricingPolicies = sqliteTable("pricing_policies", {
  id: text("id").primaryKey(),
  version: text("version").notNull(),
  targetMarginRateBasisPoints: integer("target_margin_rate_basis_points").notNull(),
  paymentFeeRateBasisPoints: integer("payment_fee_rate_basis_points").notNull(),
  roundingCurrencyCode: text("rounding_currency_code").notNull(),
  roundingIncrementMinor: text("rounding_increment_minor").notNull(),
  roundingMode: text("rounding_mode").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  source: text("source").notNull(),
  sourceObservedAt: text("source_observed_at").notNull(),
  ...timestamps,
});

export const pricingCalculations = sqliteTable(
  "pricing_calculations",
  {
    id: text("id").primaryKey(),
    productId: text("product_id"),
    sourceUrl: text("source_url").notNull(),
    sourceName: text("source_name").notNull(),
    sourceObservedAt: text("source_observed_at").notNull(),
    engineVersion: text("engine_version").notNull(),
    policyVersion: text("policy_version").notNull(),
    calculatedAt: text("calculated_at").notNull(),
    inputJson: text("input_json").notNull(),
    outputJson: text("output_json").notNull(),
    externalProductPayloadJson: text("external_product_payload_json"),
    ...timestamps,
  },
  (table) => [
    index("pricing_calculations_source_url_idx").on(table.sourceUrl),
    index("pricing_calculations_calculated_at_idx").on(table.calculatedAt),
  ],
);

export const pricingSnapshots = sqliteTable(
  "pricing_snapshots",
  {
    id: text("id").primaryKey(),
    calculationId: text("calculation_id")
      .notNull()
      .references(() => pricingCalculations.id),
    productId: text("product_id"),
    engineVersion: text("engine_version").notNull(),
    policyVersion: text("policy_version").notNull(),
    calculatedAt: text("calculated_at").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
    ...timestamps,
  },
  (table) => [index("pricing_snapshots_calculation_id_idx").on(table.calculationId)],
);

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  calculationId: text("calculation_id").references(() => pricingCalculations.id),
  status: text("status").notNull(),
  requestedAt: text("requested_at").notNull(),
  decidedAt: text("decided_at"),
  actorId: text("actor_id"),
  reason: text("reason"),
  ...timestamps,
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    occurredAt: text("occurred_at").notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    metadataJson: text("metadata_json"),
  },
  (table) => [index("audit_logs_target_idx").on(table.targetType, table.targetId)],
);

export const productEvents = sqliteTable(
  "product_events",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    productId: text("product_id"),
    calculationId: text("calculation_id"),
    approvalId: text("approval_id"),
    actorId: text("actor_id"),
    experimentVariant: text("experiment_variant"),
    occurredAt: text("occurred_at").notNull(),
    metadataJson: text("metadata_json"),
  },
  (table) => [
    index("product_events_product_idx").on(table.productId, table.occurredAt),
    index("product_events_name_idx").on(table.name),
  ],
);

export const productRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(variants),
}));

export const pricingCalculationRelations = relations(
  pricingCalculations,
  ({ many }) => ({
    snapshots: many(pricingSnapshots),
  }),
);
