import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Pending } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Globe, Search, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/discovery")({
  head: () => meta("Поиск в интернете", "Поиск новых поставщиков в открытых источниках через Яндекс."),
  component: Discovery,
});

const STEPS = ["Формирование запросов", "Поиск в Яндексе", "Загрузка сайтов", "Извлечение данных", "Проверка дублей", "Сохранение"];
const PREVIEW = [
  { name: "Пример ООО «Упаковка-Демо»", url: "https://example.com/a", snippet: "Бумажные контейнеры оптом, доставка по Екатеринбургу…", dup: false },
  { name: "УралПак (демо)", url: "https://example.com/uralpak", snippet: "Крафт-упаковка для общепита…", dup: true },
];

function Discovery() {
  const [q, setQ] = useState("Бумажные контейнеры для готовой еды, 500–750 мл");
  const [run, setRun] = useState<number | null>(null);
  const start = () => { setRun(0); let i = 0; const t = setInterval(() => { i++; setRun(i); if (i >= STEPS.length) clearInterval(t); }, 450); };
  return (
    <>
      <PageHeader title="Поиск поставщиков в интернете" description="Поиск через Яндекс по открытым источникам. Результаты не выдумываются: только найденные сайты." />
      <Card><CardContent className="grid gap-3 pt-6">
        <Textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} placeholder="Опишите, какие товары нужны" />
        <div className="flex flex-wrap gap-3"><Input defaultValue="Екатеринбург, Свердловская область" className="max-w-xs" /><Button onClick={start} disabled={!q.trim()}><Search />Найти поставщиков</Button></div>
      </CardContent></Card>
      {run !== null && <>
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-6">
          {STEPS.map((s, i) => <div key={s} className={`flex items-center gap-2 rounded-md border p-2 text-xs ${i < run ? "bg-success-soft text-success" : i === run ? "bg-primary-soft" : "bg-card text-muted-foreground"}`}>
            {i < run ? <Check className="size-3.5" /> : i === run ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-3.5" />}{s}</div>)}
        </div>
        {run >= STEPS.length && <div className="mt-6 space-y-3">
          <Pending>Демо-просмотр: показан вид результатов. Реальный поиск через Яндекс подключится на этапе 3.</Pending>
          {PREVIEW.map((r) => <Card key={r.url}><CardContent className="flex flex-wrap items-start justify-between gap-3 pt-6">
            <div><div className="flex items-center gap-2 font-medium"><Globe className="size-4 text-muted-foreground" />{r.name}{r.dup && <Badge variant="outline" className="border-transparent bg-warning-soft text-warning">Уже в базе</Badge>}</div>
              <div className="text-sm text-muted-foreground">{r.snippet}</div><div className="mt-1 text-xs text-primary">{r.url} · найдено сегодня</div></div>
            <Button size="sm" variant={r.dup ? "outline" : "default"} onClick={() => toast("Сохранение заработает на этапе 2")}>{r.dup ? "Объединить" : "Сохранить в базу"}</Button>
          </CardContent></Card>)}
        </div>}
      </>}
    </>
  );
}
