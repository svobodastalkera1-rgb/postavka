import { expect, test } from "vitest";
import { getSupplier } from "../lib/fixtures";
import { supplierSearchRank } from "../lib/supplier-search";
import { recommend } from "../lib/recommend";

test("поиск находит номер телефона и имя контактного лица", () => {
  const base = getSupplier("s1")!;
  const supplier = { ...base, phone: "+7 (343) 555-12-34", contacts: [{ name: "Мария Иванова", role: "Закупки", phone: "+7 912 123-45-67", email: "maria@example.test", details: "Лучше писать после обеда" }] };
  expect(supplierSearchRank(supplier, "5551234")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "+7 (912) 123-45-67")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "Мария Иванова")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "после обеда")).toBeGreaterThan(0);
  expect(supplierSearchRank(supplier, "несуществующее имя")).toBe(0);
});

test("подбор находит контакт по номеру и исключает действующих партнёров", () => {
  const base = getSupplier("s1")!;
  const candidate = { ...base, id: "candidate", status: "discovered" as const, workedWith: false, blacklisted: null, phone: "+7 (343) 555-12-34" };
  const partner = { ...candidate, id: "partner", status: "active" as const };
  expect(recommend([partner, candidate], "5551234").map((item) => item.id)).toEqual(["candidate"]);
});

