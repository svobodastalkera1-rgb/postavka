import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SUPPLIERS } from "@/lib/fixtures";
import { PageHeader, Pending, ScorePill, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/ai-search")({
  head: () => meta("ИИ-поиск по базе", "Поиск поставщиков во внутренней базе на естественном языке."),
  component: AiSearch,
});

const EX = "Найди поставщиков бумажных контейнеров в Екатеринбурге с доставкой и небольшим минимальным заказом.";

function AiSearch() {
  const [q, setQ] = useState(EX);
  const [done, setDone] = useState(false);
  const hits = [SUPPLIERS[1], SUPPLIERS[0]];
  return (
    <>
      <PageHeader title="ИИ-поиск по базе" description="Ответ строится только на данных из внутренней базы — без выдуманных цен и контактов." />
      <Card><CardContent className="grid gap-3 pt-6">
        <Textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} />
        <Button className="w-fit" onClick={() => setDone(true)}><Sparkles />Найти</Button>
      </CardContent></Card>
      {done && <div className="mt-6 space-y-4">
        <Pending>Демо-просмотр. Настоящий ИИ подключится на этапе 3.</Pending>
        <div className="flex flex-wrap gap-2 text-xs">{["Категория: одноразовые контейнеры", "Город: Екатеринбург", "Доставка: есть", "Мин. заказ: ≤ 10 000 ₽"].map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}</div>
        <Card className="bg-primary-soft"><CardContent className="pt-6 text-sm">Найдено 2 поставщика. Лучший по минимальному заказу — ЭкоТара Урал (5 000 ₽), но данные не проверены. УралПак — проверенный активный поставщик с минимальным заказом 10 000 ₽.</CardContent></Card>
        {hits.map((s) => <Card key={s.id}><CardContent className="flex justify-between gap-4 pt-6">
          <div><SupplierLink s={s} /><p className="mt-1 text-sm text-muted-foreground">Почему подходит: {s.categories.join(", ")}; мин. заказ {s.minOrder}; {s.delivery}.</p>
            <a href={s.sources[0].url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-primary hover:underline">Источник: {s.sources[0].url}</a></div>
          <ScorePill s={s} /></CardContent></Card>)}
      </div>}
    </>
  );
}
