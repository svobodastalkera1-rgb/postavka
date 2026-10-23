import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Supplier } from "@/lib/fixtures";
import { suppliers } from "@/lib/api-client";
import { NoData, PageHeader, ScorePill, StatusBadge } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/favorites")({
  head: () => meta("Избранное", "Ваш личный список избранных поставщиков."),
  component: () => {
    const [items, setItems] = useState<Supplier[]>([]);
    useEffect(() => { suppliers().then((result) => setItems(result.items)); }, []);
    const list = items.filter((s) => s.favorite);
    return (
      <>
        <PageHeader title="Избранное" description="Отмеченные в общем каталоге поставщики." />
        {list.length === 0 ? <p className="text-muted-foreground">Пока пусто. Добавляйте поставщиков звёздочкой в профиле.</p> :
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((s) => <Link key={s.id} to="/suppliers/$id" params={{ id: s.id }} className="card-link" aria-label={`Открыть карточку ${s.name}`}><Card className="h-full"><CardContent className="space-y-2 pt-6">
            <div className="flex justify-between"><span className="font-medium text-foreground">{s.name}</span><ScorePill s={s} /></div>
            <div className="text-sm text-muted-foreground">{s.categories.join(", ")} · {s.city}</div>
            <div className="text-sm">Мин. заказ: <NoData value={s.minOrder} /></div>
            <StatusBadge status={s.status} />
          </CardContent></Card></Link>)}</div>}
      </>
    );
  },
});
