import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPLIERS } from "@/lib/fixtures";
import { NoData, PageHeader, ScorePill, StatusBadge, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/favorites")({
  head: () => meta("Избранное", "Ваш личный список избранных поставщиков."),
  component: () => {
    const list = SUPPLIERS.filter((s) => s.favorite);
    return (
      <>
        <PageHeader title="Избранное" description="Личный список — его видите только вы." />
        {list.length === 0 ? <p className="text-muted-foreground">Пока пусто. Добавляйте поставщиков звёздочкой в профиле.</p> :
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((s) => <Card key={s.id}><CardContent className="space-y-2 pt-6">
            <div className="flex justify-between"><SupplierLink s={s} /><ScorePill s={s} /></div>
            <div className="text-sm text-muted-foreground">{s.categories.join(", ")} · {s.city}</div>
            <div className="text-sm">Мин. заказ: <NoData value={s.minOrder} /></div>
            <StatusBadge status={s.status} />
          </CardContent></Card>)}</div>}
      </>
    );
  },
});
