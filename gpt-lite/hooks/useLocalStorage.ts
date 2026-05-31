"use client";

import * as React from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch (error) {
      console.warn("Failed to read localStorage", error);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  const setStoredValue = React.useCallback(
    (nextValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof nextValue === "function"
            ? (nextValue as (prevValue: T) => T)(prev)
            : nextValue;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch (error) {
          console.warn("Failed to write localStorage", error);
        }
        return resolved;
      });
    },
    [key]
  );

  return { value, setValue: setStoredValue, hydrated };
}
