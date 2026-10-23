import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SUPPLIERS, totalScore } from "@/lib/fixtures";
import { PageHeader, Pending, ScorePill, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Clover } from "lucide-react";

export const Route = createFileRoute("/lucky")({
  head: () => meta("Мне повезёт!", "До трёх новых поставщиков, с которыми компания ещё не работала."),
  component: Lucky,
});

export function Lucky() {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(false);
  const picks = SUPPLIERS.filter((s) => !s.workedWith && !s.blacklisted).sort((a, b) => totalScore(b) - totalScore(a)).slice(0, 3);
  return (
    <>
      <PageHeader title="Мне повезёт!" description="Подберём до трёх новых поставщиков. Чёрный список и текущие партнёры исключаются." />
      <Card><CardContent className="flex flex-col items-center gap-4 py-10">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Например: охлаждённые супы или крафт-пакеты" className="max-w-lg" />
        <Button size="lg" className="h-14 px-10 text-lg" onClick={() => setShown(true)} disabled={!q.trim()}><Clover className="size-5" />Мне повезёт!</Button>
      </CardContent></Card>
      {shown && <div className="mt-6 space-y-3">
        <Pending>Демо-подбор без учёта запроса. Подбор по запросу заработает на этапе 4.</Pending>
        <div className="grid gap-4 md:grid-cols-3">{picks.map((s, i) => <Card key={s.id}><CardContent className="space-y-2 pt-6">
          <div className="flex justify-between"><span className="text-xs text-muted-foreground">#{i + 1}</span><ScorePill s={s} /></div>
          <SupplierLink s={s} />
          <p className="text-sm text-muted-foreground">Почему: {s.categories.join(", ")}; ассортимент {s.score.assortment}/100; ещё не работали.</p>
        </CardContent></Card>)}</div>
        {picks.length < 3 && <p className="text-sm text-muted-foreground">Подходящих поставщиков меньше трёх — других кандидатов нет.</p>}
      </div>}
    </>
  );
}
