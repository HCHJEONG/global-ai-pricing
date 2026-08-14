import { AuditHistoryPanel } from "@/components/audit/audit-history-panel";
import { ThemeControl } from "@/components/theme/theme-control";
import { bootstrapDatabase } from "@/infrastructure/db/bootstrap";
import { createDatabaseClient, createSqliteConnection } from "@/infrastructure/db/client";
import { DrizzleAuditLogRepository } from "@/infrastructure/db/repositories/audit-log-repository";
import { auditMessages, getLocaleDirection, resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type AuditLogsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AuditLogsPage({ params }: AuditLogsPageProps) {
  const { locale: requestedLocale } = await params;
  const locale = resolveLocale(requestedLocale);
  const messages = auditMessages[locale];
  const sqlite = createSqliteConnection();
  const db = createDatabaseClient(sqlite);

  try {
    await bootstrapDatabase(db);
    const repository = new DrizzleAuditLogRepository(db);
    const logs = await repository.findRecent({ limit: 100 });

    return (
      <main
        dir={getLocaleDirection(locale)}
        className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <header className="border-b-2 border-zinc-950 pb-5 dark:border-zinc-100">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold uppercase">
              <div className="flex flex-wrap items-center gap-2">
              <span className="border-2 border-zinc-950 bg-teal-100 px-2 py-1 text-teal-950 dark:border-zinc-100 dark:bg-teal-300 dark:text-zinc-950">
                Global AI Pricing
              </span>
              <span className="border border-zinc-400 px-2 py-1 dark:border-zinc-600">
                {messages.auditLogsTitle}
              </span>
              </div>
              <ThemeControl locale={locale} />
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              {messages.auditLogsTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {messages.headerDescription}
            </p>
          </header>

          <AuditHistoryPanel
            locale={locale}
            logs={logs}
            title={messages.auditLogsTitle}
          />
        </div>
      </main>
    );
  } finally {
    sqlite.close();
  }
}
