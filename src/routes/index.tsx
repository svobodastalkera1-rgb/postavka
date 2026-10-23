import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Supplier } from "@/lib/fixtures";
import { suppliers } from "@/lib/api-client";
import { PageHeader, Stat, StatusBadge, ScorePill } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Globe, Clover } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => meta("Обзор", "Сводка по поставщикам, последние события и задачи отдела закупок."),
  component: Dashboard,
});

function Dashboard() {
  const [items, setItems] = useState<Supplier[]>([]);
  useEffect(() => { suppliers().then((result) => setItems(result.items)); }, []);
  const active = items.filter((s) => s.status === "active").length;
  const inWork = items.filter((s) => ["contacted", "quote_requested", "quote_received", "negotiation"].includes(s.status)).length;
  const recent = [...items].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt)).slice(0, 4);
  return (
    <>
      <PageHeader title="Обзор" description="Екатеринбург и Свердловская область"
        actions={<>
          <Button asChild variant="outline"><Link to="/suppliers"><Globe />Открыть каталог</Link></Button>

          <Button asChild><Link to="/lucky"><Clover />Подбор поставщиков</Link></Button>
        </>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Поставщиков в базе" value={items.length} />
        <Stat label="Активных" value={active} />
        <Stat label="В работе" value={inWork} hint="контакт, КП, переговоры" />
        <Stat label="Подтверждено сотрудниками" value={`${items.length ? Math.round(items.filter((s) => s.verified).length / items.length * 100) : 0}%`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Недавно найденные</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {recent.map((s) => (
              <Link key={s.id} to="/suppliers/$id" params={{ id: s.id }} className="supplier-tile flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-3" aria-label={`Открыть карточку ${s.name}`}>
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <div className="truncate text-xs text-muted-foreground">{s.categories.join(", ")} · {s.city}</div>
                </div>
                <div className="flex items-center gap-3"><StatusBadge status={s.status} /><ScorePill s={s} /></div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-base">Требуют проверки</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">{items.filter((s) => !s.verified).slice(0, 5).map((s) => <Link key={s.id} to="/suppliers/$id" params={{ id: s.id }} className="supplier-tile block rounded-md border p-3" aria-label={`Открыть карточку ${s.name}`}><span className="font-medium text-foreground">{s.name}</span><div className="text-xs text-muted-foreground">{s.sources.length} источник(ов) · сведения не подтверждены сотрудником</div></Link>)}</CardContent></Card>
      </div>
    </>
  );
}
