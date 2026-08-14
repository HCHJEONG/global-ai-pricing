import { sql } from "drizzle-orm";

import type { DatabaseClient } from "./client";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS brands_name_unique ON brands (name)`,
  `CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    default_currency_code TEXT NOT NULL,
    market_role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY NOT NULL,
    minor_units INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_market_code TEXT NOT NULL,
    external_product_id TEXT,
    name TEXT NOT NULL,
    brand_id TEXT REFERENCES brands(id),
    raw_payload_json TEXT,
    source_observed_at TEXT NOT NULL,
    adapter_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS products_source_url_unique ON products (source_url)`,
  `CREATE INDEX IF NOT EXISTS products_external_product_id_idx ON products (external_product_id)`,
  `CREATE TABLE IF NOT EXISTS variants (
    id TEXT PRIMARY KEY NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id),
    sku TEXT,
    color TEXT,
    size TEXT,
    availability TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS variants_product_id_idx ON variants (product_id)`,
  `CREATE TABLE IF NOT EXISTS exchange_rates (
    id TEXT PRIMARY KEY NOT NULL,
    from_currency_code TEXT NOT NULL,
    to_currency_code TEXT NOT NULL,
    rate TEXT NOT NULL,
    basis TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    source TEXT NOT NULL,
    version TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS exchange_rates_pair_observed_idx ON exchange_rates (from_currency_code, to_currency_code, observed_at)`,
  `CREATE TABLE IF NOT EXISTS tax_rules (
    id TEXT PRIMARY KEY NOT NULL,
    country_code TEXT NOT NULL,
    kind TEXT NOT NULL,
    rate_basis_points INTEGER NOT NULL,
    taxable_base TEXT NOT NULL,
    effective_from TEXT NOT NULL,
    source TEXT NOT NULL,
    source_observed_at TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tariff_rules (
    id TEXT PRIMARY KEY NOT NULL,
    source_country_code TEXT NOT NULL,
    destination_country_code TEXT NOT NULL,
    product_category TEXT NOT NULL,
    rate_basis_points INTEGER NOT NULL,
    classification_basis TEXT NOT NULL,
    determination TEXT NOT NULL,
    source TEXT NOT NULL,
    source_observed_at TEXT NOT NULL,
    version TEXT NOT NULL,
    disclaimer TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS shipping_rules (
    id TEXT PRIMARY KEY NOT NULL,
    source_country_code TEXT NOT NULL,
    destination_country_code TEXT NOT NULL,
    method TEXT NOT NULL,
    flat_cost_amount_minor TEXT NOT NULL,
    flat_cost_currency_code TEXT NOT NULL,
    effective_from TEXT NOT NULL,
    source TEXT NOT NULL,
    source_observed_at TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pricing_policies (
    id TEXT PRIMARY KEY NOT NULL,
    version TEXT NOT NULL,
    target_margin_rate_basis_points INTEGER NOT NULL,
    payment_fee_rate_basis_points INTEGER NOT NULL,
    rounding_currency_code TEXT NOT NULL,
    rounding_increment_minor TEXT NOT NULL,
    rounding_mode TEXT NOT NULL,
    effective_from TEXT NOT NULL,
    source TEXT NOT NULL,
    source_observed_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pricing_calculations (
    id TEXT PRIMARY KEY NOT NULL,
    product_id TEXT,
    source_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_observed_at TEXT NOT NULL,
    engine_version TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    calculated_at TEXT NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT NOT NULL,
    external_product_payload_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS pricing_calculations_source_url_idx ON pricing_calculations (source_url)`,
  `CREATE INDEX IF NOT EXISTS pricing_calculations_calculated_at_idx ON pricing_calculations (calculated_at)`,
  `CREATE TABLE IF NOT EXISTS pricing_snapshots (
    id TEXT PRIMARY KEY NOT NULL,
    calculation_id TEXT NOT NULL REFERENCES pricing_calculations(id),
    product_id TEXT,
    engine_version TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    calculated_at TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS pricing_snapshots_calculation_id_idx ON pricing_snapshots (calculation_id)`,
  `CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY NOT NULL,
    calculation_id TEXT REFERENCES pricing_calculations(id),
    status TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    decided_at TEXT,
    actor_id TEXT,
    reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    actor_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    before_json TEXT,
    after_json TEXT,
    metadata_json TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs (target_type, target_id)`,
];

export async function bootstrapDatabase(db: DatabaseClient): Promise<void> {
  for (const statement of schemaStatements) {
    await db.run(sql.raw(statement));
  }
}
