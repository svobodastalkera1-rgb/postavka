import { expect, test } from "vitest";
import { CATALOG } from "../lib/catalog";

test("начальный каталог содержит 30+ различных организаций с источниками, без вымышленных адресов", () => {
  expect(CATALOG.length).toBeGreaterThanOrEqual(30);
  expect(new Set(CATALOG.map((item) => item.id)).size).toBe(CATALOG.length);
  for (const item of CATALOG) {
    expect(item.sources.length).toBeGreaterThan(0);
    expect(item.sources[0]!.url).toMatch(/^https?:\/\//);
    expect(item.sources[0]!.url).not.toContain("example.com");
    expect(item.prices).toEqual([]);
    expect(item.verified).toBe(false);
  }
});
