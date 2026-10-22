import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { USERS } from "@/lib/fixtures";
import { PageHeader } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => meta("Администрирование", "Пользователи, веса оценки, обновление данных и API."),
  component: Admin,
});

const soon = () => toast("Заработает на этапе 2");
const WEIGHTS = [["Релевантность ассортимента", 30], ["Логистика", 20], ["Коммерческие условия", 20], ["Надёжность данных", 15], ["История сотрудничества", 15]] as const;

function Admin() {
  return (
    <>
      <PageHeader title="Администрирование" description="Доступно только администраторам" />
      <Tabs defaultValue="users">
        <TabsList><TabsTrigger value="users">Пользователи</TabsTrigger><TabsTrigger value="scoring">Оценка</TabsTrigger><TabsTrigger value="refresh">Обновление данных</TabsTrigger><TabsTrigger value="api">API</TabsTrigger></TabsList>
        <TabsContent value="users"><Card><CardContent className="pt-6"><Table>
          <TableHeader><TableRow><TableHead>Имя</TableHead><TableHead>Email</TableHead><TableHead>Роль</TableHead><TableHead>Активность</TableHead></TableRow></TableHeader>
          <TableBody>{USERS.map((u) => <TableRow key={u.email}><TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell>
            <TableCell><Select defaultValue={u.role} onValueChange={soon}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Админ">Админ</SelectItem><SelectItem value="Пользователь">Пользователь</SelectItem></SelectContent></Select></TableCell>
            <TableCell>{u.lastSeen}</TableCell></TableRow>)}</TableBody>
        </Table></CardContent></Card></TabsContent>
        <TabsContent value="scoring"><Card><CardHeader><CardTitle className="text-base">Веса модели оценки</CardTitle></CardHeader><CardContent className="space-y-5">
          {WEIGHTS.map(([l, w]) => <div key={l}><div className="mb-2 flex justify-between text-sm"><span>{l}</span><span className="font-mono">{w}%</span></div><Slider defaultValue={[w]} max={50} step={5} /></div>)}
          <p className="text-xs text-muted-foreground">Если истории сотрудничества нет, её вес распределяется между остальными критериями. Все изменения попадают в журнал.</p>
          <Button onClick={soon}>Сохранить и пересчитать</Button>
        </CardContent></Card></TabsContent>
        <TabsContent value="refresh"><Card><CardContent className="space-y-4 pt-6 text-sm">
          <div className="flex items-center gap-3">Периодичность: <Select defaultValue="week"><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="week">Раз в неделю</SelectItem><SelectItem value="month">Раз в месяц</SelectItem><SelectItem value="off">Выключено</SelectItem></SelectContent></Select></div>
          <div className="rounded-md border p-3">Последнее обновление: <span className="text-muted-foreground italic">Нет данных</span></div>
          <Button variant="outline" onClick={soon}>Запустить сейчас</Button>
        </CardContent></Card></TabsContent>
        <TabsContent value="api"><Card><CardContent className="space-y-3 pt-6 text-sm">
          <p>REST API для CRM и 1С: поставщики, условия, история, статусы, оценки, инкрементальная выгрузка.</p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{`GET /api/public/v1/suppliers?updated_since=2026-10-01T00:00:00Z&page=1
GET /api/public/v1/suppliers/{id}
GET /api/public/v1/suppliers/{id}/interactions
Authorization: Bearer <ключ API>`}</pre>
          <Button variant="outline" onClick={soon}>Создать ключ API</Button>
        </CardContent></Card></TabsContent>
      </Tabs>
    </>
  );
}
