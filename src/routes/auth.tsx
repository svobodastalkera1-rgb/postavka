import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/auth")({
  head: () => meta("Вход", "Вход и регистрация сотрудников отдела закупок."),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const go = (e: React.FormEvent) => { e.preventDefault(); nav({ to: "/" }); };
  const field = (l: string, t = "text") => <div className="grid gap-1.5"><Label>{l}</Label><Input type={t} required /></div>;
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="font-semibold text-sidebar-accent-foreground">Поставка</div>
        <div><h1 className="text-3xl font-semibold leading-tight text-sidebar-accent-foreground">Поставка — сервис поиска и сравнения поставщиков</h1>
          <p className="mt-4 max-w-md text-sm">Единая база, интернет-поиск, сравнение и общая история работы с каждым поставщиком.</p></div>
        <div className="text-xs">Демонстрационная версия · этап 1</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm"><CardHeader><CardTitle>Добро пожаловать</CardTitle></CardHeader><CardContent>
          <Tabs defaultValue="in">
            <TabsList className="mb-4 grid grid-cols-2"><TabsTrigger value="in">Вход</TabsTrigger><TabsTrigger value="up">Регистрация</TabsTrigger></TabsList>
            <TabsContent value="in"><form onSubmit={go} className="grid gap-3">{field("Email", "email")}{field("Пароль", "password")}<Button type="submit">Войти</Button>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground">Забыли пароль?</button></form></TabsContent>
            <TabsContent value="up"><form onSubmit={go} className="grid gap-3">{field("Имя")}{field("Email", "email")}{field("Пароль", "password")}<Button type="submit">Зарегистрироваться</Button></form></TabsContent>
          </Tabs>
          <p className="mt-4 text-xs text-muted-foreground">На этапе 1 вход не проверяется — кнопка просто открывает приложение.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
