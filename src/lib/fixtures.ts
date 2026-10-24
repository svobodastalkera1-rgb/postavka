// ДЕМО-ДАННЫЕ ЭТАПА 1. Вымышленные компании, не реальные поставщики.
// Будут заменены данными из базы на этапе 2.

export type Status =
  | "discovered" | "review" | "contact_planned" | "contacted" | "quote_requested"
  | "quote_received" | "negotiation" | "active" | "rejected" | "ended";

export const STATUS_LABELS: Record<Status, string> = {
  discovered: "Обнаружен",
  review: "На проверке",
  contact_planned: "Планируется контакт",
  contacted: "Связались",
  quote_requested: "Запрошено КП",
  quote_received: "Получено КП",
  negotiation: "Переговоры",
  active: "Сотрудничаем",
  rejected: "Отклонён",
  ended: "Сотрудничество завершено",
};
export const PIPELINE: Status[] = ["discovered", "review", "contact_planned", "contacted", "quote_requested", "quote_received", "negotiation", "active"];

export const CATEGORIES = {
  food: { label: "Продукты питания", subs: ["Ингредиенты", "Бакалея", "Готовая еда", "Полуфабрикаты", "Напитки"] },
  consumables: { label: "Расходные материалы", subs: ["Упаковка", "Салфетки", "Бумажная посуда", "Одноразовые контейнеры", "Сопутствующие товары"] },
} as const;

export type Supplier = {
  id: string;
  name: string;
  legalName: string | null;
  inn: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  regions: string[];
  group: "food" | "consumables";
  categories: string[];
  assortment: string[];
  prices: { item: string; price: number; unit: string }[];
  minOrder: string | null;
  minOrderRub: number | null;
  delivery: string | null;
  hasDelivery: boolean | null;
  documents: string[];
  rating: number | null;
  score: { assortment: number; logistics: number; commercial: number; reliability: number; history: number | null };
  confidence: number;
  confidenceOverride?: { value: number; reason: string } | null;
  updatedAt?: string;
  status: Status;
  blacklisted: { reason: string; author: string; date: string } | null;
  favorite: boolean;
  verified: boolean;
  workedWith: boolean;
  contacts: { name: string; role: string; phone: string | null; email: string | null; details?: string | null }[];
  notes: string | null;
  discoveredAt: string;
  verifiedAt: string | null;
  sources: { url: string; date: string }[];
};

