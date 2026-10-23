import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app/AppShell";

vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => "/suppliers",
  useNavigate: () => () => {},
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

describe("Навигация закупщика", () => {
  it("оставляет пять основных разделов и явно обозначает демонстрационные данные", () => {
    render(<AppShell><p>Карточка</p></AppShell>);
    const nav = screen.getByRole("navigation", { name: "Основная навигация" });
    expect(nav.querySelectorAll("a")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Поиск поставщиков" })).toHaveAttribute("href", "/discovery");
    expect(screen.getByRole("link", { name: "Настройки" })).toHaveAttribute("href", "/admin");
    expect(screen.getByText(/начальный каталог содержит вымышленные компании/i)).toBeInTheDocument();
    expect(screen.getByText("Поставка")).toBeInTheDocument();
  });
});
