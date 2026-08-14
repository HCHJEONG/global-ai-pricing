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
  adapter: string;
  assumptionsTitle: string;
  assumptionMessages: Record<string, string>;
  availability: string;
  breakdownCloseLabel: string;
  breakdownOpenLabel: string;
  blockedTitle: string;
  brand: string;
  breakdownTitle: string;
  calculated: string;
  dataMode: string;
  devCommand: string;
  destinationMarket: string;
  engineVersion: string;
  fixture: string;
  fixtureBacked: string;
  fixtureVersion: string;
  headerDescription: string;
  item: string;
  integrationPath: string;
  integrationTitle: string;
  marketRouteNote: string;
  policy: string;
  playwrightAdapterStatus: string;
  productMetaTitle: string;
  rate: string;
  rawPrice: string;
  rawPriceDetail: string;
  recommendedPrice: string;
  normalizedPrice: string;
  normalizedPriceDetail: string;
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
  componentNotes: Partial<Record<PriceComponentKind, string>>;
  markets: Record<CountryCode, string>;
  warningMessages: Record<string, string>;
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

type ThemeMessages = {
  dark: string;
  light: string;
  system: string;
  title: string;
};

const englishMarkets: Record<CountryCode, string> = {
  CN: "China",
  JP: "Japan",
  KR: "Korea",
  US: "United States",
};

