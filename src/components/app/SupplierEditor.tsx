import { useEffect, useState } from "react";
import type { Supplier } from "@/lib/fixtures";
import { updateSupplier } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export type EditorSection = "info" | "commerce" | "contacts" | "notes" | "score";
const titles: Record<EditorSection, string> = {
  info: "Основные данные", commerce: "Коммерческие условия", contacts: "Контакты", notes: "Заметки", score: "Оценка и подтверждение",
};
const fields: Record<EditorSection, (keyof Supplier)[]> = {
  info: ["name", "legalName", "inn", "website", "address", "city", "regions", "categories", "documents", "sources"],
  commerce: ["assortment", "prices", "minOrder", "minOrderRub", "delivery", "hasDelivery"],
  contacts: ["phone", "email", "contacts"],
  notes: ["notes"],
  score: ["rating", "verified", "verifiedAt", "workedWith", "confidenceOverride"],
};

export function SupplierEditor({ supplier, section, onOpenChange, onSaved }: { supplier: Supplier; section: EditorSection | null; onOpenChange: (open: boolean) => void; onSaved: (supplier: Supplier) => void }) {
  const [form, setForm] = useState(supplier);
  useEffect(() => { if (section) setForm(supplier); }, [section, supplier]);
  const field = (key: keyof Supplier, label: string) => <div className="grid gap-1.5"><Label>{label}</Label><Input value={String(form[key] ?? "")} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value || null }))} /></div>;
  const list = (key: "regions" | "categories" | "assortment" | "documents", label: string) => <div className="grid gap-1.5"><Label>{label} (по одной строке)</Label><Textarea rows={4} className="min-h-28 resize-y" value={form[key].join("\n")} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) }))} /></div>;
  const contacts = form.contacts.map((c) => [c.name, c.role, c.phone ?? "", c.email ?? ""].join(" | ")).join("\n");
  const prices = form.prices.map((p) => [p.item, p.price, p.unit].join(" | ")).join("\n");
  const sources = form.sources.map((source) => [source.url, source.date].join(" | ")).join("\n");
  const save = async () => {
    if (!section) return;
    try {
      const changes = Object.fromEntries(fields[section].map((key) => [key, form[key]]));
      const updated = await updateSupplier(supplier.id, changes);
      onSaved(updated); onOpenChange(false); toast.success(`${titles[section]} сохранены`);
    } catch (error) { toast.error((error as Error).message); }
  };
  return <Dialog open={section !== null} onOpenChange={onOpenChange}><DialogContent className="editor-dialog max-h-[90vh] w-[min(94vw,56rem)] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{section ? `Редактировать: ${titles[section].toLowerCase()}` : "Редактировать"}</DialogTitle></DialogHeader>
    {section === "info" && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">{field("name", "Название")}{field("legalName", "Юридическое лицо")}{field("inn", "ИНН")}{field("website", "Сайт")}{field("address", "Адрес")}{field("city", "Город")}</div>
      {list("regions", "Регионы")}{list("categories", "Категории")}{list("documents", "Документы")}
      <div className="grid gap-1.5"><Label>Источники (URL | дата, по одному на строку)</Label><Textarea rows={4} className="min-h-28 resize-y" value={sources} onChange={(e) => setForm((old) => ({ ...old, sources: e.target.value.split("\n").filter((line) => line.trim()).map((line) => { const [url, date] = line.split("|").map((part) => part.trim()); return { url: url ?? "", date: date ?? "" }; }) }))} /></div>
    </div>}
    {section === "commerce" && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">{field("minOrder", "Минимальный заказ")}
        <div className="grid gap-1.5"><Label>Минимальный заказ, ₽</Label><Input type="number" min="0" value={form.minOrderRub ?? ""} onChange={(e) => setForm((old) => ({ ...old, minOrderRub: e.target.value ? Number(e.target.value) : null }))} /></div></div>
      <div className="grid gap-1.5"><Label>Доставка и подробные условия</Label><Textarea rows={6} className="min-h-40 resize-y" value={form.delivery ?? ""} onChange={(e) => setForm((old) => ({ ...old, delivery: e.target.value || null }))} /></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.hasDelivery === true} onCheckedChange={(checked) => setForm((old) => ({ ...old, hasDelivery: !!checked }))} />Доставка подтверждена</label>
      {list("assortment", "Ассортимент")}
      <div className="grid gap-1.5"><Label>Цены (товар | цена в ₽ | единица)</Label><Textarea rows={6} className="min-h-40 resize-y" value={prices} onChange={(e) => setForm((old) => ({ ...old, prices: e.target.value.split("\n").filter((line) => line.trim()).map((line) => { const [item, price, unit] = line.split("|").map((part) => part.trim()); return { item: item ?? "", price: Number(price), unit: unit ?? "шт" }; }) }))} /></div>
    </div>}
    {section === "contacts" && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">{field("phone", "Основной телефон")}{field("email", "Основной email")}</div>
      <div className="grid gap-1.5"><Label>Контактные лица (имя | должность | телефон | email)</Label><Textarea rows={8} className="min-h-52 resize-y" value={contacts} onChange={(e) => setForm((old) => ({ ...old, contacts: e.target.value.split("\n").filter((line) => line.trim()).map((line) => { const [name, role, phone, email] = line.split("|").map((part) => part.trim()); return { name: name ?? "", role: role ?? "", phone: phone || null, email: email || null }; }) }))} /></div>
    </div>}
    {section === "notes" && <div className="grid gap-1.5"><Label>Внутренние заметки</Label><Textarea rows={12} className="min-h-64 resize-y" value={form.notes ?? ""} onChange={(e) => setForm((old) => ({ ...old, notes: e.target.value || null }))} /></div>}
    {section === "score" && <div className="space-y-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label>Внутренний рейтинг, 0–5</Label><Input type="number" min="0" max="5" step="0.1" value={form.rating ?? ""} onChange={(e) => setForm((old) => ({ ...old, rating: e.target.value ? Number(e.target.value) : null }))} /></div>{field("verifiedAt", "Дата актуальности (ГГГГ-ММ-ДД)")}</div>
      <label className="flex items-center gap-2"><Checkbox checked={form.verified} onCheckedChange={(checked) => setForm((old) => ({ ...old, verified: !!checked }))} />Сведения подтверждены сотрудником</label>
      <label className="flex items-center gap-2"><Checkbox checked={form.workedWith} onCheckedChange={(checked) => setForm((old) => ({ ...old, workedWith: !!checked }))} />Есть история сотрудничества</label>
      <label className="flex items-center gap-2"><Checkbox checked={!!form.confidenceOverride} onCheckedChange={(checked) => setForm((old) => ({ ...old, confidenceOverride: checked ? { value: old.confidence, reason: "" } : null }))} />Установить достоверность вручную</label>
      {form.confidenceOverride && <div className="grid gap-3 sm:grid-cols-[10rem_1fr]"><div className="grid gap-1.5"><Label>Значение, 0–100%</Label><Input type="number" min="0" max="100" value={form.confidenceOverride.value} onChange={(e) => setForm((old) => ({ ...old, confidenceOverride: { value: Number(e.target.value), reason: old.confidenceOverride?.reason ?? "" } }))} /></div><div className="grid gap-1.5"><Label>Причина изменения</Label><Input value={form.confidenceOverride.reason} onChange={(e) => setForm((old) => ({ ...old, confidenceOverride: { value: old.confidenceOverride?.value ?? old.confidence, reason: e.target.value } }))} /></div></div>}
      <p className="text-xs text-muted-foreground">Ручная достоверность влияет на оценку надёжности данных. Значение и причина сохраняются в истории изменений.</p>
    </div>}
    <DialogFooter><Button onClick={save} disabled={section === "info" && (!form.name.trim() || !form.city.trim()) || section === "score" && !!form.confidenceOverride && form.confidenceOverride.reason.trim().length < 3}>Сохранить блок</Button></DialogFooter>
  </DialogContent></Dialog>;
}
