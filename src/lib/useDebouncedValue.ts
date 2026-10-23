"use client";

import { useEffect, useState } from "react";

/**
 * Mengembalikan nilai yang "tertunda" beberapa milidetik setelah input berhenti berubah.
 * Dipakai supaya pencarian tidak mengirim request di setiap ketikan.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
