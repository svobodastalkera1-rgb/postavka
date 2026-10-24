import { expect, test } from "vitest";
import { getSupplier } from "../lib/fixtures";
import { supplierSearchRank } from "../lib/supplier-search";

test("поиск находит номер телефона и имя контактного лица", () => {
  const base = getSupplier("s1")!;
  const supplier = { ...base, phone: "+7 (343) 555-12-34", contacts: [{ name: "Мария Иванова", role: "Закупки", phone: "+7 912 123-45-67", email: "maria@example.test" }] };
  expect(supplierSearchRank(supplier, "5551234")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "+7 (912) 123-45-67")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "Мария Иванова")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "несуществующее имя")).toBe(0);
});
