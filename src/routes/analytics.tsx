import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, PIPELINE, STATUS_LABELS, totalScore } from "@/lib/fixtures";
import { useSuppliers } from "@/lib/use-suppliers";
import { PageHeader, Stat } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/analytics")({
  head: () => meta("Аналитика", "Показатели базы поставщиков, воронка сотрудничества и активность."),
  component: Analytics,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tooltipStyle = {
  contentStyle: { background: "#11192b", border: "1px solid rgba(173,154,255,.55)", borderRadius: 12, boxShadow: "0 16px 36px rgba(0,0,0,.45)", padding: "10px 14px" },
  labelStyle: { color: "#f4f7ff", fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: "#dcd4ff", fontWeight: 600 },
  cursor: { fill: "rgba(173,154,255,.12)" },
};
const count = <T,>(arr: T[], f: (x: T) => string) => Object.entries(arr.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {})).map(([name, value]) => ({ name, value }));

function Analytics() {
  const { items, loading, error, reload } = useSuppliers();
  const byGroup = count(items, (s) => CATEGORIES[s.group].label);
  const byCity = count(items, (s) => s.city);
  const funnel = PIPELINE.map((p) => ({ name: STATUS_LABELS[p], value: items.filter((s) => s.status === p).length }));
  const completeness = ["0–39", "40–69", "70–100"].map((name, index) => ({ name, value: items.filter((s) => index === 0 ? s.confidence < 40 : index === 1 ? s.confidence < 70 && s.confidence >= 40 : s.confidence >= 70).length }));
  const average = items.length ? Math.round(items.reduce((n, s) => n + totalScore(s), 0) / items.length) : 0;
  const box = (title: string, el: React.ReactElement) => <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer>{el}</ResponsiveContainer></CardContent></Card>;
  return (
    <>
      <PageHeader title="Аналитика" />
      {loading && <p role="status" className="mt-4 text-sm text-muted-foreground">Загружаем данные…</p>}
      {error && <div role="alert" className="mt-4 rounded-lg border border-destructive p-4 text-sm">{error} <Button variant="outline" size="sm" onClick={reload}>Повторить</Button></div>}
      {!loading && !error && <>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Всего поставщиков" value={items.length} />
        <Stat label="Средняя оценка пригодности" value={average} hint="не оценка надёжности" />
        <Stat label="Подтверждено сотрудниками" value={`${items.length ? Math.round(items.filter((s) => s.verified).length / items.length * 100) : 0}%`} />
        <Stat label="Сотрудничаем" value={items.filter((s) => s.status === "active").length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {box("По категориям", <PieChart><Pie data={byGroup} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>{byGroup.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip {...tooltipStyle} /></PieChart>)}
        {box("По городам", <BarChart data={byCity}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip {...tooltipStyle} /><Bar dataKey="value" name="Поставщиков" fill="var(--chart-1)" radius={4} /></BarChart>)}
        {box("Полнота карточек", <BarChart data={completeness}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip {...tooltipStyle} labelFormatter={(label) => `Полнота ${label}%`} formatter={(value) => [value, "Поставщиков"]} /><Bar dataKey="value" name="Поставщиков" fill="var(--chart-3)" radius={4} /></BarChart>)}
        {box("По статусам", <BarChart data={funnel} layout="vertical" margin={{ left: 60 }}><XAxis type="number" allowDecimals={false} fontSize={12} /><YAxis type="category" dataKey="name" fontSize={11} width={120} /><Tooltip {...tooltipStyle} /><Bar dataKey="value" name="Поставщиков" fill="var(--chart-2)" radius={4} /></BarChart>)}
      </div>
      </>}
    </>
  );
}

