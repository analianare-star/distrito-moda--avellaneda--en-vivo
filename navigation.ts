export type AdminTab =
  | "DASHBOARD"
  | "AGENDA"
  | "STREAMS"
  | "SHOPS"
  | "REELS"
  | "ADMIN"
  | "REPORTS";
export type MerchantTab = "RESUMEN" | "VIVOS" | "REELS" | "REDES" | "PERFIL";
export type ClientNavId =
  | "home"
  | "shops"
  | "live"
  | "map"
  | "reminders"
  | "account"
  | "favorites";
export type AdminNavId = "panel" | "shops" | "streams" | "purchases" | "reports";
export type MerchantNavId = "resumen" | "vivos" | "reels" | "redes" | "perfil";
export type ClientNavItemSpec = {
  id: ClientNavId;
  label: string;
  isCenter: boolean;
};
export type AdminNavItemSpec = {
  id: AdminNavId;
  label: string;
  isCenter: boolean;
};
export type MerchantNavItemSpec = {
  id: MerchantNavId;
  label: string;
  isCenter: boolean;
};

export const CLIENT_NAV_ITEMS: ClientNavItemSpec[] = [
  { id: "home", label: "Inicio", isCenter: false },
  { id: "shops", label: "Tiendas", isCenter: false },
  { id: "live", label: "En vivo", isCenter: true },
  { id: "map", label: "Mapa", isCenter: false },
  { id: "account", label: "Cuenta", isCenter: false },
];

export const ADMIN_NAV_ITEMS: AdminNavItemSpec[] = [
  { id: "shops", label: "Tiendas", isCenter: false },
  { id: "streams", label: "Vivos", isCenter: false },
  { id: "panel", label: "Panel", isCenter: true },
  { id: "purchases", label: "Compras", isCenter: false },
  { id: "reports", label: "Reportes", isCenter: false },
];

export const MERCHANT_NAV_ITEMS: MerchantNavItemSpec[] = [
  { id: "resumen", label: "Resumen", isCenter: false },
  { id: "redes", label: "Redes", isCenter: false },
  { id: "vivos", label: "Vivos", isCenter: true },
  { id: "reels", label: "Reels", isCenter: false },
  { id: "perfil", label: "Perfil", isCenter: false },
];

export const CLIENT_NAV_CONFIG: Record<
  ClientNavId,
  {
    path: string;
    navId?: ClientNavId;
    filter?: "Todos" | "En Vivo";
    savedTab?: "FAVORITES" | "REMINDERS";
  }
> = {
  home: { path: "/", filter: "Todos" },
  shops: { path: "/tiendas" },
  live: { path: "/en-vivo", filter: "En Vivo" },
  map: { path: "/mapa" },
  reminders: { path: "/recordatorios", savedTab: "REMINDERS" },
  favorites: { path: "/favoritos", savedTab: "FAVORITES", navId: "reminders" },
  account: { path: "/cuenta" },
};

export const CLIENT_PATH_TO_NAV: Record<string, ClientNavId> = {
  "/": "home",
  "/tiendas": "shops",
  "/en-vivo": "live",
  "/mapa": "map",
  "/recordatorios": "reminders",
  "/favoritos": "favorites",
  "/cuenta": "account",
};

export const ADMIN_NAV_TO_TAB: Record<AdminNavId, AdminTab> = {
  panel: "DASHBOARD",
  shops: "SHOPS",
  streams: "STREAMS",
  purchases: "ADMIN",
  reports: "REPORTS",
};

export const ADMIN_TAB_CONFIG: Record<AdminTab, { path: string; navId: AdminNavId }> =
  {
    DASHBOARD: { path: "/admin", navId: "panel" },
    AGENDA: { path: "/admin/agenda", navId: "panel" },
    STREAMS: { path: "/admin/vivos", navId: "streams" },
    SHOPS: { path: "/admin/tiendas", navId: "shops" },
    REELS: { path: "/admin/reels", navId: "panel" },
    ADMIN: { path: "/admin/compras", navId: "purchases" },
    REPORTS: { path: "/admin/reportes", navId: "reports" },
  };

export const MERCHANT_NAV_TO_TAB: Record<MerchantNavId, MerchantTab> = {
  resumen: "RESUMEN",
  vivos: "VIVOS",
  reels: "REELS",
  redes: "REDES",
  perfil: "PERFIL",
};

export const MERCHANT_TAB_CONFIG: Record<
  MerchantTab,
  { path: string; navId: MerchantNavId }
> = {
  RESUMEN: { path: "/tienda", navId: "resumen" },
  VIVOS: { path: "/tienda/vivos", navId: "vivos" },
  REELS: { path: "/tienda/reels", navId: "reels" },
  REDES: { path: "/tienda/redes", navId: "redes" },
  PERFIL: { path: "/tienda/perfil", navId: "perfil" },
};

export const resolveAdminTabFromPath = (path: string): AdminTab => {
  if (path.startsWith("/admin/tiendas")) return "SHOPS";
  if (path.startsWith("/admin/vivos")) return "STREAMS";
  if (path.startsWith("/admin/agenda")) return "AGENDA";
  if (path.startsWith("/admin/reels")) return "REELS";
  if (path.startsWith("/admin/compras")) return "ADMIN";
  if (path.startsWith("/admin/reportes")) return "REPORTS";
  return "DASHBOARD";
};

export const resolveMerchantTabFromPath = (path: string): MerchantTab => {
  if (path.startsWith("/tienda/vivos")) return "VIVOS";
  if (path.startsWith("/tienda/reels")) return "REELS";
  if (path.startsWith("/tienda/redes")) return "REDES";
  if (path.startsWith("/tienda/perfil")) return "PERFIL";
  return "RESUMEN";
};

export const resolveClientNavFromPath = (path: string): ClientNavId | null =>
  CLIENT_PATH_TO_NAV[path] || null;
