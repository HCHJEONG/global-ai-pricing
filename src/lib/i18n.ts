import type { CountryCode, PriceComponentKind } from "@/domain/pricing";

export const locales = ["ko", "en", "ja", "zh", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getLocaleDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

type PricingMessages = {
  assumptionsTitle: string;
  blockedTitle: string;
  brand: string;
  breakdownTitle: string;
  calculated: string;
  destinationMarket: string;
  engineVersion: string;
  fixture: string;
  fixtureVersion: string;
  headerDescription: string;
  item: string;
  marketRouteNote: string;
  policy: string;
  productMetaTitle: string;
  rate: string;
  rawPrice: string;
  recommendedPrice: string;
  normalizedPrice: string;
  source: string;
  sourceMarket: string;
  sourceProduct: string;
  sourceTimestamp: string;
  status: string;
  statusSuccess: string;
  value: string;
  versionTitle: string;
  viewSource: string;
  warningsTitle: string;
  componentLabels: Record<PriceComponentKind, string>;
  markets: Record<CountryCode, string>;
};

type AuditMessages = {
  action: string;
  actor: string;
  after: string;
  auditLogsTitle: string;
  before: string;
  emptyDescription: string;
  emptyTitle: string;
  headerDescription: string;
  historyTitle: string;
  metadata: string;
  occurredAt: string;
  target: string;
  targetId: string;
  targetType: string;
};

const englishMarkets: Record<CountryCode, string> = {
  CN: "China",
  JP: "Japan",
  KR: "Korea",
  US: "United States",
};

export const pricingMessages: Record<Locale, PricingMessages> = {
  ar: {
    assumptionsTitle: "الافتراضات",
    blockedTitle: "تم إيقاف حساب السعر",
    brand: "العلامة التجارية",
    breakdownTitle: "مكونات السعر",
    calculated: "وقت الحساب",
    destinationMarket: "سوق الوجهة",
    engineVersion: "إصدار المحرك",
    fixture: "Fixture",
    fixtureVersion: "إصدار Fixture",
    headerDescription:
      "نتيجة أول حساب fixture من البداية إلى النهاية. تعرض الصفحة التكلفة والشحن وسعر الصرف والرسوم والضريبة والهامش وسياسة التقريب من نفس المدخلات القابلة للإعادة.",
    item: "البند",
    marketRouteNote: "مسارات ja و zh هي لغات، بينما JP و CN تبقيان رموز أسواق.",
    policy: "السياسة",
    productMetaTitle: "بيانات المنتج",
    rate: "النسبة",
    rawPrice: "السعر الأصلي",
    recommendedPrice: "السعر المقترح",
    normalizedPrice: "السعر بعد التطبيع",
    source: "المصدر",
    sourceMarket: "سوق المصدر",
    sourceProduct: "منتج المصدر",
    sourceTimestamp: "وقت المصدر",
    status: "الحالة",
    statusSuccess: "نجاح",
    value: "المبلغ",
    versionTitle: "إصدارات العرض",
    viewSource: "عرض المصدر",
    warningsTitle: "تحذيرات وملاحظات",
    componentLabels: {
      discount: "خصم",
      margin: "هامش مستهدف",
      payment_fee: "رسوم الدفع",
      product_cost: "تكلفة المنتج",
      rounding: "تعديل التقريب",
      shipping: "الشحن",
      tariff: "تقدير الرسوم",
      vat: "تقدير الضريبة",
    },
    markets: englishMarkets,
  },
  en: {
    assumptionsTitle: "Assumptions",
    blockedTitle: "Pricing calculation is blocked",
    brand: "Brand",
    breakdownTitle: "Price Breakdown",
    calculated: "Calculated",
    destinationMarket: "Destination market",
    engineVersion: "Engine version",
    fixture: "Fixture",
    fixtureVersion: "Fixture version",
    headerDescription:
      "The first end-to-end fixture pricing result. Product cost, shipping, exchange rate, tariff, VAT, fees, margin, and rounding policy are displayed from repeatable inputs.",
    item: "Item",
    marketRouteNote: "ja and zh are language routes; JP and CN remain market codes.",
    policy: "Policy",
    productMetaTitle: "Product Meta",
    rate: "Rate",
    rawPrice: "Raw price",
    recommendedPrice: "Recommended Price",
    normalizedPrice: "Normalized price",
    source: "Source",
    sourceMarket: "Source market",
    sourceProduct: "Source product",
    sourceTimestamp: "Source Timestamp",
    status: "Status",
    statusSuccess: "Success",
    value: "Amount",
    versionTitle: "Display Versions",
    viewSource: "View source",
    warningsTitle: "Warnings and Caveats",
    componentLabels: {
      discount: "Discount",
      margin: "Target margin",
      payment_fee: "Payment fee",
      product_cost: "Product cost",
      rounding: "Rounding adjustment",
      shipping: "Shipping",
      tariff: "Tariff estimate",
      vat: "VAT estimate",
    },
    markets: englishMarkets,
  },
  ja: {
    assumptionsTitle: "前提",
    blockedTitle: "価格計算がブロックされました",
    brand: "ブランド",
    breakdownTitle: "価格内訳",
    calculated: "計算時刻",
    destinationMarket: "販売先市場",
    engineVersion: "エンジン版",
    fixture: "Fixture",
    fixtureVersion: "Fixture版",
    headerDescription:
      "最初のエンドツーエンド fixture 計算結果です。商品原価、配送、為替、関税、VAT、手数料、マージン、丸めポリシーを再現可能な入力から表示します。",
    item: "項目",
    marketRouteNote: "ja と zh は言語ルートで、JP と CN は市場コードのままです。",
    policy: "ポリシー",
    productMetaTitle: "商品メタ",
    rate: "料率",
    rawPrice: "元価格",
    recommendedPrice: "推奨価格",
    normalizedPrice: "正規化価格",
    source: "ソース",
    sourceMarket: "仕入元市場",
    sourceProduct: "ソース商品",
    sourceTimestamp: "ソース時刻",
    status: "状態",
    statusSuccess: "成功",
    value: "金額",
    versionTitle: "表示バージョン",
    viewSource: "原文を見る",
    warningsTitle: "警告と注意",
    componentLabels: {
      discount: "割引",
      margin: "目標マージン",
      payment_fee: "決済手数料",
      product_cost: "商品原価",
      rounding: "丸め調整",
      shipping: "配送費",
      tariff: "関税見積",
      vat: "VAT見積",
    },
    markets: englishMarkets,
  },
  ko: {
    assumptionsTitle: "가정",
    blockedTitle: "가격 계산이 차단되었습니다",
    brand: "브랜드",
    breakdownTitle: "가격 구성",
    calculated: "계산",
    destinationMarket: "도착 시장",
    engineVersion: "엔진 버전",
    fixture: "Fixture",
    fixtureVersion: "Fixture version",
    headerDescription:
      "첫 end-to-end fixture 계산 결과입니다. 상품 원가, 배송비, 환율, 관세, 부가세, 수수료, 마진, 반올림 정책을 같은 입력에서 재현 가능하게 표시합니다.",
    item: "항목",
    marketRouteNote: "ja와 zh는 언어 라우트이며, JP와 CN은 시장 코드로만 유지합니다.",
    policy: "정책",
    productMetaTitle: "상품 메타",
    rate: "요율",
    rawPrice: "원본 가격",
    recommendedPrice: "권장 판매가",
    normalizedPrice: "정규화 가격",
    source: "근거",
    sourceMarket: "출처 시장",
    sourceProduct: "Source product",
    sourceTimestamp: "소스 타임스탬프",
    status: "Status",
    statusSuccess: "Success",
    value: "금액",
    versionTitle: "표시 버전",
    viewSource: "원본 보기",
    warningsTitle: "경고 및 주의",
    componentLabels: {
      discount: "할인",
      margin: "목표 마진",
      payment_fee: "결제 수수료",
      product_cost: "상품 원가",
      rounding: "반올림 조정",
      shipping: "배송비",
      tariff: "관세 추정",
      vat: "부가세 추정",
    },
    markets: {
      CN: "중국",
      JP: "일본",
      KR: "한국",
      US: "미국",
    },
  },
  zh: {
    assumptionsTitle: "假设",
    blockedTitle: "价格计算已阻止",
    brand: "品牌",
    breakdownTitle: "价格构成",
    calculated: "计算时间",
    destinationMarket: "目的市场",
    engineVersion: "引擎版本",
    fixture: "Fixture",
    fixtureVersion: "Fixture 版本",
    headerDescription:
      "第一个端到端 fixture 计算结果。页面用可复现输入展示商品成本、运费、汇率、关税、VAT、手续费、利润和取整策略。",
    item: "项目",
    marketRouteNote: "ja 和 zh 是语言路由；JP 和 CN 仍只作为市场代码。",
    policy: "策略",
    productMetaTitle: "商品元数据",
    rate: "费率",
    rawPrice: "原始价格",
    recommendedPrice: "建议售价",
    normalizedPrice: "标准化价格",
    source: "依据",
    sourceMarket: "来源市场",
    sourceProduct: "来源商品",
    sourceTimestamp: "来源时间",
    status: "状态",
    statusSuccess: "成功",
    value: "金额",
    versionTitle: "显示版本",
    viewSource: "查看来源",
    warningsTitle: "警告和注意",
    componentLabels: {
      discount: "折扣",
      margin: "目标利润",
      payment_fee: "支付手续费",
      product_cost: "商品成本",
      rounding: "取整调整",
      shipping: "运费",
      tariff: "关税估算",
      vat: "VAT 估算",
    },
    markets: englishMarkets,
  },
};

export const auditMessages: Record<Locale, AuditMessages> = {
  ar: {
    action: "الإجراء",
    actor: "الفاعل",
    after: "بعد",
    auditLogsTitle: "سجل التدقيق",
    before: "قبل",
    emptyDescription: "ستظهر هنا عمليات الحساب والموافقة والتنفيذ بعد تسجيلها.",
    emptyTitle: "لا توجد سجلات تدقيق بعد",
    headerDescription:
      "يعرض هذا السجل الإجراءات المهمة مع الفاعل والوقت والهدف وقيم قبل/بعد عند توفرها.",
    historyTitle: "سجل الموافقة الكامل",
    metadata: "بيانات إضافية",
    occurredAt: "الوقت",
    target: "الهدف",
    targetId: "معرف الهدف",
    targetType: "نوع الهدف",
  },
  en: {
    action: "Action",
    actor: "Actor",
    after: "After",
    auditLogsTitle: "Audit Logs",
    before: "Before",
    emptyDescription:
      "Calculation, approval, execution, rejection, and failure records will appear here after they are written.",
    emptyTitle: "No audit logs yet",
    headerDescription:
      "Trace important operations with actor, action, timestamp, target, and before/after values where relevant.",
    historyTitle: "Full Approval History",
    metadata: "Metadata",
    occurredAt: "Time",
    target: "Target",
    targetId: "Target ID",
    targetType: "Target Type",
  },
  ja: {
    action: "操作",
    actor: "実行者",
    after: "変更後",
    auditLogsTitle: "監査ログ",
    before: "変更前",
    emptyDescription: "計算、承認、実行、却下、失敗の記録が保存されるとここに表示されます。",
    emptyTitle: "監査ログはまだありません",
    headerDescription:
      "重要な操作を、実行者、操作、時刻、対象、必要な変更前後の値とともに追跡します。",
    historyTitle: "承認の全履歴",
    metadata: "メタデータ",
    occurredAt: "時刻",
    target: "対象",
    targetId: "対象ID",
    targetType: "対象種別",
  },
  ko: {
    action: "액션",
    actor: "수행자",
    after: "이후 값",
    auditLogsTitle: "감사 로그",
    before: "이전 값",
    emptyDescription:
      "계산, 승인, 실행, 거절, 실패 기록이 저장되면 여기에 표시됩니다.",
    emptyTitle: "아직 감사 로그가 없습니다",
    headerDescription:
      "중요 작업을 수행자, 액션, 시각, 대상, 필요한 이전/이후 값과 함께 추적합니다.",
    historyTitle: "전체 승인 이력",
    metadata: "메타데이터",
    occurredAt: "시각",
    target: "대상",
    targetId: "대상 ID",
    targetType: "대상 유형",
  },
  zh: {
    action: "动作",
    actor: "操作者",
    after: "之后",
    auditLogsTitle: "审计日志",
    before: "之前",
    emptyDescription: "计算、审批、执行、拒绝和失败记录写入后会显示在这里。",
    emptyTitle: "还没有审计日志",
    headerDescription:
      "用操作者、动作、时间、目标以及相关前后值追踪关键操作。",
    historyTitle: "完整审批历史",
    metadata: "元数据",
    occurredAt: "时间",
    target: "目标",
    targetId: "目标 ID",
    targetType: "目标类型",
  },
};
