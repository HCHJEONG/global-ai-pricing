"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import type { Locale } from "@/lib/i18n";
import { themeMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ThemeMode = "system" | "light" | "dark";

const storageKey = "global-ai-pricing-theme";
const themeChangeEvent = "global-ai-pricing-theme-change";

const themeOptions: Array<{
  mode: ThemeMode;
  Icon: typeof Monitor;
}> = [
  { mode: "system", Icon: Monitor },
  { mode: "light", Icon: Sun },
  { mode: "dark", Icon: Moon },
];

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldUseDark);
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(storageKey);
  return isThemeMode(stored) ? stored : "system";
}

function getServerThemeSnapshot(): ThemeMode {
  return "system";
}

function subscribeToThemeChanges(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(themeChangeEvent, callback);
  media.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(themeChangeEvent, callback);
    media.removeEventListener("change", callback);
  };
}

export function ThemeControl({ locale }: { locale: Locale }) {
  const mode = useSyncExternalStore(
    subscribeToThemeChanges,
    readStoredTheme,
    getServerThemeSnapshot,
  );
  const messages = themeMessages[locale];

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function updateMode(nextMode: ThemeMode) {
    window.localStorage.setItem(storageKey, nextMode);
    applyTheme(nextMode);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <div
      aria-label={messages.title}
      className="inline-grid grid-cols-3 border-2 border-zinc-950 bg-white text-zinc-950 dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-50"
      role="radiogroup"
    >
      {themeOptions.map(({ mode: optionMode, Icon }) => {
        const selected = mode === optionMode;

        return (
          <button
            key={optionMode}
            aria-checked={selected}
            aria-label={`${messages.title}: ${messages[optionMode]}`}
            className={cn(
              "flex h-9 min-w-10 items-center justify-center border-e border-zinc-300 px-2 text-xs font-black last:border-e-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-zinc-700",
              selected &&
                "bg-teal-100 text-teal-950 dark:bg-teal-300 dark:text-zinc-950",
            )}
            onClick={() => updateMode(optionMode)}
            role="radio"
            title={`${messages.title}: ${messages[optionMode]}`}
            type="button"
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{messages[optionMode]}</span>
          </button>
        );
      })}
    </div>
  );
}
