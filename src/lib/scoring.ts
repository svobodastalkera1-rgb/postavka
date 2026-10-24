import type { Supplier } from "./fixtures";

const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function calculatedConfidence(s: Supplier): number {
  const known = [s.website, s.phone, s.email, s.address, s.inn, s.delivery, s.minOrder].filter(Boolean).length;
  return cap(known * 10 + Math.min(s.sources.length, 2) * 10 + (s.verified ? 10 : 0));
}

// Оценка пригодности для закупки, а не независимая оценка надёжности компании.
export function recalculate(s: Supplier): Supplier {
  const assortment = cap(Math.min(s.assortment.length, 5) * 15 + (s.categories.length ? 25 : 0));
  const logistics = cap((s.city === "Екатеринбург" ? 35 : s.regions.includes("Свердловская область") ? 20 : 0) + (s.hasDelivery === true ? 45 : s.hasDelivery === false ? 0 : 10) + (s.delivery ? 20 : 0));
  const commercial = cap((s.minOrderRub !== null || s.minOrder ? 35 : 0) + (s.prices.length ? 35 : 0) + (s.delivery ? 15 : 0) + (s.notes ? 15 : 0));
  const confidence = s.confidenceOverride ? cap(s.confidenceOverride.value) : calculatedConfidence(s);
  const reliability = cap(confidence * 0.7 + (s.verified ? 30 : 0));
  const history = s.workedWith ? (s.status === "ended" || s.blacklisted ? 20 : 75) : null;
  return { ...s, confidence, score: { assortment, logistics, commercial, reliability, history } };
}
