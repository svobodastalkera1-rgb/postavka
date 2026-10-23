import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Directory } from "./suppliers.index";
import { Lucky } from "./lucky";
import { meta } from "@/lib/meta";
import { Clover, Search } from "lucide-react";

export const Route = createFileRoute("/discovery")({
  head: () => meta("Поиск поставщиков", "Поиск по сохранённому каталогу поставщиков."),
  component: SearchPage,
});

function SearchPage() {
  const [lucky, setLucky] = useState(false);
  return <>
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <Button variant={lucky ? "outline" : "default"} aria-pressed={!lucky} onClick={() => setLucky(false)}><Search />Поиск по каталогу</Button>
      <Button variant={lucky ? "default" : "outline"} aria-pressed={lucky} onClick={() => setLucky(true)}><Clover />Мне повезёт!</Button>
      <span className="text-xs text-muted-foreground">Внешний интернет-поиск и AI пока не подключены.</span>
    </div>
    {lucky ? <Lucky /> : <Directory />}
  </>;
}