export const pricingMessages: Record<Locale, PricingMessages> = {
  ar: {
    adapter: "المحول",
    assumptionsTitle: "الافتراضات",
    assumptionMessages: {
      CALCULATION_ORDER:
        "يتم تحويل تكلفة المنتج والشحن أولاً، ثم تقدير الرسوم والضريبة قبل الرسوم والهامش والخصم والتقريب.",
      EXCHANGE_RATE_BASIS: "يستخدم هذا العرض سعر USD/KRW تجريبي ثابت، وليس سعراً حياً.",
      ROUNDING_POLICY: "يتم تقريب السعر المقترح إلى أقرب 100 KRW.",
    },
    availability: "التوفر",
    breakdownCloseLabel: "إخفاء المكونات",
    breakdownOpenLabel: "عرض المكونات",
    blockedTitle: "تم إيقاف حساب السعر",
    brand: "العلامة التجارية",
    breakdownTitle: "مكونات السعر",
    calculated: "وقت الحساب",
    dataMode: "وضع البيانات",
    devCommand: "أمر التطوير",
    destinationMarket: "سوق الوجهة",
    engineVersion: "إصدار المحرك",
    fixture: "Fixture",
    fixtureBacked: "Fixture ثابت وقابل للإعادة",
    fixtureVersion: "إصدار Fixture",
    headerDescription:
      "نتيجة أول حساب fixture من البداية إلى النهاية. تعرض الصفحة التكلفة والشحن وسعر الصرف والرسوم والضريبة والهامش وسياسة التقريب من نفس المدخلات القابلة للإعادة.",
    item: "البند",
    integrationPath: "مسار التكامل",
    integrationTitle: "حالة التكامل",
    marketRouteNote: "مسارات ja و zh هي لغات، بينما JP و CN تبقيان رموز أسواق.",
    policy: "السياسة",
    playwrightAdapterStatus: "محول UNIQLO US Playwright موجود للتشغيل بواسطة المشرف.",
    productMetaTitle: "بيانات المنتج",
    rate: "النسبة",
    rawPrice: "السعر الأصلي",
    rawPriceDetail: "كما ظهر في بيانات المصدر",
    recommendedPrice: "السعر المقترح",
    normalizedPrice: "السعر بعد التطبيع",
    normalizedPriceDetail: "قيمة منظمة يستخدمها محرك التسعير",
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
    componentNotes: {
      rounding: "تقريب إلى أقرب 100 KRW",
      tariff: "تقدير حسب فئة المنتج، وليس قراراً جمركياً رسمياً.",
      vat: "يطبق على تكلفة المنتج والشحن وتقدير الرسوم.",
    },
    markets: englishMarkets,
    warningMessages: {
      CUSTOMS_ESTIMATE_ONLY:
        "الرسوم وVAT تقديرات للعرض التجريبي وليست نصيحة جمركية أو ضريبية رسمية.",
      STALE_EXCHANGE_RATE: "سعر الصرف المستخدم قديم مقارنة بوقت الحساب.",
    },
  },
  en: {
    adapter: "Adapter",
    assumptionsTitle: "Assumptions",
    assumptionMessages: {
      CALCULATION_ORDER:
        "Cost and shipping are converted first; tariff and VAT are estimated before fee, margin, discount, and rounding.",
      EXCHANGE_RATE_BASIS: "This demo uses a fixed USD/KRW seed rate, not a live FX quote.",
      ROUNDING_POLICY: "Recommended price is rounded to the nearest 100 KRW.",
    },
    availability: "Availability",
    breakdownCloseLabel: "Hide breakdown",
    breakdownOpenLabel: "Show breakdown",
    blockedTitle: "Pricing calculation is blocked",
    brand: "Brand",
    breakdownTitle: "Price Breakdown",
    calculated: "Calculated",
    dataMode: "Data mode",
    devCommand: "Development command",
    destinationMarket: "Destination market",
    engineVersion: "Engine version",
    fixture: "Fixture",
    fixtureBacked: "Fixture-backed and deterministic",
    fixtureVersion: "Fixture version",
    headerDescription:
      "The first end-to-end fixture pricing result. Product cost, shipping, exchange rate, tariff, VAT, fees, margin, and rounding policy are displayed from repeatable inputs.",
    item: "Item",
    integrationPath: "Integration path",
    integrationTitle: "Integration Status",
    marketRouteNote: "ja and zh are language routes; JP and CN remain market codes.",
    policy: "Policy",
    playwrightAdapterStatus: "UNIQLO US Playwright adapter exists for maintainer-run collection.",
    productMetaTitle: "Product Meta",
    rate: "Rate",
    rawPrice: "Raw price",
    rawPriceDetail: "As extracted from the source fixture",
    recommendedPrice: "Recommended Price",
    normalizedPrice: "Normalized price",
    normalizedPriceDetail: "Structured value used by the pricing engine",
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
    componentNotes: {
      rounding: "Rounded to the nearest 100 KRW",
      tariff: "Estimated from product category, not an official customs ruling.",
      vat: "Applied to product cost, shipping, and tariff estimate.",
    },
    markets: englishMarkets,
    warningMessages: {
      CUSTOMS_ESTIMATE_ONLY:
        "Tariff and VAT are portfolio-demo estimates and are not official customs or tax advice.",
      STALE_EXCHANGE_RATE: "The exchange-rate observation is stale for this calculation.",
    },
  },
  ja: {
    adapter: "アダプター",
    assumptionsTitle: "前提",
    assumptionMessages: {
      CALCULATION_ORDER:
        "商品原価と配送費を先に換算し、関税とVATを見積もった後に手数料、マージン、割引、丸めを適用します。",
      EXCHANGE_RATE_BASIS: "このデモは固定のUSD/KRWシードレートを使用し、ライブ為替ではありません。",
      ROUNDING_POLICY: "推奨価格は100 KRW単位に丸めます。",
    },
    availability: "在庫状況",
    breakdownCloseLabel: "内訳を隠す",
    breakdownOpenLabel: "内訳を見る",
    blockedTitle: "価格計算がブロックされました",
    brand: "ブランド",
    breakdownTitle: "価格内訳",
    calculated: "計算時刻",
    dataMode: "データモード",
    devCommand: "開発コマンド",
    destinationMarket: "販売先市場",
    engineVersion: "エンジン版",
    fixture: "Fixture",
    fixtureBacked: "Fixtureベースで決定的",
    fixtureVersion: "Fixture版",
    headerDescription:
      "最初のエンドツーエンド fixture 計算結果です。商品原価、配送、為替、関税、VAT、手数料、マージン、丸めポリシーを再現可能な入力から表示します。",
    item: "項目",
    integrationPath: "連携パス",
    integrationTitle: "連携状態",
    marketRouteNote: "ja と zh は言語ルートで、JP と CN は市場コードのままです。",
    policy: "ポリシー",
    playwrightAdapterStatus: "UNIQLO US Playwright adapter is available for maintainer-run collection.",
    productMetaTitle: "商品メタ",
    rate: "料率",
    rawPrice: "元価格",
    rawPriceDetail: "ソースfixtureから抽出された表示値",
    recommendedPrice: "推奨価格",
    normalizedPrice: "正規化価格",
    normalizedPriceDetail: "価格エンジンが使用する構造化された値",
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
    componentNotes: {
      rounding: "100 KRW単位に丸め",
      tariff: "商品カテゴリに基づく見積で、公式な税関判断ではありません。",
      vat: "商品原価、配送費、関税見積に適用します。",
    },
    markets: englishMarkets,
    warningMessages: {
      CUSTOMS_ESTIMATE_ONLY:
        "関税とVATはポートフォリオデモ用の見積で、公式な税関・税務助言ではありません。",
      STALE_EXCHANGE_RATE: "この計算で使用した為替観測値は古くなっています。",
    },
  },
  ko: {
    adapter: "어댑터",
    assumptionsTitle: "가정",
    assumptionMessages: {
      CALCULATION_ORDER:
        "상품 원가와 배송비를 먼저 환산한 뒤, 관세와 부가세를 추정하고 수수료, 마진, 할인, 반올림을 적용합니다.",
      EXCHANGE_RATE_BASIS: "이 데모는 실시간 환율이 아닌 고정 USD/KRW seed 환율을 사용합니다.",
      ROUNDING_POLICY: "권장 판매가는 100원 단위로 반올림합니다.",
    },
    availability: "판매 상태",
    breakdownCloseLabel: "가격 구성 닫기",
    breakdownOpenLabel: "가격 구성 보기",
    blockedTitle: "가격 계산이 차단되었습니다",
    brand: "브랜드",
    breakdownTitle: "가격 구성",
    calculated: "계산",
    dataMode: "데이터 모드",
    devCommand: "개발 명령",
    destinationMarket: "도착 시장",
    engineVersion: "엔진 버전",
    fixture: "Fixture",
    fixtureBacked: "Fixture 기반 결정적 결과",
    fixtureVersion: "Fixture version",
    headerDescription:
      "첫 end-to-end fixture 계산 결과입니다. 상품 원가, 배송비, 환율, 관세, 부가세, 수수료, 마진, 반올림 정책을 같은 입력에서 재현 가능하게 표시합니다.",
    item: "항목",
    integrationPath: "통합 경로",
    integrationTitle: "통합 상태",
    marketRouteNote: "ja와 zh는 언어 라우트이며, JP와 CN은 시장 코드로만 유지합니다.",
    policy: "정책",
    playwrightAdapterStatus: "UNIQLO US Playwright adapter는 maintainer 실행용으로 준비되어 있습니다.",
    productMetaTitle: "상품 메타",
    rate: "요율",
    rawPrice: "원본 가격",
    rawPriceDetail: "소스 fixture에서 추출한 표시값",
    recommendedPrice: "권장 판매가",
    normalizedPrice: "정규화 가격",
    normalizedPriceDetail: "가격 엔진이 사용하는 구조화된 값",
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
    componentNotes: {
      rounding: "100원 단위 반올림",
      tariff: "상품 카테고리 기반 추정치이며 공식 통관 판단이 아닙니다.",
      vat: "상품 원가, 배송비, 관세 추정액에 적용합니다.",
    },
    markets: {
      CN: "중국",
      JP: "일본",
      KR: "한국",
      US: "미국",
    },
    warningMessages: {
      CUSTOMS_ESTIMATE_ONLY:
        "관세와 부가세는 포트폴리오 데모용 추정치이며 공식 통관 또는 세무 자문이 아닙니다.",
      STALE_EXCHANGE_RATE: "이 계산에 사용한 환율 관측값이 오래되었습니다.",
    },
  },
  zh: {
    adapter: "适配器",
    assumptionsTitle: "假设",
    assumptionMessages: {
      CALCULATION_ORDER:
        "先换算商品成本和运费，再估算关税和VAT，然后应用手续费、利润、折扣和取整。",
      EXCHANGE_RATE_BASIS: "此演示使用固定 USD/KRW 种子汇率，不是实时外汇报价。",
      ROUNDING_POLICY: "建议售价取整到最接近的 100 KRW。",
    },
    availability: "可售状态",
    breakdownCloseLabel: "隐藏构成",
    breakdownOpenLabel: "查看构成",
    blockedTitle: "价格计算已阻止",
    brand: "品牌",
    breakdownTitle: "价格构成",
    calculated: "计算时间",
    dataMode: "数据模式",
    devCommand: "开发命令",
    destinationMarket: "目的市场",
    engineVersion: "引擎版本",
    fixture: "Fixture",
    fixtureBacked: "Fixture 驱动且确定",
    fixtureVersion: "Fixture 版本",
    headerDescription:
      "第一个端到端 fixture 计算结果。页面用可复现输入展示商品成本、运费、汇率、关税、VAT、手续费、利润和取整策略。",
    item: "项目",
    integrationPath: "集成路径",
    integrationTitle: "集成状态",
    marketRouteNote: "ja 和 zh 是语言路由；JP 和 CN 仍只作为市场代码。",
    policy: "策略",
    playwrightAdapterStatus: "UNIQLO US Playwright adapter is available for maintainer-run collection.",
    productMetaTitle: "商品元数据",
    rate: "费率",
    rawPrice: "原始价格",
    rawPriceDetail: "从来源 fixture 提取的显示值",
    recommendedPrice: "建议售价",
    normalizedPrice: "标准化价格",
    normalizedPriceDetail: "定价引擎使用的结构化数值",
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
    componentNotes: {
      rounding: "取整到最接近的 100 KRW",
      tariff: "基于商品类别的估算，不是官方海关裁定。",
      vat: "应用于商品成本、运费和关税估算。",
    },
    markets: englishMarkets,
    warningMessages: {
      CUSTOMS_ESTIMATE_ONLY:
        "关税和VAT是作品集演示估算，不是官方海关或税务建议。",
      STALE_EXCHANGE_RATE: "本次计算使用的汇率观测值已经过期。",
    },
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

export const themeMessages: Record<Locale, ThemeMessages> = {
  ar: {
    dark: "داكن",
    light: "فاتح",
    system: "النظام",
    title: "المظهر",
  },
  en: {
    dark: "Dark",
    light: "Light",
    system: "System",
    title: "Theme",
  },
  ja: {
    dark: "ダーク",
    light: "ライト",
    system: "システム",
    title: "テーマ",
  },
  ko: {
    dark: "다크",
    light: "라이트",
    system: "시스템",
    title: "테마",
  },
  zh: {
    dark: "深色",
    light: "浅色",
    system: "系统",
    title: "主题",
  },
};
