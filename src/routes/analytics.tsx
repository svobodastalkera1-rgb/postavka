import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, PIPELINE, STATUS_LABELS, SUPPLIERS } from "@/lib/fixtures";
import { PageHeader, Pending, Stat } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/analytics")({
  head: () => meta("Аналитика", "Показатели базы поставщиков, воронка сотрудничества и активность."),
  component: Analytics,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const count = <T,>(arr: T[], f: (x: T) => string) => Object.entries(arr.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {})).map(([name, value]) => ({ name, value }));

function Analytics() {
  const byGroup = count(SUPPLIERS, (s) => CATEGORIES[s.group].label);
  const byCity = count(SUPPLIERS, (s) => s.city);
  const funnel = PIPELINE.map((p) => ({ name: STATUS_LABELS[p], value: SUPPLIERS.filter((s) => PIPELINE.indexOf(s.status) >= PIPELINE.indexOf(p)).length }));
  const rated = SUPPLIERS.filter((s) => s.rating !== null);
  const searches = [{ d: "Пн", v: 4 }, { d: "Вт", v: 7 }, { d: "Ср", v: 5 }, { d: "Чт", v: 9 }, { d: "Пт", v: 6 }];
  const box = (title: string, el: React.ReactElement) => <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer>{el}</ResponsiveContainer></CardContent></Card>;
  return (
    <>
      <PageHeader title="Аналитика" />
      <Pending>Демо-данные. С этапа 2 все показатели считаются из базы.</Pending>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Всего поставщиков" value={SUPPLIERS.length} />
        <Stat label="Средний рейтинг" value={(rated.reduce((a, s) => a + s.rating!, 0) / rated.length).toFixed(1)} hint={`по ${rated.length} оценённым`} />
        <Stat label="Покрытие проверкой" value={`${Math.round(SUPPLIERS.filter((s) => s.verified).length / SUPPLIERS.length * 100)}%`} />
        <Stat label="Конверсия в активных" value={`${Math.round(SUPPLIERS.filter((s) => s.status === "active").length / SUPPLIERS.length * 100)}%`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {box("По категориям", <PieChart><Pie data={byGroup} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>{byGroup.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart>)}
        {box("По городам", <BarChart data={byCity}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="value" name="Поставщиков" fill="var(--chart-1)" radius={4} /></BarChart>)}
        {box("Воронка сотрудничества", <BarChart data={funnel} layout="vertical" margin={{ left: 60 }}><XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="name" fontSize={11} width={120} /><Tooltip /><Bar dataKey="value" name="Поставщиков" fill="var(--chart-3)" radius={4} /></BarChart>)}
        {box("Поисковая активность", <LineChart data={searches}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="d" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Line dataKey="v" name="Поисков" stroke="var(--chart-2)" strokeWidth={2} /></LineChart>)}
      </div>
    </>
  );
}