export const SUPPLIERS: Supplier[] = [
  {
    id: "s1", name: "УралПак (демо)", legalName: "ООО «УралПак-Демо»", inn: "6600000001", website: "https://example.com/uralpak",
    phone: "+7 343 000-00-01", email: "sales@example.com", address: "г. Екатеринбург, ул. Демонстрационная, 1", city: "Екатеринбург",
    regions: ["Свердловская область", "Челябинская область"], group: "consumables", categories: ["Одноразовые контейнеры", "Упаковка"],
    assortment: ["Контейнеры из крафт-картона 500 мл", "Ланч-боксы", "Пакеты бумажные"],
    prices: [{ item: "Контейнер крафт 500 мл", price: 6.4, unit: "шт" }], minOrder: "10 000 ₽", minOrderRub: 10000,
    delivery: "Бесплатно по Екатеринбургу от 20 000 ₽", hasDelivery: true, documents: ["Декларация ТР ТС 005/2011"], rating: 4.6,
    score: { assortment: 88, logistics: 82, commercial: 74, reliability: 90, history: 85 }, confidence: 92, status: "active",
    blacklisted: null, favorite: true, verified: true, workedWith: true,
    contacts: [{ name: "Иван Демидов", role: "Менеджер по продажам", phone: "+7 900 000-00-01", email: "ivan@example.com" }],
    notes: "Стабильные поставки, отсрочка 14 дней.", discoveredAt: "2026-03-12", verifiedAt: "2026-10-01",
    sources: [{ url: "https://example.com/uralpak", date: "2026-03-12" }],
  },
  {
    id: "s2", name: "ЭкоТара Урал (демо)", legalName: "ООО «ЭкоТара-Демо»", inn: null, website: "https://example.com/ecotara",
    phone: "+7 343 000-00-02", email: null, address: "г. Березовский", city: "Березовский",
    regions: ["Свердловская область"], group: "consumables", categories: ["Бумажная посуда", "Одноразовые контейнеры"],
    assortment: ["Бумажные стаканы 250 мл", "Контейнеры бумажные 750 мл"],
    prices: [{ item: "Контейнер бумажный 750 мл", price: 7.9, unit: "шт" }], minOrder: "5 000 ₽", minOrderRub: 5000,
    delivery: "Доставка по области, 2–3 дня", hasDelivery: true, documents: [], rating: null,
    score: { assortment: 80, logistics: 70, commercial: 78, reliability: 55, history: null }, confidence: 61, status: "quote_requested",
    blacklisted: null, favorite: false, verified: false, workedWith: false, contacts: [], notes: null,
    discoveredAt: "2026-10-15", verifiedAt: null, sources: [{ url: "https://example.com/ecotara", date: "2026-10-15" }],
  },
  {
    id: "s3", name: "Фермерский двор (демо)", legalName: "ИП Демонстрационный А. А.", inn: "660000000002", website: "https://example.com/farm",
    phone: null, email: "farm@example.com", address: "Сысертский район", city: "Сысерть",
    regions: ["Свердловская область"], group: "food", categories: ["Ингредиенты", "Полуфабрикаты"],
    assortment: ["Творог 5%", "Сыр полутвёрдый", "Пельмени ручной лепки"],
    prices: [{ item: "Творог 5%", price: 420, unit: "кг" }], minOrder: null, minOrderRub: null,
    delivery: null, hasDelivery: null, documents: ["Ветеринарные свидетельства (Меркурий)"], rating: 4.1,
    score: { assortment: 72, logistics: 50, commercial: 60, reliability: 68, history: null }, confidence: 58, status: "review",
    blacklisted: null, favorite: true, verified: false, workedWith: false, contacts: [], notes: "Уточнить объёмы.",
    discoveredAt: "2026-09-28", verifiedAt: null, sources: [{ url: "https://example.com/farm", date: "2026-09-28" }],
  },
  {
    id: "s4", name: "Кухня Плюс (демо)", legalName: "ООО «Кухня Плюс-Демо»", inn: "6600000004", website: "https://example.com/kitchen",
    phone: "+7 343 000-00-04", email: "b2b@example.com", address: "г. Екатеринбург, ул. Примерная, 15", city: "Екатеринбург",
    regions: ["Екатеринбург"], group: "food", categories: ["Готовая еда"],
    assortment: ["Сэндвичи", "Салаты в контейнерах", "Супы охлаждённые"],
    prices: [{ item: "Сэндвич с курицей", price: 89, unit: "шт" }], minOrder: "30 000 ₽", minOrderRub: 30000,
    delivery: "Ежедневно, до 7:00", hasDelivery: true, documents: ["Декларация ТР ТС 021/2011", "Сертификат ХАССП"], rating: 4.3,
    score: { assortment: 85, logistics: 90, commercial: 62, reliability: 84, history: 70 }, confidence: 86, status: "negotiation",
    blacklisted: null, favorite: false, verified: true, workedWith: true,
    contacts: [{ name: "Мария Примерова", role: "Коммерческий директор", phone: null, email: "maria@example.com" }],
    notes: null, discoveredAt: "2026-05-04", verifiedAt: "2026-09-20", sources: [{ url: "https://example.com/kitchen", date: "2026-05-04" }],
  },
  {
    id: "s5", name: "Салфет-Опт (демо)", legalName: null, inn: null, website: "https://example.com/salfet",
    phone: null, email: null, address: null, city: "Челябинск", regions: ["Челябинская область"], group: "consumables",
    categories: ["Салфетки"], assortment: ["Салфетки бумажные 24×24"], prices: [], minOrder: null, minOrderRub: null,
    delivery: null, hasDelivery: null, documents: [], rating: 2.1,
    score: { assortment: 40, logistics: 30, commercial: 35, reliability: 20, history: 10 }, confidence: 25, status: "ended",
    blacklisted: { reason: "Сорваны сроки поставки дважды", author: "Админ (демо)", date: "2026-08-02" },
    favorite: false, verified: false, workedWith: true, contacts: [], notes: null, discoveredAt: "2026-01-10", verifiedAt: null,
    sources: [{ url: "https://example.com/salfet", date: "2026-01-10" }],
  },
  {
    id: "s6", name: "НапиткиЕКБ (демо)", legalName: "ООО «Напитки-Демо»", inn: "6600000006", website: "https://example.com/drinks",
    phone: "+7 343 000-00-06", email: "order@example.com", address: "г. Екатеринбург", city: "Екатеринбург",
    regions: ["Свердловская область", "Тюменская область"], group: "food", categories: ["Напитки"],
    assortment: ["Морсы 0,5 л", "Вода питьевая 0,5 л", "Лимонады"],
    prices: [{ item: "Вода питьевая 0,5 л", price: 18, unit: "шт" }], minOrder: "15 000 ₽", minOrderRub: 15000,
    delivery: "2 раза в неделю", hasDelivery: true, documents: ["Декларация ТР ЕАЭС 044/2017"], rating: null,
    score: { assortment: 78, logistics: 76, commercial: 80, reliability: 74, history: null }, confidence: 77, status: "discovered",
    blacklisted: null, favorite: false, verified: false, workedWith: false, contacts: [], notes: null,
    discoveredAt: "2026-10-20", verifiedAt: null, sources: [{ url: "https://example.com/drinks", date: "2026-10-20" }],
  },
];

