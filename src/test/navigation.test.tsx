import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app/AppShell";

vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => "/suppliers",
  useNavigate: () => () => {},
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

describe("Навигация закупщика", () => {
  it("показывает единый каталог с поиском и предупреждает о проверке сведений", () => {
    render(<AppShell><p>Карточка</p></AppShell>);
    const nav = screen.getByRole("navigation", { name: "Основная навигация" });
    expect(nav.querySelectorAll("a")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Каталог и поиск" })).toHaveAttribute("href", "/suppliers");
    expect(screen.getByRole("link", { name: "Настройки" })).toHaveAttribute("href", "/admin");
    expect(screen.getByText(/сведения собраны из открытых источников/i)).toBeInTheDocument();
    expect(screen.getByText("Поставка")).toBeInTheDocument();
  });
});
