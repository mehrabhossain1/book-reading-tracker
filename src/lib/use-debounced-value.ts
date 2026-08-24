"use client";

import { useEffect, useState } from "react";

/**
 * Trails `value` by `delay` ms of quiet.
 *
 * Search-as-you-type otherwise fires a request per keystroke; debouncing the
 * *value* rather than the request keeps the input itself perfectly responsive,
 * because the field stays fully controlled and only the derived query lags.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
