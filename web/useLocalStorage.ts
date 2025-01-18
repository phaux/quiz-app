import { useEffect, useState } from "react";

export function useLocalStorage(key: string, defaultValue?: string) {
  const [value, setValue] = useState(
    () => window.localStorage.getItem(key) ?? defaultValue ?? null
  );

  useEffect(() => {
    if (value != null) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [key, value]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        setValue(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [key]);

  return [value, setValue] as const;
}
