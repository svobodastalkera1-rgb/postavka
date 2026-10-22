import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard, Building2, Globe, Sparkles, Columns3, Clover, Star, Ban, History, BarChart3, Settings, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Обзор", icon: LayoutDashboard },
  { to: "/suppliers", label: "Справочник поставщиков", icon: Building2 },
  { to: "/discovery", label: "Поиск в интернете", icon: Globe },
  { to: "/ai-search", label: "ИИ-поиск по базе", icon: Sparkles },
  { to: "/compare", label: "Сравнение", icon: Columns3 },
  { to: "/lucky", label: "Мне повезёт!", icon: Clover },
  { to: "/favorites", label: "Избранное", icon: Star },
  { to: "/blacklist", label: "Чёрный список", icon: Ban },
  { to: "/history", label: "История взаимодействий", icon: History },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/admin", label: "Администрирование", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link key={to} to={to} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60"}`}>
            <Icon className={`size-4 ${active ? "text-sidebar-primary" : ""}`} />{label}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex-col bg-sidebar py-5 ${open ? "flex" : "hidden"} lg:flex`}>
        <div className="mb-6 flex items-center justify-between px-6">
          <div>
            <div className="text-base font-semibold text-sidebar-accent-foreground">Supplier Intelligence</div>
            <div className="text-xs text-sidebar-foreground/70">ЖизньМарт · Закупки</div>
          </div>
          <button className="text-sidebar-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Закрыть меню"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="mx-3 mt-4 flex items-center justify-between rounded-md border border-sidebar-border px-3 py-2">
          <div className="text-xs">
            <div className="text-sidebar-accent-foreground">Олег М. (демо)</div>
            <div className="text-sidebar-foreground/70">Админ</div>
          </div>
          <Link to="/auth" className="text-sidebar-foreground hover:text-sidebar-accent-foreground" aria-label="Выйти"><LogOut className="size-4" /></Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <div className="flex items-center gap-3 border-b bg-warning-soft px-4 py-1.5 text-xs text-warning">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Открыть меню"><Menu className="size-4" /></button>
          Этап 1 · Демо-данные: все компании и цифры вымышлены и служат только для просмотра интерфейса.
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
