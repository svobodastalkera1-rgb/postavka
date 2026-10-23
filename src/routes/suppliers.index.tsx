import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CATEGORIES, PIPELINE, STATUS_LABELS, totalScore } from "@/lib/fixtures";
import { Flags, NoData, PageHeader, ScorePill, StatusBadge, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Plus, Database, Columns3, Star } from "lucide-react";
import { toast } from "sonner";
import { createSupplier, request, suppliers } from "@/lib/api-client";
import type { Supplier } from "@/lib/fixtures";

export const Route = createFileRoute("/suppliers/")({
  head: () => meta("Каталог поставщиков", "Поиск и фильтрация поставщиков во внутренней базе."),
  component: Directory,
});

const ALL = "all";

export function Directory() {
  const [items, setItems] = useState<Supplier[]>([]);
  useEffect(() => { suppliers().then((data) => setItems(data.items)).catch((error) => toast.error(error.message)); }, []);
  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [delivery, setDelivery] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hideBl, setHideBl] = useState(true);
  const [sort, setSort] = useState("score");
  const [sel, setSel] = useState<string[]>([]);
  const cities = [...new Set(items.map((s) => s.city))];
  const regions = [...new Set(items.flatMap((s) => s.regions))];

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return items.filter((s) =>
      (!t || [s.name, s.city, ...s.regions, ...s.assortment, ...s.categories].join(" ").toLowerCase().includes(t)) &&
      (group === ALL || s.group === group) && (status === ALL || s.status === status) && (city === ALL || s.city === city) && (region === ALL || s.regions.includes(region)) &&
      (view !== "favorites" || s.favorite) && (view !== "blacklist" || s.blacklisted) && (!delivery || s.hasDelivery) && (!verified || s.verified) && (view === "blacklist" || !hideBl || !s.blacklisted),
    ).sort((a, b) => sort === "score" ? totalScore(b) - totalScore(a) : sort === "name" ? a.name.localeCompare(b.name) : b.discoveredAt.localeCompare(a.discoveredAt));
  }, [items, q, group, status, city, region, delivery, verified, hideBl, sort, view]);

  const toggle = (id: string) => setSel((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p);
  const importVerified = async () => {
    try {
      const result = await request<{ added: number }>("/catalog/import", { method: "POST" });
      setItems((await suppliers()).items);
      toast.success(result.added ? `Добавлено компаний: ${result.added}` : "Каталог уже загружен");
    } catch (error) { toast.error((error as Error).message); }
  };

  return (
    <>
      <PageHeader title="Каталог поставщиков" description="Поиск только по внутренней базе"
        actions={<>
          <Button variant="outline" onClick={importVerified}><Database />Импортировать каталог</Button>
          <NewSupplierDialog onCreated={(item) => setItems((all) => [item, ...all])} />
        </>} />
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <Select value={view} onValueChange={setView}><SelectTrigger aria-label="Список поставщиков"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все поставщики</SelectItem><SelectItem value="favorites">Избранное</SelectItem><SelectItem value="blacklist">Чёрный список</SelectItem></SelectContent></Select>
        <Input aria-label="Поиск по каталогу" placeholder="Название, товар, ключевое слово…" value={q} onChange={(e) => setQ(e.target.value)} className="md:col-span-2" />
        <Select value={group} onValueChange={setGroup}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value={ALL}>Все категории</SelectItem>
          {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
        </SelectContent></Select>
        <Select value={city} onValueChange={setCity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value={ALL}>Все города</SelectItem>
          {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent></Select>
        <Select value={region} onValueChange={setRegion}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value={ALL}>Все регионы</SelectItem>
          {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value={ALL}>Любой статус</SelectItem>
          {[...PIPELINE, "rejected", "ended"].map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s as keyof typeof STATUS_LABELS]}</SelectItem>)}
        </SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="score">По оценке</SelectItem><SelectItem value="name">По названию</SelectItem><SelectItem value="date">По дате обнаружения</SelectItem>
        </SelectContent></Select>
        <div className="flex flex-wrap items-center gap-4 text-sm md:col-span-2">
          {[["С доставкой", delivery, setDelivery], ["Только проверенные", verified, setVerified], ["Скрыть чёрный список", hideBl, setHideBl]].map(([l, v, f]) => (
            <label key={l as string} className="flex items-center gap-2"><Checkbox checked={v as boolean} onCheckedChange={(c) => (f as (b: boolean) => void)(!!c)} />{l as string}</label>
          ))}
        </div>
      </div>

      {sel.length > 0 && (
        <div className="sticky top-2 z-10 mt-4 flex items-center justify-between rounded-lg border bg-primary-soft px-4 py-2 text-sm">
          <span>Выбрано для сравнения: {sel.length} из 4</span>
          <Button size="sm" asChild disabled={sel.length < 2}><Link to="/compare" search={{ ids: sel.join(",") }}><Columns3 />Сравнить</Link></Button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-10" /><TableHead>Поставщик</TableHead><TableHead>Категории</TableHead><TableHead>Город</TableHead>
            <TableHead>Мин. заказ</TableHead><TableHead>Доставка</TableHead><TableHead>Статус</TableHead><TableHead className="text-right">Оценка</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell><Checkbox checked={sel.includes(s.id)} onCheckedChange={() => toggle(s.id)} aria-label="Сравнить" /></TableCell>
                <TableCell><div className="flex items-center gap-1.5"><SupplierLink s={s} />{s.favorite && <Star className="size-3.5 fill-warning text-warning" />}<Flags s={s} /></div>
                  <div className="text-xs text-muted-foreground"><NoData value={s.legalName} /></div></TableCell>
                <TableCell className="max-w-48 text-sm">{s.categories.join(", ")}</TableCell>
                <TableCell>{s.city}</TableCell>
                <TableCell><NoData value={s.minOrder} /></TableCell>
                <TableCell className="max-w-48 text-sm"><NoData value={s.delivery} /></TableCell>
                <TableCell><StatusBadge status={s.status} /></TableCell>
                <TableCell className="text-right"><ScorePill s={s} /></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Ничего не найдено. Измените фильтры.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Показано {rows.length} из {items.length}</span><span>Страница 1 из 1</span></div>
    </>
  );
}

function NewSupplierDialog({ onCreated }: { onCreated: (item: Supplier) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", legalName: "", inn: "", website: "", phone: "", city: "Екатеринбург" });
  const save = async () => {
    try {
      const item = await createSupplier({ ...form, group: "food" });
      onCreated(item); setOpen(false); toast.success("Поставщик создан");
    } catch (error) { toast.error((error as Error).message); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus />Добавить поставщика</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Новый поставщик</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {([ ["name", "Название компании"], ["legalName", "Юридическое лицо"], ["inn", "ИНН"], ["website", "Сайт"], ["phone", "Телефон"], ["city", "Город"] ] as const).map(([key, label]) => (
            <div key={key} className="grid gap-1.5"><Label>{label}</Label><Input value={form[key]} onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))} /></div>
          ))}
        </div>
        <DialogFooter><Button onClick={save} disabled={!form.name.trim()}>Создать</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
