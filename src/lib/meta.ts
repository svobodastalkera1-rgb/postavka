export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Поставка` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Поставка` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: `${title} — Поставка` },
    { name: "twitter:description", content: description },
  ],
});
