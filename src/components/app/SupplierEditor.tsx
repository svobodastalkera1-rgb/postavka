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
  const list = (key: "regions" | "categories" | "assortment" | "documents", label: string) => <div className="space-y-2">
    <div className="flex items-center justify-between gap-3"><Label>{label}</Label><Button type="button" variant="outline" size="sm" onClick={() => setForm((old) => ({ ...old, [key]: [...old[key], ""] }))}>Добавить</Button></div>
    {form[key].length === 0 && <p className="text-sm text-muted-foreground">Пока нет записей.</p>}
    {form[key].map((value, index) => <div key={`${key}-${index}`} className="flex items-start gap-2">
      <Textarea rows={2} className="min-h-16 resize-y" aria-label={`${label}: запись ${index + 1}`} value={value} onChange={(e) => setForm((old) => ({ ...old, [key]: old[key].map((item, at) => at === index ? e.target.value : item) }))} />
      <Button type="button" variant="ghost" size="sm" onClick={() => setForm((old) => ({ ...old, [key]: old[key].filter((_, at) => at !== index) }))}>Удалить</Button>
    </div>)}
  </div>;
  const updateContact = (index: number, changes: Partial<Supplier["contacts"][number]>) => setForm((old) => ({ ...old, contacts: old.contacts.map((contact, at) => at === index ? { ...contact, ...changes } : contact) }));
  const updatePrice = (index: number, changes: Partial<Supplier["prices"][number]>) => setForm((old) => ({ ...old, prices: old.prices.map((price, at) => at === index ? { ...price, ...changes } : price) }));
  const updateSource = (index: number, changes: Partial<Supplier["sources"][number]>) => setForm((old) => ({ ...old, sources: old.sources.map((source, at) => at === index ? { ...source, ...changes } : source) }));
  const save = async () => {
    if (!section) return;
    try {
      const changes = Object.fromEntries(fields[section].map((key) => [key, form[key]]));
      for (const key of ["regions", "categories", "assortment", "documents"] as const) {
        if (key in changes) changes[key] = form[key].filter((value) => value.trim());
      }
      if (section === "info") changes["sources"] = form.sources.filter((source) => source.url.trim() || source.date.trim());
      if (section === "commerce") {
        if (form.prices.some((price) => !price.item.trim() || !Number.isFinite(price.price) || price.price < 0 || !price.unit.trim())) {
          toast.error("Для каждой цены укажите товар, неотрицательную сумму и единицу измерения."); return;
        }
      }
      const updated = await updateSupplier(supplier.id, changes);
      onSaved(updated); onOpenChange(false); toast.success(`${titles[section]} сохранены`);
    } catch (error) { toast.error((error as Error).message); }
  };
  return <Dialog open={section !== null} onOpenChange={onOpenChange}><DialogContent className="editor-dialog max-h-[90vh] w-[min(94vw,56rem)] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{section ? `Редактировать: ${titles[section].toLowerCase()}` : "Редактировать"}</DialogTitle></DialogHeader>
    {section === "info" && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">{field("name", "Название")}{field("legalName", "Юридическое лицо")}{field("inn", "ИНН")}{field("website", "Сайт")}{field("address", "Адрес")}{field("city", "Город")}</div>
      {list("regions", "Регионы")}{list("categories", "Категории")}{list("documents", "Названия и сведения о документах (без загрузки файлов)")}
      <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label>Источники информации</Label><Button type="button" variant="outline" size="sm" onClick={() => setForm((old) => ({ ...old, sources: [...old.sources, { url: "", date: "" }] }))}>Добавить источник</Button></div>
        {form.sources.map((source, index) => <div key={index} className="glass-card grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_11rem_auto]">
          <div className="grid gap-1.5"><Label htmlFor={`source-url-${index}`}>Ссылка</Label><Input id={`source-url-${index}`} value={source.url} onChange={(e) => updateSource(index, { url: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor={`source-date-${index}`}>Дата проверки</Label><Input id={`source-date-${index}`} value={source.date} onChange={(e) => updateSource(index, { date: e.target.value })} /></div>
          <Button type="button" variant="ghost" size="sm" className="self-end" onClick={() => setForm((old) => ({ ...old, sources: old.sources.filter((_, at) => at !== index) }))}>Удалить</Button>
        </div>)}
      </div>
    </div>}
    {section === "commerce" && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">{field("minOrder", "Минимальный заказ")}
        <div className="grid gap-1.5"><Label>Минимальный заказ, ₽</Label><Input type="number" min="0" value={form.minOrderRub ?? ""} onChange={(e) => setForm((old) => ({ ...old, minOrderRub: e.target.value ? Number(e.target.value) : null }))} /></div></div>
      <div className="grid gap-1.5"><Label>Доставка и подробные условия</Label><Textarea rows={6} className="min-h-40 resize-y" value={form.delivery ?? ""} onChange={(e) => setForm((old) => ({ ...old, delivery: e.target.value || null }))} /></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.hasDelivery === true} onCheckedChange={(checked) => setForm((old) => ({ ...old, hasDelivery: !!checked }))} />Доставка подтверждена</label>
      {list("assortment", "Ассортимент")}
      <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label>Цены и позиции КП</Label><Button type="button" variant="outline" size="sm" onClick={() => setForm((old) => ({ ...old, prices: [...old.prices, { item: "", price: 0, unit: "шт" }] }))}>Добавить позицию</Button></div>
        {form.prices.length === 0 && <p className="text-sm text-muted-foreground">Цены пока не указаны.</p>}
        {form.prices.map((price, index) => <div key={index} className="glass-card space-y-3 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem_8rem_auto]">
            <div className="grid gap-1.5"><Label htmlFor={`price-item-${index}`}>Товар или услуга</Label><Textarea id={`price-item-${index}`} rows={2} className="min-h-16 resize-y" value={price.item} onChange={(e) => updatePrice(index, { item: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label htmlFor={`price-value-${index}`}>Цена, ₽</Label><Input id={`price-value-${index}`} type="number" min="0" step="any" value={Number.isFinite(price.price) ? price.price : ""} onChange={(e) => updatePrice(index, { price: e.target.value === "" ? Number.NaN : Number(e.target.value) })} /></div>
            <div className="grid gap-1.5"><Label htmlFor={`price-unit-${index}`}>Единица</Label><Input id={`price-unit-${index}`} value={price.unit} onChange={(e) => updatePrice(index, { unit: e.target.value })} /></div>
            <Button type="button" variant="ghost" size="sm" className="self-end" onClick={() => setForm((old) => ({ ...old, prices: old.prices.filter((_, at) => at !== index) }))}>Удалить</Button>
          </div>
        </div>)}
      </div>
    </div>}
    {section === "contacts" && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">{field("phone", "Основной телефон")}{field("email", "Основной email")}</div>
      <div className="flex items-center justify-between gap-3"><h3 className="font-medium">Контактные лица</h3><Button type="button" variant="outline" size="sm" onClick={() => setForm((old) => ({ ...old, contacts: [...old.contacts, { name: "", role: "", phone: null, email: null, details: null }] }))}>Добавить контакт</Button></div>
      {form.contacts.length === 0 && <p className="text-sm text-muted-foreground">Контактных лиц пока нет. Добавьте человека отдельной карточкой.</p>}
      {form.contacts.map((contact, index) => <div key={index} className="glass-card space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3"><h4 className="font-medium">{contact.name.trim() || `Контакт ${index + 1}`}</h4><Button type="button" variant="ghost" size="sm" onClick={() => setForm((old) => ({ ...old, contacts: old.contacts.filter((_, at) => at !== index) }))}>Удалить</Button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label htmlFor={`contact-name-${index}`}>ФИО</Label><Input id={`contact-name-${index}`} value={contact.name} onChange={(e) => updateContact(index, { name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor={`contact-role-${index}`}>Должность</Label><Input id={`contact-role-${index}`} value={contact.role} onChange={(e) => updateContact(index, { role: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor={`contact-phone-${index}`}>Телефон</Label><Input id={`contact-phone-${index}`} value={contact.phone ?? ""} onChange={(e) => updateContact(index, { phone: e.target.value || null })} /></div>
          <div className="grid gap-1.5"><Label htmlFor={`contact-email-${index}`}>Email</Label><Input id={`contact-email-${index}`} value={contact.email ?? ""} onChange={(e) => updateContact(index, { email: e.target.value || null })} /></div>
        </div>
        <div className="grid gap-1.5"><Label htmlFor={`contact-details-${index}`}>Заметка о контакте — произвольный текст</Label><Textarea id={`contact-details-${index}`} rows={4} className="min-h-28 resize-y" value={contact.details ?? ""} onChange={(e) => updateContact(index, { details: e.target.value || null })} /></div>
      </div>)}
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
    <DialogFooter><Button onClick={save} disabled={section === "info" && (!form.name.trim() || !form.city.trim()) || section === "contacts" && form.contacts.some((contact) => !contact.name.trim()) || section === "score" && !!form.confidenceOverride && form.confidenceOverride.reason.trim().length < 3}>Сохранить блок</Button></DialogFooter>
  </DialogContent></Dialog>;
}

