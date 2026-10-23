import { useEffect, useState } from "react";
import type { Supplier } from "@/lib/fixtures";
import { updateSupplier } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function SupplierEditor({ supplier, open, onOpenChange, onSaved }: { supplier: Supplier; open: boolean; onOpenChange: (open: boolean) => void; onSaved: (supplier: Supplier) => void }) {
  const [form, setForm] = useState(supplier);
  useEffect(() => { if (open) setForm(supplier); }, [open, supplier]);
  const field = (key: keyof Supplier, label: string) => <div className="grid gap-1.5"><Label>{label}</Label><Input value={String(form[key] ?? "")} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value || null }))} /></div>;
  const list = (key: "regions" | "categories" | "assortment" | "documents", label: string) => <div className="grid gap-1.5"><Label>{label} (по одной строке)</Label><Textarea value={form[key].join("\n")} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) }))} /></div>;
  const contacts = form.contacts.map((c) => [c.name, c.role, c.phone ?? "", c.email ?? ""].join(" | ")).join("\n");
  const prices = form.prices.map((p) => [p.item, p.price, p.unit].join(" | ")).join("\n");
  const save = async () => {
    try {
      const { id: _id, score: _score, confidence: _confidence, discoveredAt: _discoveredAt, ...changes } = form;
      const updated = await updateSupplier(supplier.id, changes);
      onSaved(updated); onOpenChange(false); toast.success("Карточка сохранена");
    } catch (error) { toast.error((error as Error).message); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Редактировать поставщика</DialogTitle></DialogHeader>
    <div className="grid gap-3 sm:grid-cols-2">
      {field("name", "Название")}{field("legalName", "Юридическое лицо")}{field("inn", "ИНН")}{field("website", "Сайт")}
      {field("phone", "Телефон")}{field("email", "Email")}{field("address", "Адрес")}{field("city", "Город")}
      {field("minOrder", "Минимальный заказ")}{field("delivery", "Доставка")}{field("verifiedAt", "Дата актуальности (ГГГГ-ММ-ДД)")}
    </div>
    {list("regions", "Регионы")}{list("categories", "Категории")}{list("assortment", "Ассортимент")}{list("documents", "Документы")}
    <div className="grid gap-1.5"><Label>Контактные лица (имя | должность | телефон | email)</Label><Textarea value={contacts} onChange={(e) => setForm((old) => ({ ...old, contacts: e.target.value.split("\n").filter((line) => line.trim()).map((line) => { const [name, role, phone, email] = line.split("|").map((part) => part.trim()); return { name: name ?? "", role: role ?? "", phone: phone || null, email: email || null }; }) }))} /></div>
    <div className="grid gap-1.5"><Label>Цены (товар | цена в ₽ | единица)</Label><Textarea value={prices} onChange={(e) => setForm((old) => ({ ...old, prices: e.target.value.split("\n").filter((line) => line.trim()).map((line) => { const [item, price, unit] = line.split("|").map((part) => part.trim()); return { item: item ?? "", price: Number(price), unit: unit ?? "шт" }; }) }))} /></div>
    <div className="grid gap-1.5"><Label>Заметки и коммерческие условия</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm((old) => ({ ...old, notes: e.target.value }))} /></div>
    <DialogFooter><Button onClick={save} disabled={!form.name.trim() || !form.city.trim()}>Сохранить</Button></DialogFooter>
  </DialogContent></Dialog>;
}
