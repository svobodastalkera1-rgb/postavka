import { createFileRoute, Navigate } from "@tanstack/react-router";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/discovery")({
  head: () => meta("Поиск поставщиков", "Поиск по сохранённому каталогу поставщиков."),
  component: () => <Navigate to="/suppliers" replace />,
});
