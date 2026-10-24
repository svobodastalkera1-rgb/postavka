import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSuppliers } from "@/lib/use-suppliers";
import { recommend } from "@/lib/recommend";
import { PageHeader, Pending, ScorePill } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { Clover } from "lucide-react";

export const Route = createFileRoute("/lucky")({
  head: () => meta("Мне повезёт!", "До трёх новых поставщиков, с которыми компания ещё не работала."),
  component: Lucky,
});

export function Lucky() {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(false);
  const { items, loading, error, reload } = useSuppliers();
  const picks = recommend(items, q);
  return (
    <>
      <PageHeader title="Мне повезёт!" description="Подберём до трёх новых поставщиков. Чёрный список и текущие партнёры исключаются."
        actions={<Button variant="outline" asChild><Link to="/suppliers">К каталогу</Link></Button>} />
      {loading && <p role="status" className="mb-4 text-sm text-muted-foreground">Загружаем поставщиков…</p>}
      {error && <div role="alert" className="mb-4 rounded-lg border border-destructive p-4 text-sm">{error} <Button variant="outline" size="sm" onClick={reload}>Повторить</Button></div>}
      <Card><CardContent className="flex flex-col items-center gap-4 py-10">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Товар, компания, контакт или телефон" className="max-w-lg" />
        <Button size="lg" className="h-14 px-10 text-lg" onClick={() => setShown(true)} disabled={!q.trim() || loading || !!error}><Clover className="size-5" />Мне повезёт!</Button>
      </CardContent></Card>
      {shown && !loading && !error && <div className="mt-6 space-y-3">
        <Pending>Подбор по совпадению запроса с данными карточки, включая контакты и телефон. Оценка пригодности используется при равном совпадении.</Pending>
        <div className="grid gap-4 md:grid-cols-3">{picks.map((s, i) => <Link key={s.id} to="/suppliers/$id" params={{ id: s.id }} className="card-link" aria-label={`Открыть карточку ${s.name}`}><Card className="h-full"><CardContent className="space-y-2 pt-6">
          <div className="flex justify-between"><span className="text-xs text-muted-foreground">#{i + 1}</span><ScorePill s={s} /></div>
          <span className="font-medium text-foreground">{s.name}</span>
          <p className="text-sm text-muted-foreground">Почему: {s.categories.join(", ")}; ассортимент {s.score.assortment}/100; ещё не работали.</p>
        </CardContent></Card></Link>)}</div>
        {picks.length < 3 && <p className="text-sm text-muted-foreground">Подходящих поставщиков меньше трёх — других кандидатов нет.</p>}
      </div>}
    </>
  );
}

