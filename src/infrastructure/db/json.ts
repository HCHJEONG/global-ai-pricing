const bigintMarker = "__globalAiPricingBigInt";

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === "bigint") {
      return { [bigintMarker]: nestedValue.toString() };
    }

    return nestedValue;
  });
}

export function parseJson<T>(value: string): T {
  return JSON.parse(value, (_key, nestedValue) => {
    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      typeof nestedValue[bigintMarker] === "string"
    ) {
      return BigInt(nestedValue[bigintMarker]);
    }

    return nestedValue;
  }) as T;
}
