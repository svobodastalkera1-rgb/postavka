import { totalScore, type Supplier } from "./fixtures";
import { supplierSearchRank } from "./supplier-search";

export function recommend(items: Supplier[], query: string): Supplier[] {
  if (!query.trim()) return [];
  return items.filter((item) => !item.blacklisted && item.status !== "active" && !item.workedWith)
    .map((item) => ({ item, rank: supplierSearchRank(item, query) }))
    .filter(({ rank }) => rank > 0)
    .sort((a, b) => b.rank - a.rank || totalScore(b.item) - totalScore(a.item))
    .slice(0, 3).map(({ item }) => item);
}

