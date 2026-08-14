import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Browser, Page } from "playwright";
import { chromium } from "playwright";
import { z } from "zod";

import type { SourceProductFixture } from "../../domain/pricing";

export const UNIQLO_US_456009_URL =
  "https://www.uniqlo.com/us/en/products/E456009-000/00";

export const UNIQLO_US_ADAPTER_VERSION = "uniqlo-us-playwright-adapter-2026-08-14.unit-18";

const browserSnapshotSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  jsonLd: z.array(z.unknown()).default([]),
  visibleText: z.string().default(""),
});

export type UniqloUsBrowserSnapshot = z.infer<typeof browserSnapshotSchema>;

export type UniqloUsScrapeResult = {
  product: SourceProductFixture;
  snapshot: {
    adapterVersion: string;
    collectedAt: string;
    sourceUrl: string;
    publicFields: UniqloUsBrowserSnapshot;
  };
};

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function parseJsonLdProduct(snapshot: UniqloUsBrowserSnapshot): Record<string, unknown> {
  for (const item of snapshot.jsonLd) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const type = candidate["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes("Product")) {
      return candidate;
    }
  }

  return {};
}

function parsePriceAmount(input: unknown): string | undefined {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input.toFixed(2);
  }

  if (typeof input !== "string") {
    return undefined;
  }

  const match = input.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]).toFixed(2) : undefined;
}

function parseColors(visibleText: string): string[] | undefined {
  const match = visibleText.match(/\b(BLACK|WHITE|BLUE|YELLOW|GREEN|GRAY|GREY|PINK|RED|BROWN|BEIGE|NAVY)\b/gi);
  const colors = [...new Set((match ?? []).map((color) => color.toUpperCase()))];
  return colors.length > 0 ? colors : undefined;
}

export function normalizeUniqloUsProductSnapshot(
  input: UniqloUsBrowserSnapshot,
  observedAt = new Date().toISOString(),
): SourceProductFixture {
  const snapshot = browserSnapshotSchema.parse(input);
  const productJsonLd = parseJsonLdProduct(snapshot);
  const offers =
    productJsonLd.offers && typeof productJsonLd.offers === "object"
      ? (Array.isArray(productJsonLd.offers)
          ? productJsonLd.offers[0]
          : productJsonLd.offers) as Record<string, unknown>
      : {};

  const productName = firstString(
    productJsonLd.name,
    snapshot.title?.replace(/\s*\|\s*UNIQLO US.*$/i, ""),
  );
  const priceAmount = parsePriceAmount(firstString(offers.price, snapshot.visibleText));

  if (!productName) {
    throw new Error("UNIQLO US product name was not found in public page metadata.");
  }

  if (!priceAmount) {
    throw new Error("UNIQLO US product price was not found in public page metadata.");
  }

  return {
    fixtureId: "uniqlo-us-456009-live",
    sourceName: "UNIQLO US",
    sourceUrl: snapshot.canonicalUrl ?? UNIQLO_US_456009_URL,
    sourceMarket: "US",
    observedAt,
    adapterVersion: UNIQLO_US_ADAPTER_VERSION,
    rawExtractedFields: {
      productId: "456009",
      productName,
      brand: firstString(productJsonLd.brand, "UNIQLO"),
      price: {
        amount: priceAmount,
        currency: firstString(offers.priceCurrency) === "USD" ? "USD" : "USD",
        taxPolicy: "exclusive",
      },
      availability: firstString(offers.availability, snapshot.visibleText.match(/(In stock|Out of stock|Available)/i)?.[1]),
      description: firstString(productJsonLd.description, snapshot.description),
      colors: parseColors(snapshot.visibleText),
      imageUrl: firstString(productJsonLd.image, snapshot.imageUrl),
    },
  };
}

async function collectPublicFields(page: Page): Promise<UniqloUsBrowserSnapshot> {
  return browserSnapshotSchema.parse(
    await page.evaluate(() => {
      const meta = (selector: string) =>
        document.querySelector<HTMLMetaElement>(selector)?.content?.trim();
      const text = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
      const jsonLd = Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
      ).flatMap((script) => {
        try {
          const parsed = JSON.parse(script.textContent ?? "null");
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      });

      return {
        title: document.title?.trim(),
        description: meta('meta[name="description"]') ?? meta('meta[property="og:description"]'),
        canonicalUrl:
          document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ??
          window.location.href,
        imageUrl: meta('meta[property="og:image"]'),
        jsonLd,
        visibleText: text.slice(0, 20_000),
      };
    }),
  );
}

export async function collectUniqloUsProduct456009(
  options: { headless?: boolean; browser?: Browser } = {},
): Promise<UniqloUsScrapeResult> {
  const browser = options.browser ?? (await chromium.launch({ headless: options.headless ?? true }));
  const ownsBrowser = !options.browser;

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (compatible; GlobalAIPricingDemo/0.1; public product metadata collection)",
    });
    await page.goto(UNIQLO_US_456009_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const publicFields = await collectPublicFields(page);
    const collectedAt = new Date().toISOString();

    return {
      product: normalizeUniqloUsProductSnapshot(publicFields, collectedAt),
      snapshot: {
        adapterVersion: UNIQLO_US_ADAPTER_VERSION,
        collectedAt,
        sourceUrl: UNIQLO_US_456009_URL,
        publicFields,
      },
    };
  } finally {
    if (ownsBrowser) {
      await browser.close();
    }
  }
}

export async function saveUniqloUsSnapshot(
  result: UniqloUsScrapeResult,
  outputDir = path.join(process.cwd(), "data", "scrapes", "uniqlo-us"),
): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const fileName = `456009-${result.snapshot.collectedAt.replace(/[:.]/g, "-")}.json`;
  const filePath = path.join(outputDir, fileName);
  await writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return filePath;
}
