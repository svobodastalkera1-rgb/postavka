export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Supplier Intelligence` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Supplier Intelligence` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