export function totalScore(s: Supplier) {
  const { assortment, logistics, commercial, reliability, history } = s.score;
  // Без истории сотрудничества вес 15% перераспределяется, чтобы не штрафовать новых поставщиков
  if (history === null) return Math.round((assortment * 0.3 + logistics * 0.2 + commercial * 0.2 + reliability * 0.15) / 0.85);
  return Math.round(assortment * 0.3 + logistics * 0.2 + commercial * 0.2 + reliability * 0.15 + history * 0.15);
}

export const getSupplier = (id: string) => SUPPLIERS.find((s) => s.id === id);

export type Event = { id: string; supplierId: string; type: string; text: string; author: string; date: string };
export const EVENTS: Event[] = [
  { id: "e1", supplierId: "s6", type: "Обнаружение", text: "Найден через интернет-поиск: «напитки оптом Екатеринбург»", author: "Система", date: "2026-10-20 14:10" },
  { id: "e2", supplierId: "s2", type: "Запрос КП", text: "Отправлен запрос КП на бумажные контейнеры 750 мл", author: "Ольга С. (демо)", date: "2026-10-18 11:32" },
  { id: "e3", supplierId: "s4", type: "Переговоры", text: "Обсудили снижение минимального заказа до 20 000 ₽", author: "Олег М. (демо)", date: "2026-10-16 16:05" },
  { id: "e4", supplierId: "s1", type: "Изменение профиля", text: "Цена «Контейнер крафт 500 мл»: 6,9 → 6,4 ₽", author: "Ольга С. (демо)", date: "2026-10-01 10:12" },
  { id: "e5", supplierId: "s3", type: "Звонок", text: "Первичный звонок, ждём прайс", author: "Олег М. (демо)", date: "2026-09-29 12:40" },
  { id: "e6", supplierId: "s5", type: "Чёрный список", text: "Добавлен в чёрный список: сорваны сроки поставки", author: "Админ (демо)", date: "2026-08-02 09:00" },
  { id: "e7", supplierId: "s1", type: "Изменение рейтинга", text: "Рейтинг: 4,4 → 4,6", author: "Админ (демо)", date: "2026-07-14 15:20" },
];

export const AUDIT = [
  { field: "Цена «Контейнер крафт 500 мл»", from: "6,9 ₽", to: "6,4 ₽", author: "Ольга С. (демо)", date: "2026-10-01 10:12", source: "Вручную" },
  { field: "Минимальный заказ", from: "Нет данных", to: "10 000 ₽", author: "Система", date: "2026-03-12 09:00", source: "example.com/uralpak" },
];

export const CONFLICTS = [
  { supplierId: "s1", field: "Телефон", verified: "+7 343 000-00-01", proposed: "+7 343 000-00-99", source: "example.com/uralpak", date: "2026-10-21" },
];

export const USERS = [
  { name: "Олег М. (демо)", email: "oleg@example.com", role: "Админ", lastSeen: "сегодня" },
  { name: "Ольга С. (демо)", email: "olga@example.com", role: "Пользователь", lastSeen: "вчера" },
];
