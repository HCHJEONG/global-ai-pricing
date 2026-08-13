export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="border-b-2 border-zinc-950 pb-5 dark:border-zinc-100">
          <p className="mb-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
            GLOBAL AI PRICING
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
            결정론적 가격 계산과 AI 보조 운영을 위한 시작점
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
            이 앱은 글로벌 패션 커머스의 상품 가격을 환율, 세금, 관세,
            배송비, 마진 정책으로 계산하고 AI는 검증된 도구만 호출하도록
            설계합니다.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["앱 기반", "Next.js App Router, TypeScript strict, Tailwind CSS"],
            ["가격 원칙", "같은 입력과 정책 버전은 같은 계산 결과"],
            ["AI 경계", "text-to-SQL이 아닌 검증된 tool calling"],
          ].map(([title, body]) => (
            <div
              key={title}
              className="border-2 border-zinc-950 bg-white p-4 shadow-[4px_4px_0_0_#0f766e] dark:border-zinc-100 dark:bg-zinc-900"
            >
              <h2 className="text-sm font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {body}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
          <div className="border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
            <h2 className="text-base font-bold">Unit 0-1 상태</h2>
          </div>
          <dl className="grid divide-y divide-zinc-200 text-sm dark:divide-zinc-800 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-4">
              <dt className="font-semibold">패키지 매니저</dt>
              <dd className="mt-1 text-zinc-700 dark:text-zinc-300">pnpm</dd>
            </div>
            <div className="p-4">
              <dt className="font-semibold">기본 언어</dt>
              <dd className="mt-1 text-zinc-700 dark:text-zinc-300">한국어</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
