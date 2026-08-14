import { z } from "zod";

import { createLocalProductEventService } from "@/application/analytics/product-events";

export const runtime = "nodejs";

const productEventRequestSchema = z.object({
  name: z.enum(["product.price_viewed", "product.breakdown_opened"]),
  productId: z.string().min(1).optional(),
  calculationId: z.string().min(1).optional(),
  experimentVariant: z.string().min(1).optional(),
  metadata: z.unknown().optional(),
});

export async function POST(request: Request) {
  const parsed = productEventRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid product event payload." },
      { status: 400 },
    );
  }

  const { service, close } = await createLocalProductEventService();

  try {
    const { name, ...input } = parsed.data;
    const event =
      name === "product.price_viewed"
        ? await service.recordPriceViewed(input)
        : await service.recordBreakdownOpened(input);

    return Response.json({ event });
  } finally {
    close();
  }
}
