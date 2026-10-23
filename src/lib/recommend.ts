import { totalScore, type Supplier } from "./fixtures";

export function recommend(items: Supplier[], query: string): Supplier[] {
  const terms = query.toLocaleLowerCase("ru").split(/\s+/).filter((term) => term.length > 2);
  if (!terms.length) return [];
  return items.filter((item) => !item.blacklisted && item.status !== "active" && !item.workedWith)
    .map((item) => {
      const text = [item.name, ...item.categories, ...item.assortment, item.city, ...item.regions].join(" ").toLocaleLowerCase("ru");
      return { item, matches: terms.filter((term) => text.includes(term)).length };
    })
    .filter(({ matches }) => matches > 0)
    .sort((a, b) => b.matches - a.matches || totalScore(b.item) - totalScore(a.item))
    .slice(0, 3).map(({ item }) => item);
}
