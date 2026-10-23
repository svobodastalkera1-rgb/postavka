import type { Supplier } from "./fixtures";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
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
