import { useCallback, useEffect, useState } from "react";
import { suppliers } from "./api-client";
import type { Supplier } from "./fixtures";

export function useSuppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems((await suppliers()).items);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { items, loading, error, reload };
}

