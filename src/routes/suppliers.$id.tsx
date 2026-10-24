import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PIPELINE, STATUS_LABELS, totalScore, type Supplier } from "@/lib/fixtures";
import { Flags, NoData, StatusBadge } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { ArrowLeft, Ban, ExternalLink, Pencil, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { request, supplier as loadSupplier, updateSupplier } from "@/lib/api-client";
import { SupplierEditor, type EditorSection } from "@/components/app/SupplierEditor";
import { calculatedConfidence } from "@/lib/scoring";
import type { Change, Interaction, Proposal } from "@/lib/store.server";

const FIELD_LABELS: Record<string, string> = { name: "Название", legalName: "Юридическое лицо", inn: "ИНН", website: "Сайт", phone: "Телефон", email: "Email", address: "Адрес", city: "Город", regions: "Регионы", group: "Группа", categories: "Категории", assortment: "Ассортимент", prices: "Цены", minOrder: "Минимальный заказ", minOrderRub: "Минимальный заказ, ₽", delivery: "Доставка", hasDelivery: "Есть доставка", documents: "Документы", rating: "Внутренний рейтинг", confidenceOverride: "Ручная достоверность", status: "Статус", blacklisted: "Чёрный список", favorite: "Избранное", verified: "Подтверждено", workedWith: "Работали ранее", contacts: "Контакты", notes: "Заметки", discoveredAt: "Дата обнаружения", verifiedAt: "Дата актуальности", sources: "Источники" };
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join("; ") : "—";
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}: ${formatValue(item)}`).join("; ");
  return String(value);
}

export const Route = createFileRoute("/suppliers/$id")({
  head: () => meta("Поставщик", "Профиль поставщика: условия, контакты, история и оценка."),
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const [s, setSupplier] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState<EditorSection | null>(null);
  const [events, setEvents] = useState<Interaction[]>([]);
  const [audit, setAudit] = useState<Change[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [entry, setEntry] = useState("");
  useEffect(() => {
    setSupplier(null);
    loadSupplier(id).then(setSupplier).catch((error) => toast.error(error.message));
    request<Interaction[]>(`/suppliers/${id}/interactions`).then(setEvents).catch(() => {});
    request<Change[]>(`/suppliers/${id}/changes`).then(setAudit).catch(() => {});
    request<Proposal[]>(`/suppliers/${id}/proposals`).then(setProposals).catch(() => {});
  }, [id]);
  const save = async (data: Record<string, unknown>) => {
    if (!s) return;
    try { setSupplier(await updateSupplier(s.id, data)); toast.success("Изменения сохранены"); }
    catch (error) { toast.error((error as Error).message); }
  };
  const addEvent = async () => {
    if (!s) return;
    try { const event = await request<Interaction>(`/suppliers/${s.id}/interactions`, { method: "POST", body: JSON.stringify({ type: "Заметка", text: entry }) }); setEvents((all) => [event, ...all]); setEntry(""); toast.success("Запись добавлена"); }
    catch (error) { toast.error((error as Error).message); }
  };
  const resolve = async (proposal: Proposal, action: "accept" | "reject") => {
    try { setSupplier(await request<Supplier>(`/suppliers/${id}/proposals/${proposal.id}/${action}`, { method: "POST" })); setProposals((all) => all.filter((item) => item.id !== proposal.id)); toast.success(action === "accept" ? "Обновление принято" : "Обновление отклонено"); }
    catch (error) { toast.error((error as Error).message); }
  };
  if (!s) return <p>Загружаем карточку поставщика…</p>;
  const rows: [string, React.ReactNode][] = [
    ["Юридическое лицо", s.legalName], ["ИНН", s.inn], ["Сайт", s.website && <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">{s.website}</a>],
    ["Адрес", s.address], ["Регионы работы", s.regions.join(", ")],
    ["Категории", s.categories.join(", ")],
    ["Основной телефон", s.phone], ["Основной email", s.email],
    ["Контактные лица", s.contacts.length ? <div className="space-y-2">{s.contacts.map((contact, index) => <div key={`${contact.name}-${index}`} className="rounded-md border p-2"><div className="font-medium">{contact.name}</div><div>{[contact.role, contact.phone, contact.email].filter(Boolean).join(" · ")}</div>{contact.details && <div className="whitespace-pre-wrap text-muted-foreground">{contact.details}</div>}</div>)}</div> : null],
    ["Ассортимент", s.assortment.length ? s.assortment.join("; ") : null],
    ["Цены", s.prices.length ? s.prices.map((price) => `${price.item}: ${price.price.toLocaleString("ru")} ₽ / ${price.unit}`).join("; ") : null],
    ["Минимальный заказ", s.minOrder], ["Минимальный заказ, ₽", s.minOrderRub !== null ? `${s.minOrderRub.toLocaleString("ru")} ₽` : null],
    ["Доставка", s.delivery], ["Наличие доставки", s.hasDelivery === null ? null : s.hasDelivery ? "Да" : "Нет"], ["Внутренние заметки", s.notes],
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
          <Button variant="outline" onClick={() => save({ favorite: !s.favorite })}><Star className={s.favorite ? "fill-warning text-warning" : ""} />{s.favorite ? "В избранном" : "В избранное"}</Button>
          <Button variant="outline" onClick={() => save({ verified: !s.verified, verifiedAt: !s.verified ? new Date().toISOString().slice(0, 10) : null })}><ShieldCheck />{s.verified ? "Снять подтверждение" : "Отметить проверенным"}</Button>
          <Button variant="outline" onClick={() => save({ blacklisted: s.blacklisted ? null : { reason: "Добавлен сотрудником", author: "Сотрудник", date: new Date().toISOString().slice(0, 10) } })}><Ban />{s.blacklisted ? "Убрать из чёрного списка" : "В чёрный список"}</Button>
          <Button onClick={() => setEditing("info")}><Pencil />Редактировать данные</Button>
        </div>
      </div>

      {proposals.map((proposal) => (
        <div key={proposal.id} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-warning-soft p-3 text-sm">
          <span>Предложено обновление «{FIELD_LABELS[proposal.field] ?? proposal.field}»: <b>{formatValue(s[proposal.field as keyof Supplier])}</b> → <b>{formatValue(proposal.proposed)}</b> (источник {proposal.source}, {proposal.createdAt})</span>
          <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => resolve(proposal, "reject")}>Отклонить</Button><Button size="sm" onClick={() => resolve(proposal, "accept")}>Принять</Button></span>
        </div>
      ))}

      <div className="grid gap-6 lg:grid-cols-3">
        <Tabs defaultValue="info" className="lg:col-span-2">
          <TabsList><TabsTrigger value="info">Данные</TabsTrigger><TabsTrigger value="commerce">Коммерция</TabsTrigger><TabsTrigger value="contacts">Контакты</TabsTrigger><TabsTrigger value="timeline">Взаимодействия</TabsTrigger><TabsTrigger value="audit">Изменения</TabsTrigger></TabsList>
          <TabsContent value="info"><Card><CardContent className="divide-y pt-6">
            {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[minmax(7rem,11rem)_1fr] gap-4 py-2.5 text-sm"><span className="text-muted-foreground">{k}</span><span className="break-words"><NoData value={v} /></span></div>)}
            <div className="grid grid-cols-[11rem_1fr] gap-4 py-2.5 text-sm"><span className="text-muted-foreground">Источники</span><span className="space-y-1">{s.sources.length ? s.sources.map((x) => <span key={x.url} className="flex items-center gap-1 text-muted-foreground"><a href={x.url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">{x.url}</a> · {x.date}</span>) : <NoData value={null} />}</span></div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditing("info")}>Редактировать данные</Button>
          </CardContent></Card></TabsContent>
          <TabsContent value="commerce"><Card><CardContent className="space-y-4 pt-6 text-sm">
            <div><div className="mb-2 font-medium">Минимальный заказ</div><NoData value={s.minOrder ?? (s.minOrderRub !== null ? `${s.minOrderRub.toLocaleString("ru")} ₽` : null)} /></div>
            <div><div className="mb-2 font-medium">Доставка</div><NoData value={s.delivery} /></div>
            <div><div className="mb-2 font-medium">Ассортимент</div><NoData value={s.assortment.length ? <ul className="list-disc pl-5">{s.assortment.map((a) => <li key={a}>{a}</li>)}</ul> : null} /></div>
            <div><div className="mb-2 font-medium">Цены и КП</div>{s.prices.length ? <table className="w-full"><tbody>{s.prices.map((p) => <tr key={p.item} className="border-t"><td className="py-2">{p.item}</td><td className="text-right font-mono">{p.price.toLocaleString("ru")} ₽ / {p.unit}</td></tr>)}</tbody></table> : <NoData value={null} />}</div>
            <Button variant="outline" size="sm" onClick={() => setEditing("commerce")}>Редактировать условия</Button>
          </CardContent></Card></TabsContent>
          <TabsContent value="contacts"><Card><CardContent className="space-y-3 pt-6 text-sm">
            <div><span className="text-muted-foreground">Основной телефон:</span> <NoData value={s.phone} /></div>
            <div><span className="text-muted-foreground">Основной email:</span> <NoData value={s.email} /></div>
            {s.contacts.length ? s.contacts.map((c, index) => <div key={`${c.name}-${index}`} className="glass-card space-y-2 rounded-lg border p-4"><div className="font-medium">{c.name}</div><div className="text-muted-foreground"><NoData value={c.role} /></div><div className="grid gap-1 sm:grid-cols-2"><div><span className="text-muted-foreground">Телефон: </span><NoData value={c.phone} /></div><div><span className="text-muted-foreground">Email: </span><NoData value={c.email} /></div></div>{c.details && <p className="whitespace-pre-wrap border-t pt-2">{c.details}</p>}</div>) : <NoData value={null} />}
            <Button variant="outline" size="sm" onClick={() => setEditing("contacts")}>Редактировать контакты</Button>
          </CardContent></Card></TabsContent>
          <TabsContent value="timeline"><Card><CardContent className="space-y-4 pt-6">
            <div className="flex gap-2"><Textarea placeholder="Звонок, письмо, договорённость…" value={entry} onChange={(e) => setEntry(e.target.value)} /><Button onClick={addEvent} disabled={!entry.trim()}>Записать</Button></div>
            {events.length ? events.map((e) => <div key={e.id} className="border-l-2 border-primary pl-3 text-sm"><div className="text-xs text-muted-foreground">{e.createdAt} · {e.type} · {e.author}</div>{e.text}</div>) : <p className="text-sm text-muted-foreground">Записей пока нет.</p>}
          </CardContent></Card></TabsContent>
          <TabsContent value="audit"><Card><CardContent className="pt-6 text-sm">
            <table className="w-full"><thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Поле</th><th>Было</th><th>Стало</th><th>Автор</th><th>Источник</th><th>Подтверждение</th><th>Когда</th></tr></thead>
              <tbody>{audit.map((a) => <tr key={a.id} className="border-t"><td className="py-2">{FIELD_LABELS[a.field] ?? a.field}</td><td>{formatValue(a.before)}</td><td>{formatValue(a.after)}</td><td>{a.author}</td><td>{a.source === "employee" ? "Сотрудник" : a.source} · {a.method === "manual" ? "вручную" : a.method}</td><td>{a.confirmation === "confirmed" ? "Подтверждено" : "Не подтверждено"}</td><td className="font-mono text-xs">{a.changedAt}</td></tr>)}</tbody></table>
          </CardContent></Card></TabsContent>
        </Tabs>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Статус сотрудничества</CardTitle></CardHeader><CardContent>
            <Select value={s.status} onValueChange={(status) => save({ status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {[...PIPELINE, "rejected", "ended"].map((x) => <SelectItem key={x} value={x}>{STATUS_LABELS[x as keyof typeof STATUS_LABELS]}</SelectItem>)}
            </SelectContent></Select>
            <div className="mt-4 flex gap-1">{PIPELINE.map((p, i) => <div key={p} title={STATUS_LABELS[p]} className={`h-1.5 flex-1 rounded-full ${i <= PIPELINE.indexOf(s.status) ? "bg-primary" : "bg-muted"}`} />)}</div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-baseline justify-between text-base">Оценка <span className="font-mono text-2xl">{totalScore(s)}</span></CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            {parts.map(([l, v, w]) => <div key={l}><div className="mb-1 flex justify-between"><span>{l} <span className="text-muted-foreground">· {w}%</span></span><span className="font-mono">{v ?? "—"}</span></div><Progress value={v ?? 0} /></div>)}
            {s.score.history === null && <p className="text-xs text-muted-foreground">Нет истории сотрудничества — её вес распределён между остальными критериями.</p>}
            <div className="flex justify-between border-t pt-3"><span className="text-muted-foreground">Достоверность данных</span><span className="font-mono">{s.confidence}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Внутренний рейтинг</span><span className="font-mono"><NoData value={s.rating} /></span></div>
            <details className="rounded-md border p-3 text-xs"><summary className="cursor-pointer font-medium">Как рассчитывается оценка</summary>
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>Оценка пригодности для закупки (0–100), не независимая оценка надёжности компании. Веса: ассортимент 30%, логистика 20%, коммерческие условия 20%, надёжность данных 15%, история 15%. Если истории нет, её вес пропорционально распределяется между остальными критериями.</p>
                <p>Достоверность данных: по 10 баллов за сайт, телефон, email, адрес, ИНН, условия доставки и минимальный заказ; по 10 за каждый из первых двух источников; ещё 10 за подтверждение сотрудником. Максимум 100. Сейчас автоматический расчёт: {calculatedConfidence(s)}%.</p>
                <p>Надёжность данных = 70% достоверности + 30 баллов при подтверждении сотрудником. Показатель пересчитывается после правки карточки; сам по себе со временем не меняется.</p>
                <p>Внутренний рейтинг 0–5 задаётся вручную и в общую оценку не входит. Достоверность можно переопределить вручную с обязательной причиной; отмена переопределения возвращает автоматический расчёт.</p>
              </div>
            </details>
            {s.confidenceOverride && <p className="text-xs text-warning">Достоверность задана вручную: {s.confidenceOverride.value}%. Причина: {s.confidenceOverride.reason}</p>}
            <Button variant="outline" size="sm" onClick={() => setEditing("score")}>Редактировать оценку</Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Заметки</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><NoData value={s.notes} /></div><Button variant="outline" size="sm" onClick={() => setEditing("notes")}>Редактировать заметки</Button></CardContent></Card>
        </div>
      </div>
      <SupplierEditor supplier={s} section={editing} onOpenChange={(open) => { if (!open) setEditing(null); }} onSaved={(updated) => { setSupplier(updated); request<Change[]>(`/suppliers/${s.id}/changes`).then(setAudit).catch(() => {}); }} />
    </>
  );
}
