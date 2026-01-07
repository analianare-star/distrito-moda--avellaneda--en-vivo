export enum StreamStatus {
  LIVE = 'LIVE', // En curso
  UPCOMING = 'UPCOMING', // Programado
  FINISHED = 'FINISHED', // Finalizado
  MISSED = 'MISSED', // No realizado (Threshold de reportes alcanzado)
  CANCELLED = 'CANCELLED', // Cancelado por tienda/admin
  BANNED = 'BANNED', // Interrumpido por admin
  PENDING_REPROGRAMMATION = 'PENDING_REPROGRAMMATION' // Reprogramacion pendiente
}

export type ViewMode = 'CLIENT' | 'MERCHANT' | 'ADMIN';

export type ShopPlan = 'Estandar' | 'Alta Visibilidad' | 'Maxima Visibilidad';

export type DataIntegrityStatus = 'INSUFFICIENT' | 'MINIMAL' | 'COMPLETE';

export type ShopStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'AGENDA_SUSPENDED' | 'HIDDEN' | 'BANNED';

export type SocialPlatform = 'Instagram' | 'TikTok' | 'Facebook' | 'YouTube';

export type WhatsappLabel = 'Ventas por mayor' | 'Ventas por menor' | 'Consulta ingreso' | 'Envíos' | 'Reclamos';

export interface WhatsappLine {
  label: WhatsappLabel;
  number: string;
}

export interface SocialHandles {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
}

export interface QuotaWalletSnapshot {
  weeklyLiveBaseLimit: number;
  weeklyLiveUsed: number;
  liveExtraBalance: number;
  reelDailyLimit: number;
  reelDailyUsed: number;
  reelExtraBalance: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment?: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: 'SYSTEM' | 'REMINDER' | 'PURCHASE';
  refId?: string | null;
  notifyAt?: string | null;
}

// Nuevo Modelo de Penalización
export interface Penalty {
    id: string;
    reason: string;
    dateISO: string;
    active: boolean; // Si es true, bloquea agendamiento
}

// Nuevo Modelo de Reel / Historia
export interface Reel {
  id: string;
  shopId: string;
  shopName: string; // Desnormalizado para facilitar UI admin
  shopLogo: string; // Desnormalizado
  url: string;
  thumbnail?: string; // Opcional
  createdAtISO: string;
  expiresAtISO: string; // createdAt + 24h
  status: 'ACTIVE' | 'EXPIRED' | 'HIDDEN';
  origin: 'PLAN' | 'EXTRA';
  platform: SocialPlatform;
}

export interface Shop {
  id: string;
  name: string;
  razonSocial?: string; 
  cuit?: string; 
  email?: string; 
  password?: string; // New: for admin creation
  memberSince?: string; 
  logoUrl: string;
  coverUrl?: string; 
  
  // Modelo de Plan y Cupos (Vivos)
  plan: ShopPlan;
  status?: ShopStatus;
  statusReason?: string;
  statusChangedAt?: string;
  ownerAcceptedAt?: string;
  agendaSuspendedUntil?: string;
  agendaSuspendedReason?: string;
  baseQuota: number; // Cupos base del plan (0, 1, 3)
  extraQuota: number; // Cupos adicionales comprados
  quotaUsed: number; // Consumidos en el ciclo actual
  
  // Modelo de Cupos (Reels) - NEW
  reelsExtraQuota: number; 
  quotaWallet?: QuotaWalletSnapshot;

  whatsappLines: WhatsappLine[]; 
  website?: string; 
  address?: string; 
  addressDetails?: {
      street: string;
      number: string;
      city: string;
      province: string;
      zip: string;
      mapsUrl?: string;
  };
  socialHandles: SocialHandles;
  
  minimumPurchase?: number;
  paymentMethods?: string[];

  dataIntegrity: DataIntegrityStatus;
  
  // Penalizaciones
  isPenalized: boolean; // Flag general
  penalties: Penalty[]; // Historial de penalizaciones
  
  reviews: Review[];
  ratingAverage: number;
  ratingCount?: number;
}

export interface Stream {
  id: string;
  shop: Shop; 
  shopId: string; 
  title: string;
  coverImage: string;
  
  // Estado y Tiempo
  status: StreamStatus;
  extensionCount: number; // 0-3, each adds 30 minutes
  
  scheduledTime: string; // HH:mm estricta
  fullDateISO: string; // Fecha estricta
  startedAt?: number; 
  
  platform: SocialPlatform;
  url?: string; 
  
  // Métricas
  views: number;
  reportCount: number; 
  isVisible: boolean; 
  likes: number;
  rating?: number; 
}

export interface UserPreferences {
    theme: 'light' | 'dark';
    notifications: boolean;
}

// Modelo Unificado de Cliente (Anónimo / Logueado)
export interface UserContext {
  id: string; 
  isLoggedIn: boolean; // Determina si es Anónimo o Registrado
  
  // Datos Logueado
  email?: string; 
  name?: string;

  // Persistencia (Local para Anónimo, Server para Logueado)
  favorites: string[]; 
  reminders: string[]; 
  history: string[]; // Historial de visitas
  viewedReels: string[]; // IDs de reels vistos - NEW
  notifications?: NotificationItem[];
  
  reports: { streamId: string; timestamp: number }[]; 
  preferences: UserPreferences;
}
