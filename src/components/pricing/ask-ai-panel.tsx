"use client";

import { Send, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

type AskAiPanelProps = {
  locale: Locale;
  labels: {
    answerLabel: string;
    errorLabel: string;
    helper: string;
    placeholder: string;
    submit: string;
    title: string;
  };
};

export function AskAiPanel({ labels, locale }: AskAiPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setIsLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("/api/ai/pricing-ask", {
        body: JSON.stringify({ locale, question: trimmedQuestion }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? labels.errorLabel);
      }

      setAnswer(payload.answer);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : labels.errorLabel,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="border-2 border-zinc-950 bg-white dark:border-zinc-100 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-100">
        <Sparkles className="h-4 w-4 text-teal-700 dark:text-teal-300" />
        <h2 className="text-base font-black">{labels.title}</h2>
      </div>
      <form className="grid gap-3 p-4" onSubmit={submitQuestion}>
        <textarea
          className="min-h-24 resize-y border-2 border-zinc-950 bg-zinc-50 p-3 text-sm leading-6 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 dark:border-zinc-100 dark:bg-zinc-950 dark:focus:bg-zinc-900"
          maxLength={800}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={labels.placeholder}
          value={question}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {labels.helper}
          </p>
          <Button disabled={isLoading || !question.trim()} type="submit">
            <Send className="h-4 w-4" />
            {isLoading ? "..." : labels.submit}
          </Button>
        </div>
      </form>
      {answer ? (
        <div className="border-t-2 border-zinc-950 p-4 text-sm leading-6 dark:border-zinc-100">
          <strong className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            {labels.answerLabel}
          </strong>
          <p className="mt-2 whitespace-pre-wrap">{answer}</p>
        </div>
      ) : null}
      {error ? (
        <div className="border-t-2 border-red-700 bg-red-50 p-4 text-sm leading-6 text-red-950 dark:border-red-300 dark:bg-red-950/40 dark:text-red-100">
          <strong className="text-xs uppercase">{labels.errorLabel}</strong>
          <p className="mt-2">{error}</p>
        </div>
      ) : null}
    </section>
  );
}
