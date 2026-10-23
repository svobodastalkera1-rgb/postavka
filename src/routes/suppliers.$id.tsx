import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AUDIT, CONFLICTS, EVENTS, PIPELINE, STATUS_LABELS, getSupplier, totalScore } from "@/lib/fixtures";
import { Flags, NoData, StatusBadge } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { ArrowLeft, Ban, ExternalLink, Pencil, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/suppliers/$id")({
  loader: ({ params }) => { const s = getSupplier(params.id); if (!s) throw notFound(); return s; },
  head: ({ loaderData }) => meta(loaderData?.name ?? "Поставщик", "Профиль поставщика: условия, контакты, история и оценка."),
  component: Profile,
});

const soon = () => toast("Сохранение заработает на этапе 2");

function Profile() {
  const s = Route.useLoaderData();
  const events = EVENTS.filter((e) => e.supplierId === s.id);
  const conflicts = CONFLICTS.filter((c) => c.supplierId === s.id);
  const rows: [string, React.ReactNode][] = [
    ["Юридическое лицо", s.legalName], ["ИНН", s.inn], ["Сайт", s.website && <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">{s.website}</a>],
    ["Телефон", s.phone], ["Email", s.email], ["Адрес", s.address], ["Регионы работы", s.regions.join(", ")],
    ["Категории", s.categories.join(", ")], ["Минимальный заказ", s.minOrder], ["Доставка", s.delivery],
    ["Документы", s.documents.length ? s.documents.join("; ") : null], ["Дата обнаружения", s.discoveredAt], ["Последняя проверка", s.verifiedAt],
  ];
  const parts = [["Ассортимент", s.score.assortment, 30], ["Логистика", s.score.logistics, 20], ["Коммерческие условия", s.score.commercial, 20], ["Надёжность данных", s.score.reliability, 15], ["История сотрудничества", s.score.history, 15]] as const;

  return (
    <>
      <Link to="/suppliers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />К справочнику</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">{s.name}</h1><Flags s={s} /></div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><StatusBadge status={s.status} />{s.city}</div>
          {s.blacklisted && <div className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">В чёрном списке: {s.blacklisted.reason} · {s.blacklisted.author}, {s.blacklisted.date}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={soon}><Star className={s.favorite ? "fill-warning text-warning" : ""} />{s.favorite ? "В избранном" : "В избранное"}</Button>
          <Button variant="outline" onClick={soon}><ShieldCheck />Отметить проверенным</Button>
          <Button variant="outline" onClick={soon}><Ban />В чёрный список</Button>
          <Button onClick={soon}><Pencil />Редактировать</Button>
        </div>
      </div>

      {conflicts.map((c, i) => (
        <div key={i} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-warning-soft p-3 text-sm">
          <span>Предложено обновление «{c.field}»: <b>{c.verified}</b> → <b>{c.proposed}</b> (источник {c.source}, {c.date})</span>
          <span className="flex gap-2"><Button size="sm" variant="outline" onClick={soon}>Отклонить</Button><Button size="sm" onClick={soon}>Принять</Button></span>
        </div>
      ))}

      <div className="grid gap-6 lg:grid-cols-3">
        <Tabs defaultValue="info" className="lg:col-span-2">
          <TabsList><TabsTrigger value="info">Данные</TabsTrigger><TabsTrigger value="commerce">Коммерция</TabsTrigger><TabsTrigger value="contacts">Контакты</TabsTrigger><TabsTrigger value="timeline">Взаимодействия</TabsTrigger><TabsTrigger value="audit">Изменения</TabsTrigger></TabsList>
          <TabsContent value="info"><Card><CardContent className="divide-y pt-6">
            {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[11rem_1fr] gap-4 py-2.5 text-sm"><span className="text-muted-foreground">{k}</span><span><NoData value={v} /></span></div>)}
            <div className="grid grid-cols-[11rem_1fr] gap-4 py-2.5 text-sm"><span className="text-muted-foreground">Источники</span><span className="space-y-1">{s.sources.map((x) => <span key={x.url} className="flex items-center gap-1 text-muted-foreground">Демо-источник · {x.date}</span>)}</span></div>
          </CardContent></Card></TabsContent>
          <TabsContent value="commerce"><Card><CardContent className="space-y-4 pt-6 text-sm">
            <div><div className="mb-2 font-medium">Ассортимент</div><NoData value={s.assortment.length ? <ul className="list-disc pl-5">{s.assortment.map((a) => <li key={a}>{a}</li>)}</ul> : null} /></div>
            <div><div className="mb-2 font-medium">Цены и КП</div>{s.prices.length ? <table className="w-full"><tbody>{s.prices.map((p) => <tr key={p.item} className="border-t"><td className="py-2">{p.item}</td><td className="text-right font-mono">{p.price.toLocaleString("ru")} ₽ / {p.unit}</td></tr>)}</tbody></table> : <NoData value={null} />}</div>
            <Button variant="outline" size="sm" onClick={soon}>Добавить КП</Button>
          </CardContent></Card></TabsContent>
          <TabsContent value="contacts"><Card><CardContent className="space-y-3 pt-6 text-sm">
            {s.contacts.length ? s.contacts.map((c) => <div key={c.name} className="rounded-md border p-3"><div className="font-medium">{c.name}</div><div className="text-muted-foreground">{c.role}</div><div><NoData value={c.phone} /> · <NoData value={c.email} /></div></div>) : <NoData value={null} />}
            <Button variant="outline" size="sm" onClick={soon}>Добавить контакт</Button>
          </CardContent></Card></TabsContent>
          <TabsContent value="timeline"><Card><CardContent className="space-y-4 pt-6">
            <div className="flex gap-2"><Textarea placeholder="Звонок, письмо, договорённость…" /><Button onClick={soon}>Записать</Button></div>
            {events.length ? events.map((e) => <div key={e.id} className="border-l-2 border-primary pl-3 text-sm"><div className="text-xs text-muted-foreground">{e.date} · {e.type} · {e.author}</div>{e.text}</div>) : <p className="text-sm text-muted-foreground">Записей пока нет.</p>}
          </CardContent></Card></TabsContent>
          <TabsContent value="audit"><Card><CardContent className="pt-6 text-sm">
            <table className="w-full"><thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Поле</th><th>Было</th><th>Стало</th><th>Автор</th><th>Источник</th><th>Когда</th></tr></thead>
              <tbody>{AUDIT.map((a, i) => <tr key={i} className="border-t"><td className="py-2">{a.field}</td><td>{a.from}</td><td>{a.to}</td><td>{a.author}</td><td>{a.source}</td><td className="font-mono text-xs">{a.date}</td></tr>)}</tbody></table>
          </CardContent></Card></TabsContent>
        </Tabs>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Статус сотрудничества</CardTitle></CardHeader><CardContent>
            <Select defaultValue={s.status} onValueChange={soon}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {[...PIPELINE, "rejected", "ended"].map((x) => <SelectItem key={x} value={x}>{STATUS_LABELS[x as keyof typeof STATUS_LABELS]}</SelectItem>)}
            </SelectContent></Select>
            <div className="mt-4 flex gap-1">{PIPELINE.map((p, i) => <div key={p} title={STATUS_LABELS[p]} className={`h-1.5 flex-1 rounded-full ${i <= PIPELINE.indexOf(s.status) ? "bg-primary" : "bg-muted"}`} />)}</div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-baseline justify-between text-base">Оценка <span className="font-mono text-2xl">{totalScore(s)}</span></CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            {parts.map(([l, v, w]) => <div key={l}><div className="mb-1 flex justify-between"><span>{l} <span className="text-muted-foreground">· {w}%</span></span><span className="font-mono">{v ?? "—"}</span></div><Progress value={v ?? 0} /></div>)}
            {s.score.history === null && <p className="text-xs text-muted-foreground">Нет истории сотрудничества — её вес распределён между остальными критериями.</p>}
            <div className="flex justify-between border-t pt-3"><span className="text-muted-foreground">Достоверность данных</span><span className="font-mono">{s.confidence}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Внутренний рейтинг</span><span className="font-mono"><NoData value={s.rating} /></span></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Заметки</CardTitle></CardHeader><CardContent className="text-sm"><NoData value={s.notes} /></CardContent></Card>
        </div>
      </div>
    </>
  );
}
