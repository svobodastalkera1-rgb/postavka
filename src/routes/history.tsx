import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENTS, getSupplier } from "@/lib/fixtures";
import { PageHeader, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/history")({
  head: () => meta("История взаимодействий", "Общая лента событий по всем поставщикам компании."),
  component: History,
});

function History() {
  const [type, setType] = useState("all");
  const types = [...new Set(EVENTS.map((e) => e.type))];
  const list = EVENTS.filter((e) => type === "all" || e.type === type);
  return (
    <>
      <PageHeader title="История взаимодействий" description="Общая для всех сотрудников лента событий"
        actions={<Select value={type} onValueChange={setType}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Все события</SelectItem>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>} />
      <ol className="relative space-y-4 border-l pl-6">
        {list.map((e) => { const s = getSupplier(e.supplierId)!; return (
          <li key={e.id} className="relative rounded-lg border bg-card p-4">
            <span className="absolute -left-[1.85rem] top-5 size-3 rounded-full border-2 border-background bg-primary" />
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{e.type}</span><span className="font-mono">{e.date} · {e.author}</span></div>
            <div className="mt-1 text-sm"><SupplierLink s={s} /> — {e.text}</div>
          </li>); })}
      </ol>
    </>
  );
}
