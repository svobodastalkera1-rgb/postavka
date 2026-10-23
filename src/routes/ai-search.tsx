import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/ai-search")({
  head: () => meta("Подбор поставщиков", "Поиск и сравнение поставщиков по данным каталога."),
  component: () => <>
    <PageHeader title="AI пока не подключён" description="Для подбора поставщиков используйте фильтры каталога и сравнение. Ответы внешней модели не имитируются." />
    <Button asChild><Link to="/discovery">Перейти к поиску</Link></Button>
  </>,
});
