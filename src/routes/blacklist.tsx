import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Supplier } from "@/lib/fixtures";
import { suppliers } from "@/lib/api-client";
import { PageHeader, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/blacklist")({
  head: () => meta("Чёрный список", "Поставщики, исключённые из рекомендаций, с причинами."),
  component: () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<Supplier[]>([]);
    useEffect(() => { suppliers().then((result) => setItems(result.items)); }, []);
    const list = items.filter((s) => s.blacklisted);
    return (
      <>
        <PageHeader title="Чёрный список" description="Эти поставщики не попадают в автоматические рекомендации." />
        <div className="glass-card rounded-lg border"><Table>
          <TableHeader><TableRow><TableHead>Поставщик</TableHead><TableHead>Причина</TableHead><TableHead>Автор</TableHead><TableHead>Дата</TableHead></TableRow></TableHeader>
          <TableBody>{list.map((s) => <TableRow key={s.id} className="supplier-row" onClick={(event) => {
            if ((event.target as Element).closest("a, button")) return;
            navigate({ to: "/suppliers/$id", params: { id: s.id } });
          }}>
            <TableCell><SupplierLink s={s} /></TableCell><TableCell>{s.blacklisted!.reason}</TableCell>
            <TableCell>{s.blacklisted!.author}</TableCell><TableCell className="font-mono text-xs">{s.blacklisted!.date}</TableCell>
          </TableRow>)}</TableBody>
        </Table></div>
      </>
    );
  },
});
