import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SUPPLIERS } from "@/lib/fixtures";
import { PageHeader, SupplierLink } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/blacklist")({
  head: () => meta("Чёрный список", "Поставщики, исключённые из рекомендаций, с причинами."),
  component: () => {
    const list = SUPPLIERS.filter((s) => s.blacklisted);
    return (
      <>
        <PageHeader title="Чёрный список" description="Эти поставщики не попадают в автоматические рекомендации. Управляют администраторы." />
        <div className="rounded-lg border bg-card"><Table>
          <TableHeader><TableRow><TableHead>Поставщик</TableHead><TableHead>Причина</TableHead><TableHead>Автор</TableHead><TableHead>Дата</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{list.map((s) => <TableRow key={s.id}>
            <TableCell><SupplierLink s={s} /></TableCell><TableCell>{s.blacklisted!.reason}</TableCell>
            <TableCell>{s.blacklisted!.author}</TableCell><TableCell className="font-mono text-xs">{s.blacklisted!.date}</TableCell>
            <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => toast("Заработает на этапе 2")}>Убрать</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table></div>
      </>
    );
  },
});
