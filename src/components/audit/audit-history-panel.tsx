import { FileClock } from "lucide-react";

import type { AuditLogRecord } from "@/application/audit";
import type { Locale } from "@/lib/i18n";
import { auditMessages } from "@/lib/i18n";

type AuditHistoryPanelProps = {
  logs: AuditLogRecord[];
  locale: Locale;
  title?: string;
};

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stringifyValue(value: unknown): string {
  if (value === undefined) {
    return "-";
  }

  return JSON.stringify(
    value,
    (_key, nestedValue) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue,
    2,
  );
}

function ValueBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words border border-zinc-300 bg-zinc-50 p-2 font-mono text-[11px] leading-5 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
        {stringifyValue(value)}
      </pre>
    </div>
  );
}

export function AuditHistoryPanel({
  logs,
  locale,
  title,
}: AuditHistoryPanelProps) {
  const messages = auditMessages[locale];

  return (
    <section className="overflow-hidden border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
        <FileClock className="h-4 w-4 text-teal-700 dark:text-teal-300" />
        <h2 className="text-base font-black">{title ?? messages.historyTitle}</h2>
      </div>

      {logs.length === 0 ? (
        <div className="p-5">
          <p className="text-sm font-bold">{messages.emptyTitle}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {messages.emptyDescription}
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {logs.map((log) => (
            <li key={log.id} className="grid gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-black text-teal-700 dark:text-teal-300">
                    {log.action}
                  </div>
                  <div className="mt-1 break-all text-xs text-zinc-600 dark:text-zinc-300">
                    {messages.target}: {log.targetType}/{log.targetId}
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  {formatDateTime(log.occurredAt, locale)}
                </div>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                    {messages.actor}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs">
                    {log.actorId ?? "system"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                    {messages.targetType}
                  </dt>
                  <dd className="mt-1 font-mono text-xs">{log.targetType}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                    {messages.targetId}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs">{log.targetId}</dd>
                </div>
              </dl>

              <div className="grid gap-3 lg:grid-cols-3">
                <ValueBlock label={messages.before} value={log.before} />
                <ValueBlock label={messages.after} value={log.after} />
                <ValueBlock label={messages.metadata} value={log.metadata} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
