import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/ui-bits";
import { request } from "@/lib/api-client";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin")({
  head: () => meta("Настройки", "Сведения о доступных возможностях приложения."),
  component: Admin,
});

type Session = { authenticated: boolean; name: string | null };

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    request<Session>("/session")
      .then((value) => { if (active) setSession(value); })
      .catch(() => { if (active) setSession({ authenticated: false, name: null }); });
    return () => { active = false; };
  }, []);

  if (!session) return <p role="status" className="text-sm text-muted-foreground">Проверяем доступ…</p>;

  if (!session.authenticated) {
    return <>
      <PageHeader title="Настройки" description="Для просмотра настроек войдите в систему." />
      <Card><CardContent className="flex flex-wrap gap-3 pt-6">
        <Button asChild><Link to="/auth">Войти</Link></Button>
        <Button asChild variant="outline"><Link to="/suppliers">Вернуться в каталог</Link></Button>
      </CardContent></Card>
    </>;
  }

  return <>
    <PageHeader title="Настройки" description={`Вы вошли как ${session.name ?? "сотрудник"}.`} />
    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Доступ сотрудников</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Сейчас в демонстрационной версии используется общий пароль редактора. Отдельные учётные записи и управление ролями ещё не реализованы.</p>
        <p>Имя при входе указывает сам сотрудник; оно не подтверждает его личность.</p>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Интеграции</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Карточки поставщиков доступны через REST API приложения. Отдельные ключи для внешних систем и управление ими ещё не реализованы.</p>
        <Button asChild variant="outline" size="sm"><a href="/openapi.yaml" target="_blank" rel="noreferrer">Открыть OpenAPI</a></Button>
      </CardContent></Card>
    </div>
  </>;
}
