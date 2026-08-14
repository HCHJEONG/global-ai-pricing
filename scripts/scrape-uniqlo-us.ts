import {
  collectUniqloUsProduct456009,
  saveUniqloUsSnapshot,
} from "../src/infrastructure/scraping";

async function main() {
  if (process.env.CONFIRM_LIVE_SCRAPE !== "true") {
    throw new Error(
      "Set CONFIRM_LIVE_SCRAPE=true after confirming the target site's terms, robots guidance, rate limits, and acceptable-use constraints.",
    );
  }

  const result = await collectUniqloUsProduct456009({
    headless: process.env.HEADLESS !== "false",
  });
  const savedPath = await saveUniqloUsSnapshot(result);

  console.log(
    JSON.stringify(
      {
        savedPath,
        productId: result.product.rawExtractedFields.productId,
        productName: result.product.rawExtractedFields.productName,
        price: result.product.rawExtractedFields.price,
        observedAt: result.product.observedAt,
        adapterVersion: result.product.adapterVersion,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
