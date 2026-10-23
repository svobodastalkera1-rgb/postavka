import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { totalScore, type Supplier } from "@/lib/fixtures";
import { suppliers } from "@/lib/api-client";
import { NoData, PageHeader, Pending, StatusBadge } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>) => ({ ids: typeof s["ids"] === "string" ? s["ids"] : undefined }),
  head: () => meta("Сравнение поставщиков", "Сравнение 2–4 поставщиков по ключевым параметрам."),
  component: Compare,
});

type Row = [string, (s: Supplier) => React.ReactNode, (s: Supplier) => string];
const join = (a: string[]) => (a.length ? a.join(", ") : null);
const ROWS: Row[] = [
  ["Юрлицо", (s) => s.legalName, (s) => s.legalName ?? ""],
  ["Категории", (s) => s.categories.join(", "), (s) => s.categories.join()],
  ["Ассортимент", (s) => join(s.assortment), (s) => s.assortment.join()],
  ["Регион", (s) => s.regions.join(", "), (s) => s.regions.join()],
  ["Доставка", (s) => s.delivery, (s) => s.delivery ?? ""],
  ["Мин. заказ", (s) => s.minOrder, (s) => s.minOrder ?? ""],
  ["Цены", (s) => s.prices.length ? s.prices.map((p) => `${p.item}: ${p.price} ₽/${p.unit}`).join("; ") : null, (s) => JSON.stringify(s.prices)],
  ["Документы", (s) => join(s.documents), (s) => s.documents.join()],
  ["Рейтинг", (s) => s.rating, (s) => String(s.rating)],
  ["Оценка", (s) => <span className="font-mono">{totalScore(s)}</span>, (s) => String(totalScore(s))],
  ["Достоверность", (s) => `${s.confidence}%`, (s) => String(s.confidence)],
  ["Источники", (s) => s.sources.length ? s.sources.map((x) => <a key={x.url} href={x.url} target="_blank" rel="noreferrer" className="block text-primary underline">{x.url.replace(/^https?:\/\//, "").split("/")[0]} · {x.date}</a>) : null, (s) => s.sources.map((x) => x.url).join()],
  ["История", (s) => <StatusBadge status={s.status} />, (s) => s.status],
  ["Сильные стороны", (s) => [s.verified && "Проверен", s.hasDelivery && "Есть доставка", s.score.commercial >= 75 && "Хорошие условия"].filter(Boolean).join(", ") || null, () => ""],
  ["Слабые стороны", (s) => [!s.verified && "Не проверен", s.hasDelivery === null && "Нет данных о доставке", s.confidence < 60 && "Мало данных"].filter(Boolean).join(", ") || null, () => ""],
];

function Compare() {
  const { ids } = Route.useSearch();
  const [all, setAll] = useState<Supplier[]>([]);
  const [sel, setSel] = useState<string[]>(ids ? ids.split(",").slice(0, 4) : []);
  useEffect(() => { suppliers().then((data) => {
    setAll(data.items);
    if (!ids) setSel(data.items.slice(0, 2).map((item) => item.id));
  }).catch((error) => toast.error(error.message)); }, [ids]);
  const items = sel.map((id) => all.find((s) => s.id === id)).filter((s): s is Supplier => !!s);
  const rest = all.filter((s) => !sel.includes(s.id));
  const comparable = items.length >= 2 && items.every((s) => s.categories.some((category) => items[0]?.categories.includes(category)));
  const recommended = comparable ? [...items].sort((a, b) => totalScore(b) - totalScore(a))[0] : null;
  return (
    <>
      <PageHeader title="Сравнение поставщиков" description="Различия подсвечены. Несопоставимые цены не участвуют в рекомендации." />
      {items.length < 2 && <Pending>Выберите минимум двух поставщиков.</Pending>}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b">
              <th className="w-44 p-3 text-left align-bottom text-xs font-medium text-muted-foreground">Параметр</th>
              {items.map((s) => <th key={s.id} className="p-3 text-left align-top">
                <div className="flex items-start justify-between gap-2"><Link to="/suppliers/$id" params={{ id: s.id }} className="font-semibold hover:text-primary">{s.name}</Link>
                  <button onClick={() => setSel(sel.filter((x) => x !== s.id))} aria-label="Убрать" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button></div>
                <span className="text-xs font-normal text-muted-foreground">{s.sources.length ? `${s.sources.length} источник(ов)` : "Источник не указан"}</span>
              </th>)}
              {sel.length < 4 && <th className="w-52 p-3 align-top">
                <Select onValueChange={(v) => setSel([...sel, v])} value=""><SelectTrigger><SelectValue placeholder="+ Добавить" /></SelectTrigger>
                  <SelectContent>{rest.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></th>}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, render, key]) => {
              const diff = label !== "Цены" && new Set(items.map(key)).size > 1;
              return <tr key={label} className={`border-b ${diff ? "bg-diff" : ""}`}>
                <td className="p-3 text-xs font-medium text-muted-foreground">{label}</td>
                {items.map((s) => <td key={s.id} className="p-3 align-top"><NoData value={render(s)} /></td>)}
                {sel.length < 4 && <td />}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <Card className="mt-6"><CardContent className="space-y-2 pt-6 text-sm">
        <div className="flex items-center gap-2 font-medium">Рекомендация</div>
        {recommended ? <p>{recommended.name} — наибольшая оценка пригодности среди выбранных: {totalScore(recommended)} из 100. Основание: ассортимент, логистика, известные коммерческие условия и полнота карточки. Это не проверка надёжности; неизвестные цены и условия требуют запроса КП.</p>
          : <Pending>{items.length < 2 ? "Выберите минимум двух поставщиков." : "Выбраны разные группы товаров. Для рекомендации сравните поставщиков одной категории."}</Pending>}
      </CardContent></Card>
    </>
  );
}
