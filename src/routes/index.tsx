import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENTS, SUPPLIERS, CONFLICTS, getSupplier } from "@/lib/fixtures";
import { PageHeader, Stat, StatusBadge, SupplierLink, ScorePill } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Globe, Sparkles, Clover, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => meta("Обзор", "Сводка по поставщикам, последние события и задачи отдела закупок."),
  component: Dashboard,
});

function Dashboard() {
  const active = SUPPLIERS.filter((s) => s.status === "active").length;
  const inWork = SUPPLIERS.filter((s) => ["contacted", "quote_requested", "quote_received", "negotiation"].includes(s.status)).length;
  const recent = [...SUPPLIERS].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt)).slice(0, 4);
  return (
    <>
      <PageHeader title="Обзор" description="Екатеринбург и Свердловская область"
        actions={<>
          <Button asChild variant="outline"><Link to="/discovery"><Globe />Найти в интернете</Link></Button>
          <Button asChild variant="outline"><Link to="/ai-search"><Sparkles />ИИ-поиск</Link></Button>
          <Button asChild><Link to="/lucky"><Clover />Мне повезёт!</Link></Button>
        </>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Поставщиков в базе" value={SUPPLIERS.length} />
        <Stat label="Активных" value={active} />
        <Stat label="В работе" value={inWork} hint="контакт, КП, переговоры" />
        <Stat label="Проверено" value={`${Math.round((SUPPLIERS.filter((s) => s.verified).length / SUPPLIERS.length) * 100)}%`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Недавно найденные</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <SupplierLink s={s} />
                  <div className="truncate text-xs text-muted-foreground">{s.categories.join(", ")} · {s.city}</div>
                </div>
                <div className="flex items-center gap-3"><StatusBadge status={s.status} /><ScorePill s={s} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4 text-warning" />Требуют проверки</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {CONFLICTS.map((c, i) => (
              <div key={i} className="rounded-md border bg-warning-soft/50 p-3">
                <div className="font-medium">{getSupplier(c.supplierId)?.name}</div>
                <div className="text-xs text-muted-foreground">{c.field}: проверено «{c.verified}», новое «{c.proposed}»</div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground">Проверенные данные не перезаписываются автоматически.</div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Последние события</CardTitle>
          <Button asChild variant="link" size="sm"><Link to="/history">Вся история</Link></Button></CardHeader>
        <CardContent className="divide-y">
          {EVENTS.slice(0, 5).map((e) => (
            <div key={e.id} className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 text-sm md:grid-cols-[9rem_10rem_1fr_9rem]">
              <span className="font-mono text-xs text-muted-foreground">{e.date}</span>
              <span className="hidden font-medium md:block">{e.type}</span>
              <span><span className="text-muted-foreground">{getSupplier(e.supplierId)?.name}: </span>{e.text}</span>
              <span className="hidden text-right text-xs text-muted-foreground md:block">{e.author}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
