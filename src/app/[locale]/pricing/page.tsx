import { AlertTriangle, CheckCircle2, ExternalLink, Info, ShieldCheck } from "lucide-react";

import { getFixturePricingQuote } from "@/application/pricing";
import { formatMoneyBoundary, moneyToMajorUnitString } from "@/domain/pricing";
import type { Money, PriceComponent, PricingWarningSeverity, Rate } from "@/domain/pricing";

type PricingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const supportedLocales = new Set(["ko", "en", "ja", "zh", "ar"]);

const marketNames = {
  CN: "China",
  JP: "Japan",
  KR: "Korea",
  US: "United States",
} as const;

const componentLabels: Record<PriceComponent["kind"], string> = {
  discount: "할인",
  margin: "목표 마진",
  payment_fee: "결제 수수료",
  product_cost: "상품 원가",
  rounding: "반올림 조정",
  shipping: "배송비",
  tariff: "관세 추정",
  vat: "부가세 추정",
};

function formatMoney(value: Money, locale: string): string {
  const major = Number(moneyToMajorUnitString(value));

  if (Number.isSafeInteger(major)) {
    return new Intl.NumberFormat(locale, {
      currency: value.currency,
      maximumFractionDigits: value.currency === "KRW" || value.currency === "JPY" ? 0 : 2,
      minimumFractionDigits: value.currency === "KRW" || value.currency === "JPY" ? 0 : 2,
      style: "currency",
    }).format(major);
  }

  return formatMoneyBoundary(value);
}

function formatRate(rate?: Rate): string {
  if (!rate) {
    return "-";
  }

  return `${(rate.basisPoints / 100).toFixed(2)}%`;
}

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function severityClass(severity: PricingWarningSeverity): string {
  if (severity === "blocking") {
    return "border-red-700 bg-red-50 text-red-950 dark:border-red-300 dark:bg-red-950/40 dark:text-red-100";
  }

  if (severity === "warning") {
    return "border-amber-700 bg-amber-50 text-amber-950 dark:border-amber-300 dark:bg-amber-950/40 dark:text-amber-100";
  }

  return "border-sky-700 bg-sky-50 text-sky-950 dark:border-sky-300 dark:bg-sky-950/40 dark:text-sky-100";
}

