import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { meta } from "@/lib/meta";
import { useState } from "react";
import { request } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => meta("Вход", "Вход сотрудника отдела закупок."),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const go = async (e: React.FormEvent) => { e.preventDefault(); try { await request("/session", { method: "POST", body: JSON.stringify({ name, password }) }); nav({ to: "/" }); } catch (error) { toast.error((error as Error).message); } };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="font-semibold text-sidebar-accent-foreground">Поставка</div>
        <div><h1 className="text-3xl font-semibold leading-tight text-sidebar-accent-foreground">Поставка — сервис поиска и сравнения поставщиков</h1>
          <p className="mt-4 max-w-md text-sm">Единая база, поиск по каталогу и общая история работы с каждым поставщиком.</p></div>
        <div className="text-xs">Демонстрационная версия</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm"><CardHeader><CardTitle>Добро пожаловать</CardTitle></CardHeader><CardContent>
          <form onSubmit={go} className="grid gap-3"><div className="grid gap-1.5"><Label>Ваше имя</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="grid gap-1.5"><Label>Пароль редактора</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div><Button type="submit">Войти</Button><Button asChild variant="outline"><Link to="/suppliers">Продолжить без входа</Link></Button></form>
          <p className="mt-4 text-xs text-muted-foreground">Пароль задаётся владельцем приложения на сервере. Просмотр каталога доступен без входа.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
