import type { Supplier } from "./fixtures";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, signal: controller.signal, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch (error) {
    if (controller.signal.aborted && !init?.signal?.aborted) throw new Error("Сервер не ответил вовремя. Проверьте соединение и повторите попытку.");
    if (init?.signal?.aborted) throw error;
    throw new Error("Не удалось связаться с сервером. Повторите попытку позже.");
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || `Ошибка HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const suppliers = () => request<{ items: Supplier[]; total: number }>("/suppliers?limit=100");
export const supplier = (id: string) => request<Supplier>(`/suppliers/${encodeURIComponent(id)}`);
export const updateSupplier = (id: string, data: Record<string, unknown>) => request<Supplier>(`/suppliers/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const createSupplier = (data: Record<string, unknown>) => request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(data) });