function StatPanel({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-2 border-zinc-950 bg-white p-4 shadow-[4px_4px_0_0_#0f766e] dark:border-zinc-100 dark:bg-zinc-900">
      <dt className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-2 text-2xl font-black tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </dd>
      <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{detail}</dd>
    </div>
  );
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale: requestedLocale } = await params;
  const locale = supportedLocales.has(requestedLocale) ? requestedLocale : "ko";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const quote = getFixturePricingQuote({
    calculatedAt: "2026-08-14T12:00:00.000+09:00",
    destinationCountry: "KR",
  });

  if (quote.status === "blocked") {
    return (
      <main className="min-h-screen bg-zinc-50 px-5 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <section className="mx-auto max-w-4xl border-2 border-red-700 bg-white p-5 dark:border-red-300 dark:bg-zinc-900">
          <h1 className="text-2xl font-black">가격 계산이 차단되었습니다</h1>
          <ul className="mt-4 grid gap-3">
            {quote.blockingIssues.map((issue) => (
              <li key={issue.code} className="border border-red-700 p-3 text-sm dark:border-red-300">
                <strong>{issue.code}</strong>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300">{issue.message}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  const { product, result } = quote;
  const productImage = "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/456009/item/goods_63_456009_3x4.jpg";

  return (
    <main
      dir={dir}
      className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b-2 border-zinc-950 pb-5 dark:border-zinc-100 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
              <span className="border-2 border-zinc-950 bg-teal-100 px-2 py-1 text-teal-950 dark:border-zinc-100 dark:bg-teal-300 dark:text-zinc-950">
                Global AI Pricing
              </span>
              <span className="border border-zinc-400 px-2 py-1 dark:border-zinc-600">
                {product.sourceName} to {marketNames[quote.destinationCountry]}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              첫 end-to-end fixture 계산 결과입니다. 상품 원가, 배송비, 환율, 관세,
              부가세, 수수료, 마진, 반올림 정책을 같은 입력에서 재현 가능하게 표시합니다.
            </p>
          </div>
          <a
            href={product.sourceUrl}
            className="group grid grid-cols-[96px_1fr] gap-3 border-2 border-zinc-950 bg-white p-3 shadow-[4px_4px_0_0_#0f766e] dark:border-zinc-100 dark:bg-zinc-900"
          >
            <span
              aria-label={product.name}
              className="block aspect-[3/4] w-24 border border-zinc-300 bg-cover bg-center dark:border-zinc-700"
              role="img"
              style={{ backgroundImage: `url(${productImage})` }}
            />
            <span className="flex min-w-0 flex-col justify-between gap-3">
              <span>
                <span className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Source product
                </span>
                <span className="mt-1 block truncate text-sm font-bold">{product.brand}</span>
                <span className="mt-1 block text-xs text-zinc-600 dark:text-zinc-300">
                  ID {product.productId}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300">
                원본 보기 <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </span>
          </a>
        </header>

        <dl className="grid gap-4 md:grid-cols-3">
          <StatPanel
            detail={`${marketNames[product.sourceMarket]} 원천 상품 to ${marketNames[quote.destinationCountry]}`}
            label="권장 판매가"
            value={formatMoney(result.recommendedPrice, locale)}
          />
          <StatPanel
            detail={`관측: ${formatDateTime(quote.source.sourceObservedAt, locale)}`}
            label="소스 타임스탬프"
            value={product.sourceName}
          />
          <StatPanel
            detail={`정책 ${result.policyVersion}`}
            label="엔진 버전"
            value={result.engineVersion.replace("pricing-engine-", "")}
          />
        </dl>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
              <h2 className="text-base font-black">가격 구성</h2>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                계산: {formatDateTime(result.calculatedAt, locale)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead className="bg-zinc-100 text-left dark:bg-zinc-800">
                  <tr>
                    <th className="border-b border-zinc-300 px-4 py-3 dark:border-zinc-700">항목</th>
                    <th className="border-b border-zinc-300 px-4 py-3 text-right dark:border-zinc-700">금액</th>
                    <th className="border-b border-zinc-300 px-4 py-3 text-right dark:border-zinc-700">요율</th>
                    <th className="border-b border-zinc-300 px-4 py-3 dark:border-zinc-700">근거</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((item) => (
                    <tr key={item.kind} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left font-bold">{componentLabels[item.kind]}</th>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {formatMoney(item.amount, locale)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatRate(item.rate)}</td>
                      <td className="max-w-[280px] px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {item.note ?? (item.sourceAmount ? `Source ${formatMoney(item.sourceAmount, locale)}` : "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className="border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
              <div className="border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
                <h2 className="text-base font-black">상품 메타</h2>
              </div>
              <dl className="grid gap-3 p-4 text-sm">
                {[
                  ["브랜드", product.brand ?? "-"],
                  ["출처 시장", marketNames[product.sourceMarket]],
                  ["도착 시장", marketNames[quote.destinationCountry]],
                  ["판매 상태", product.availability ?? "-"],
                  ["어댑터", product.adapterVersion],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0 dark:border-zinc-800">
                    <dt className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">{label}</dt>
                    <dd className="leading-5">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
              <div className="flex items-center gap-2 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
                <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                <h2 className="text-base font-black">가정</h2>
              </div>
              <ul className="grid gap-2 p-4">
                {result.assumptions.map((assumption) => (
                  <li key={assumption.code} className="border border-zinc-300 p-3 text-sm dark:border-zinc-700">
                    <strong className="text-xs">{assumption.code}</strong>
                    <p className="mt-1 leading-5 text-zinc-700 dark:text-zinc-300">{assumption.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
              <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              <h2 className="text-base font-black">경고 및 주의</h2>
            </div>
            <ul className="grid gap-2 p-4">
              {result.warnings.map((warning) => (
                <li key={warning.code} className={`border p-3 text-sm ${severityClass(warning.severity)}`}>
                  <strong className="text-xs uppercase">{warning.severity} · {warning.code}</strong>
                  <p className="mt-1 leading-5">{warning.message}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
              <Info className="h-4 w-4 text-sky-700 dark:text-sky-300" />
              <h2 className="text-base font-black">표시 버전</h2>
            </div>
            <dl className="grid gap-3 p-4 text-sm">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <dt className="font-bold">Fixture</dt>
                <dd className="text-right font-mono text-xs">{quote.source.fixtureId}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <dt className="font-bold">Fixture version</dt>
                <dd className="text-right font-mono text-xs">{quote.source.fixtureVersion}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <dt className="font-bold">Policy</dt>
                <dd className="text-right font-mono text-xs">{result.policyVersion}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  Status
                </dt>
                <dd className="text-right font-bold text-teal-700 dark:text-teal-300">Success</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
