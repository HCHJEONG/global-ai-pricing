import { chromium, type Locator, type Page } from "playwright";

import {
  createDatabaseClient,
  createSqliteConnection,
  DrizzleProductEventRepository,
} from "../src/infrastructure/db";

const baseUrl = process.env.PRICING_BASE_URL ?? "http://localhost:3000";
const pricingUrl = new URL("/ko/pricing", baseUrl).toString();

async function expectVisible(locator: Locator, label: string) {
  try {
    await locator.waitFor({ state: "visible", timeout: 5_000 });
  } catch (error) {
    throw new Error(`Expected visible: ${label}`, { cause: error });
  }
}

async function expectTextVisible(page: Page, text: string | RegExp, label: string) {
  await expectVisible(page.getByText(text), label);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { height: 820, width: 390 } });

  try {
    await page.goto(pricingUrl, { waitUntil: "networkidle" });

    await expectVisible(page.getByRole("heading", { name: /Cotton Oversized/i }), "product fixture");
    await expectTextVisible(page, "Fixture 기반 결정적 결과", "fixture-backed status");
    await expectTextVisible(page, "pnpm scrape:uniqlo-us", "read-only scrape command");
    await expectTextVisible(page, /UNIQLO US Playwright adapter/, "Playwright adapter status");
    await expectTextVisible(page, "권장 판매가", "recommended price label");
    await expectTextVisible(page, /관세|Tariff/i, "warning visibility");

    const recommendedPrice = await page.getByTestId("recommended-price").textContent();

    await page.getByTestId("open-breakdown").click();
    await expectVisible(page.getByTestId("price-breakdown"), "price breakdown panel");
    await expectVisible(page.getByRole("table"), "price breakdown table");

    const recommendedPriceAfterBreakdown = await page.getByTestId("recommended-price").textContent();

    if (recommendedPrice !== recommendedPriceAfterBreakdown) {
      throw new Error("Opening the breakdown changed the displayed recommended price.");
    }

    await page.waitForTimeout(500);
  } finally {
    await browser.close();
  }

  const sqlite = createSqliteConnection();
  const repository = new DrizzleProductEventRepository(createDatabaseClient(sqlite));

  try {
    const events = await repository.findByProduct({ productId: "456009" });
    const eventNames = new Set(events.map((event) => event.name));

    if (!eventNames.has("product.price_viewed")) {
      throw new Error("Missing product.price_viewed event for product 456009.");
    }

    if (!eventNames.has("product.breakdown_opened")) {
      throw new Error("Missing product.breakdown_opened event for product 456009.");
    }
  } finally {
    sqlite.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
