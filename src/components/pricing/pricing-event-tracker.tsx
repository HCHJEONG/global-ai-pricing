"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type ProductEventPayload = {
  name: "product.price_viewed" | "product.breakdown_opened";
  productId: string;
  calculationId: string;
  metadata: {
    destinationCountry: string;
    fixtureId: string;
    surface: "pricing_dashboard";
  };
};

type PricingEventTrackerProps = {
  breakdownLabel: string;
  calculatedLabel: string;
  calculatedAt: string;
  children: React.ReactNode;
  closeLabel: string;
  eventContext: Omit<ProductEventPayload, "name">;
  openLabel: string;
};

function recordProductEvent(payload: ProductEventPayload): void {
  void fetch("/api/product-events", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => {
    // Analytics must never affect pricing display or interaction.
  });
}

export function PricingEventTracker({
  breakdownLabel,
  calculatedLabel,
  calculatedAt,
  children,
  closeLabel,
  eventContext,
  openLabel,
}: PricingEventTrackerProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const didRecordBreakdownOpen = useRef(false);

  useEffect(() => {
    recordProductEvent({ ...eventContext, name: "product.price_viewed" });
  }, [eventContext]);

  function toggleBreakdown() {
    const nextOpen = !isBreakdownOpen;
    setIsBreakdownOpen(nextOpen);

    if (nextOpen && !didRecordBreakdownOpen.current) {
      didRecordBreakdownOpen.current = true;
      recordProductEvent({ ...eventContext, name: "product.breakdown_opened" });
    }
  }

  return (
    <div className="overflow-hidden border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
        <h2 className="text-base font-black">{breakdownLabel}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {calculatedLabel}: {calculatedAt}
          </span>
          <Button
            aria-expanded={isBreakdownOpen}
            className="h-9"
            data-testid="open-breakdown"
            onClick={toggleBreakdown}
            type="button"
          >
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${isBreakdownOpen ? "rotate-180" : ""}`}
            />
            {isBreakdownOpen ? closeLabel : openLabel}
          </Button>
        </div>
      </div>
      {isBreakdownOpen ? (
        <div data-testid="price-breakdown">{children}</div>
      ) : null}
    </div>
  );
}
