import type { Supplier } from "./fixtures";

const lower = (value: string) => value.toLocaleLowerCase("ru");
const digits = (value: string) => value.replace(/\D/g, "");

/** Higher values are more relevant; zero means that the query does not match. */
export function supplierSearchRank(s: Supplier, query: string): number {
  const q = lower(query.trim());
  if (!q) return 1;
  const contacts = s.contacts ?? [];
  const phoneQuery = digits(q);
  if (phoneQuery.length >= 4 && /^[\d\s()+-]+$/.test(q)) {
    if (digits(s.phone ?? "").includes(phoneQuery)) return 100;
    if (contacts.some((contact) => digits(contact.phone ?? "").includes(phoneQuery))) return 90;
    return digits(s.inn ?? "").includes(phoneQuery) ? 80 : 0;
  }
  const weighted: [string, number][] = [
    [s.name, 100], [s.legalName ?? "", 90], [s.inn ?? "", 85],
    [s.phone ?? "", 80], [s.email ?? "", 75],
    ...contacts.flatMap((contact): [string, number][] => [[contact.name, 75], [contact.role, 55], [contact.phone ?? "", 70], [contact.email ?? "", 70], [contact.details ?? "", 30]]),
    [s.city, 50], [s.address ?? "", 45], [s.website ?? "", 40],
    ...[...s.regions, ...s.categories, ...s.assortment, ...s.documents].map((value): [string, number] => [value, 40]),
    [s.minOrder ?? "", 30], [s.delivery ?? "", 30], [s.notes ?? "", 15],
  ];
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const term of terms) {
    const match = Math.max(0, ...weighted.filter(([value]) => lower(value).includes(term)).map(([, weight]) => weight));
    if (!match) return 0;
    score += match;
  }
  return score;
}
