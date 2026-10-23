import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, totalScore, type Status, type Supplier } from "@/lib/fixtures";
import { ShieldCheck, Ban } from "lucide-react";
import type { ReactNode } from "react";

export function NoData({ value }: { value: ReactNode | null | undefined }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0))
    return <span className="text-muted-foreground italic">Нет данных</span>;
  return <>{value}</>;
}

const tone: Record<Status, string> = {
  discovered: "bg-secondary text-secondary-foreground",
  review: "bg-secondary text-secondary-foreground",
  contact_planned: "bg-accent text-accent-foreground",
  contacted: "bg-accent text-accent-foreground",
  quote_requested: "bg-warning-soft text-warning",
  quote_received: "bg-warning-soft text-warning",
  negotiation: "bg-warning-soft text-warning",
  active: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-destructive",
  ended: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant="outline" className={`border-transparent font-medium ${tone[status]}`}>{STATUS_LABELS[status]}</Badge>;
}

export function Flags({ s }: { s: Supplier }) {
  return (
    <span className="inline-flex gap-1">
      {s.verified && <ShieldCheck className="size-4 text-success" aria-label="Проверено" />}
      {s.blacklisted && <Ban className="size-4 text-destructive" aria-label="В чёрном списке" />}
    </span>
  );
}

export function ScorePill({ s }: { s: Supplier }) {
  const v = totalScore(s);
  const c = v >= 75 ? "bg-success-soft text-success" : v >= 55 ? "bg-warning-soft text-warning" : "bg-danger-soft text-destructive";
  return <span className={`inline-flex min-w-10 justify-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${c}`}>{v}</span>;
}

export function SupplierLink({ s }: { s: Supplier }) {
  return <Link to="/suppliers/$id" params={{ id: s.id }} className="font-medium text-foreground hover:text-primary">{s.name}</Link>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="glass-card rounded-lg border p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Pending({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed bg-muted/50 p-3 text-xs text-muted-foreground">{children}</div>;
}
