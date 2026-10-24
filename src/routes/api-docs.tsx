import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/api-docs")({
  head: () => meta("Документация API", "Спецификация REST API Поставки."),
  component: ApiDocs,
});

function ApiDocs() {
  const [spec, setSpec] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/openapi.yaml").then((response) => {
      if (!response.ok) throw new Error("Не удалось загрузить спецификацию");
      return response.text();
    }).then((text) => { if (active) setSpec(text); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  return <>
    <PageHeader title="Документация API" description="Спецификация OpenAPI для интеграции с Поставкой." actions={<Button asChild variant="outline"><Link to="/admin">К настройкам</Link></Button>} />
    <div className="glass-card rounded-lg border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Карточки доступны для чтения; изменение требует авторизации редактора.</p>
        <Button asChild variant="outline" size="sm"><a href="/openapi.yaml" download="postavka-openapi.yaml">Скачать YAML</a></Button>
      </div>
      {error ? <p role="alert">Не удалось загрузить спецификацию. Попробуйте скачать YAML.</p> : spec === null ? <p role="status">Загружаем спецификацию…</p> : <pre className="max-h-[70vh] overflow-auto rounded-md border bg-background/60 p-4 text-xs leading-relaxed text-foreground"><code>{spec}</code></pre>}
    </div>
  </>;
}
