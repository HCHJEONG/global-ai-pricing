import { describe, expect, it } from "vitest";

import { getLocaleDirection, isLocale, locales, resolveLocale } from "./i18n";

describe("i18n locale shell", () => {
  it("supports the five language routes", () => {
    expect(locales).toEqual(["ko", "en", "ja", "zh", "ar"]);
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("zh")).toBe(true);
  });

  it("keeps market codes separate from language routes", () => {
    expect(isLocale("jp")).toBe(false);
    expect(isLocale("cn")).toBe(false);
    expect(isLocale("JP")).toBe(false);
    expect(isLocale("CN")).toBe(false);
  });

  it("falls back to Korean and sets Arabic RTL", () => {
    expect(resolveLocale("jp")).toBe("ko");
    expect(getLocaleDirection("ko")).toBe("ltr");
    expect(getLocaleDirection("ar")).toBe("rtl");
  });
});
