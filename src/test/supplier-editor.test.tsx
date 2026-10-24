import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SupplierEditor } from "../components/app/SupplierEditor";
import { getSupplier } from "../lib/fixtures";

const updateSupplier = vi.fn();
vi.mock("../lib/api-client", () => ({ updateSupplier: (...args: unknown[]) => updateSupplier(...args) }));

test("цена и товар редактируются без разделителя и сохраняют пробелы", async () => {
  const supplier = { ...getSupplier("s1")!, prices: [] };
  updateSupplier.mockResolvedValue(supplier);
  render(<SupplierEditor supplier={supplier} section="commerce" onOpenChange={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Добавить позицию" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Товар или услуга" }), { target: { value: "Пакеты | большие белые" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Цена, ₽" }), { target: { value: "12.5" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Единица" }), { target: { value: "100 шт" } });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить блок" }));
  await waitFor(() => expect(updateSupplier).toHaveBeenCalledWith(supplier.id, expect.objectContaining({ prices: [{ item: "Пакеты | большие белые", price: 12.5, unit: "100 шт" }] })));
});

test("списки и источники не разбиваются по пробелам и вертикальной черте", async () => {
  const supplier = { ...getSupplier("s1")!, regions: [], sources: [] };
  updateSupplier.mockResolvedValue(supplier);
  render(<SupplierEditor supplier={supplier} section="info" onOpenChange={vi.fn()} onSaved={vi.fn()} />);
  fireEvent.click(screen.getAllByRole("button", { name: /^Добавить$/ })[0]!);
  fireEvent.change(screen.getByRole("textbox", { name: "Регионы: запись 1" }), { target: { value: "Свердловская область | север" } });
  fireEvent.click(screen.getByRole("button", { name: "Добавить источник" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Ссылка" }), { target: { value: "https://example.test/company?name=Big%20Food" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Дата проверки" }), { target: { value: "2026-10-24" } });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить блок" }));
  await waitFor(() => expect(updateSupplier).toHaveBeenCalledWith(supplier.id, expect.objectContaining({ regions: ["Свердловская область | север"], sources: [{ url: "https://example.test/company?name=Big%20Food", date: "2026-10-24" }] })));
});

