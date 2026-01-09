import {
  Shop,
  Stream,
  Reel,
  UserContext,
  SocialHandles,
  WhatsappLine,
  ShopPlan,
  SocialPlatform,
  StreamStatus,
} from '../types';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const buildHeaders = async (options: { json?: boolean; headers?: Record<string, string> } = {}) => {
  const baseHeaders: Record<string, string> = {};
  if (options.json) {
    baseHeaders['Content-Type'] = 'application/json';
  }
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }
  return options.headers ? { ...baseHeaders, ...options.headers } : baseHeaders;
};

const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
  const headers = await buildHeaders({
    json: Boolean(options.body),
    headers: options.headers as Record<string, string> | undefined,
  });
  return fetch(`${API_URL}${path}`, { ...options, headers });
};

const PLAN_BY_BACKEND: Record<string, ShopPlan> = {
  basic: 'Estandar',
  estandar: 'Estandar',
  premium: 'Alta Visibilidad',
  alta: 'Alta Visibilidad',
  'alta visibilidad': 'Alta Visibilidad',
  pro: 'Maxima Visibilidad',
  maxima: 'Maxima Visibilidad',
  'maxima visibilidad': 'Maxima Visibilidad',
};

const normalizePlan = (value: unknown): ShopPlan => {
  const plan = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return PLAN_BY_BACKEND[plan] || 'Estandar';
};

const normalizeShopStatus = (value: unknown) => {
  if (value === 'PENDING_VERIFICATION') return 'PENDING_VERIFICATION';
  if (value === 'ACTIVE') return 'ACTIVE';
  if (value === 'AGENDA_SUSPENDED') return 'AGENDA_SUSPENDED';
  if (value === 'HIDDEN') return 'HIDDEN';
  if (value === 'BANNED') return 'BANNED';
  return 'ACTIVE';
};

const mapSocialHandles = (handles: any[]): SocialHandles => {
  const result: SocialHandles = {};
  if (!Array.isArray(handles)) return result;

  handles.forEach((handle) => {
    const key = typeof handle?.platform === 'string' ? handle.platform.toLowerCase() : '';
    if (key === 'instagram') result.instagram = handle.handle;
    if (key === 'tiktok') result.tiktok = handle.handle;
    if (key === 'facebook') result.facebook = handle.handle;
    if (key === 'youtube') result.youtube = handle.handle;
  });

  return result;
};

const mapWhatsappLines = (lines: any[]): WhatsappLine[] => {
  if (!Array.isArray(lines)) return [];
  return lines
    .filter((line) => line?.number)
    .map((line) => ({
      label: line.label,
      number: line.number,
    }));
};

const mapShop = (shop: any): Shop => {
  const penalties = Array.isArray(shop?.penalties) ? shop.penalties : [];
  const status = normalizeShopStatus(shop?.status);
  const quotaWallet = shop?.quotaWallet
    ? {
        weeklyLiveBaseLimit: Number(shop.quotaWallet.weeklyLiveBaseLimit ?? 0),
        weeklyLiveUsed: Number(shop.quotaWallet.weeklyLiveUsed ?? 0),
        liveExtraBalance: Number(shop.quotaWallet.liveExtraBalance ?? 0),
        reelDailyLimit: Number(shop.quotaWallet.reelDailyLimit ?? 0),
        reelDailyUsed: Number(shop.quotaWallet.reelDailyUsed ?? 0),
        reelExtraBalance: Number(shop.quotaWallet.reelExtraBalance ?? 0),
      }
    : undefined;
  const liveBaseLimit = quotaWallet?.weeklyLiveBaseLimit ?? 0;
  const liveBaseUsed = quotaWallet?.weeklyLiveUsed ?? 0;
  const liveBaseRemaining = Math.max(0, liveBaseLimit - liveBaseUsed);
  const liveExtraBalance = quotaWallet?.liveExtraBalance ?? 0;
  const reelExtraBalance = quotaWallet?.reelExtraBalance ?? 0;
  return {
    ...shop,
    plan: normalizePlan(shop?.plan),
    status,
    statusReason: shop?.statusReason || undefined,
    statusChangedAt: shop?.statusChangedAt ? new Date(shop.statusChangedAt).toISOString() : undefined,
    agendaSuspendedUntil: shop?.agendaSuspendedUntil ? new Date(shop.agendaSuspendedUntil).toISOString() : undefined,
    agendaSuspendedReason: shop?.agendaSuspendedReason || undefined,
    ownerAcceptedAt: shop?.ownerAcceptedAt ? new Date(shop.ownerAcceptedAt).toISOString() : undefined,
    baseQuota: quotaWallet ? liveBaseRemaining : Number(shop?.streamQuota ?? shop?.baseQuota ?? 0),
    extraQuota: quotaWallet ? liveExtraBalance : Number(shop?.extraQuota ?? 0),
    reelsExtraQuota: quotaWallet ? reelExtraBalance : Number(shop?.reelQuota ?? shop?.reelsExtraQuota ?? 0),
    paymentMethods: shop?.paymentMethods || [],
    whatsappLines: mapWhatsappLines(shop?.whatsappLines || []),
    socialHandles: mapSocialHandles(shop?.socialHandles || []),
    dataIntegrity: shop?.dataIntegrity || 'MINIMAL',
    isPenalized: Boolean((shop?.isPenalized ?? penalties.some((p: any) => p?.active)) || status === 'AGENDA_SUSPENDED'),
    penalties: penalties.map((p: any) => ({
      id: p.id,
      reason: p.reason || '',
      dateISO: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      active: Boolean(p.active),
    })),
    reviews: shop?.reviews || [],
    ratingAverage: Number(shop?.ratingAverage ?? 0),
    ratingCount: Number(shop?.ratingCount ?? 0),
    logoUrl: shop?.logoUrl || '',
    quotaWallet,
  };
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const mapStream = (stream: any): Stream => {
  const scheduledAt = stream?.scheduledAt || stream?.startTime || new Date().toISOString();
  const fullDateISO = new Date(scheduledAt).toISOString();
  const shop = stream?.shop ? mapShop(stream.shop) : ({} as Shop);

  return {
    id: stream.id,
    shop,
    shopId: stream.shopId || shop.id,
    title: stream.title,
    coverImage: stream.coverImage || shop.coverUrl || shop.logoUrl || '',
    status: stream.status,
    extensionCount: Number(stream.extensionCount ?? 0),
    scheduledTime: formatTime(fullDateISO),
    fullDateISO,
    startedAt: stream.startTime ? new Date(stream.startTime).getTime() : stream.startedAt,
    platform: stream.platform as SocialPlatform,
    url: stream.url || '',
    views: Number(stream.views ?? 0),
    reportCount: Number(stream.reportCount ?? 0),
    isVisible: stream.hidden !== undefined ? !stream.hidden : Boolean(stream.isVisible ?? true),
    likes: Number(stream.likes ?? 0),
    rating: stream.rating ?? undefined,
  };
};

const mapReel = (reel: any): Reel => {
  const createdAtISO = reel?.createdAt ? new Date(reel.createdAt).toISOString() : new Date().toISOString();
  const expiresAtISO = new Date(new Date(createdAtISO).getTime() + 24 * 60 * 60 * 1000).toISOString();
  const isExpired = new Date(expiresAtISO).getTime() < Date.now();
  const status = reel?.hidden ? 'HIDDEN' : isExpired ? 'EXPIRED' : 'ACTIVE';
  const shop = reel?.shop || {};

  return {
    id: reel.id,
    shopId: reel.shopId,
    shopName: shop.name || '',
    shopLogo: shop.logoUrl || '',
    url: reel.url || '',
    thumbnail: reel.thumbnail || undefined,
    createdAtISO,
    expiresAtISO,
    status,
    origin: reel.origin || 'PLAN',
    platform: reel.platform as SocialPlatform,
    views: Number(reel.views ?? 0),
  };
};

export const api = {
  fetchAuthMe: async (): Promise<{ userType?: string; shopId?: string; adminRole?: string; authUserId?: string } | null> => {
    try {
      const res = await fetchWithAuth('/auth/me');
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error fetching auth profile:', error);
      return null;
    }
  },
  createClientMe: async (payload: { displayName?: string; avatarUrl?: string }) => {
    const res = await fetchWithAuth('/clients/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return res.json();
  },
  fetchClientState: async (): Promise<{ favorites: string[]; reminders: string[]; viewedReels?: string[]; likes?: string[] } | null> => {
    try {
      const res = await fetchWithAuth('/clients/me');
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error fetching client state:', error);
      return null;
    }
  },
  fetchNotifications: async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/notifications/${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },
  markNotificationRead: async (id: string) => {
    try {
      const res = await fetchWithAuth(`/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error marking notification read:', error);
      return null;
    }
  },
  markAllNotificationsRead: async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/notifications/${userId}/read-all`, { method: 'POST' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      return null;
    }
  },
  runNotifications: async (minutesAhead: number = 15) => {
    try {
      const res = await fetchWithAuth('/notifications/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutesAhead }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error running notifications:', error);
      return null;
    }
  },
  fetchNotificationsAdmin: async (options?: { limit?: number; unreadOnly?: boolean; type?: string }) => {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.unreadOnly) params.set('unread', 'true');
      if (options?.type && options.type !== 'ALL') params.set('type', options.type);
      const query = params.toString();
      const res = await fetchWithAuth(`/notifications${query ? `?${query}` : ''}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return [];
    }
  },
  addFavorite: async (shopId: string): Promise<string[] | null> => {
    try {
      const res = await fetchWithAuth(`/clients/me/favorites/${shopId}`, { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.favorites || [];
    } catch (error) {
      console.error('Error adding favorite:', error);
      return null;
    }
  },
  removeFavorite: async (shopId: string): Promise<string[] | null> => {
    try {
      const res = await fetchWithAuth(`/clients/me/favorites/${shopId}`, { method: 'DELETE' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.favorites || [];
    } catch (error) {
      console.error('Error removing favorite:', error);
      return null;
    }
  },
  addReminder: async (streamId: string): Promise<string[] | null> => {
    try {
      const res = await fetchWithAuth(`/clients/me/reminders/${streamId}`, { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.reminders || [];
    } catch (error) {
      console.error('Error adding reminder:', error);
      return null;
    }
  },
  removeReminder: async (streamId: string): Promise<string[] | null> => {
    try {
      const res = await fetchWithAuth(`/clients/me/reminders/${streamId}`, { method: 'DELETE' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.reminders || [];
    } catch (error) {
      console.error('Error removing reminder:', error);
      return null;
    }
  },
  fetchShops: async (): Promise<Shop[]> => {
    try {
      const res = await fetchWithAuth('/shops');
      if (!res.ok) throw new Error('Error al conectar con el servidor');
      const data = await res.json();
      return data.map(mapShop);
    } catch (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
  },
  checkShopEmail: async (email: string): Promise<boolean> => {
    try {
      const trimmed = email.trim();
      if (!trimmed) return false;
      const res = await fetch(`${API_URL}/shops/check-email?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data?.exists);
    } catch (error) {
      console.error('Error checking shop email:', error);
      return false;
    }
  },

  createShop: async (payload: any): Promise<{ success: boolean; message: string; shop?: Shop }> => {
    try {
      const res = await fetchWithAuth('/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear tienda');
      return { success: true, message: 'Tienda creada exitosamente!', shop: mapShop(data) };
    } catch (error: any) {
      console.error('Error creating shop:', error);
      return { success: false, message: error.message || 'Error de conexion' };
    }
  },

  updateShop: async (id: string, data: any) => {
    const dbPayload = {
      name: data.name,
      razonSocial: data.razonSocial,
      cuit: data.cuit,
      email: data.email,
      address: data.address,
      logoUrl: data.logoUrl,
      website: data.website,
      addressDetails: data.addressDetails || {},
      paymentMethods: data.paymentMethods || [],
      minimumPurchase: Number(data.minimumPurchase || 0),
      socialHandles: data.socialHandles || {},
      whatsappLines: data.whatsappLines || [],
    };

    const res = await fetchWithAuth(`/shops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al guardar datos de tienda');
    }

    return mapShop(await res.json());
  },

  fetchStreams: async (): Promise<Stream[]> => {
    try {
      const res = await fetchWithAuth('/streams');
      if (!res.ok) throw new Error('Error al obtener vivos');
      const data = await res.json();
      return data.map(mapStream);
    } catch (error) {
      console.error('Error fetching streams:', error);
      return [];
    }
  },

  createStream: async (payload: any): Promise<{ success: boolean; message: string; stream?: Stream }> => {
    try {
      const scheduledAt = payload.fullDateISO || payload.scheduledAt;
      const streamPayload = {
        title: payload.title,
        description: payload.description,
        shopId: payload.shopId || payload.shop?.id,
        status: payload.status,
        scheduledAt,
        platform: payload.platform || 'Instagram',
        url: payload.url,
        isVisible: payload.isVisible,
        extensionCount: payload.extensionCount ?? 0,
      };

      const res = await fetchWithAuth('/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear vivo');
      return { success: true, message: 'Vivo agendado exitosamente!', stream: mapStream(data) };
    } catch (error: any) {
      console.error('Error creating stream:', error);
      return { success: false, message: error.message || 'Error de conexion al crear vivo' };
    }
  },

  updateStream: async (data: any) => {
    if (!data.id) throw new Error('No ID provided for update');

    const shouldSendSchedule =
      !data.status ||
      data.status === StreamStatus.UPCOMING ||
      data.status === StreamStatus.PENDING_REPROGRAMMATION ||
      data.forceScheduleUpdate;
    const scheduledAt = shouldSendSchedule ? data.fullDateISO || data.scheduledAt : undefined;
    const startTime =
      data.startedAt ? new Date(data.startedAt).toISOString() : data.startTime;
    const dbPayload = {
      title: data.title,
      description: data.description,
      status: data.status,
      scheduledAt,
      platform: data.platform,
      url: data.url,
      isVisible: data.isVisible,
      extensionCount: data.extensionCount,
      reportCount: data.reportCount,
      startTime,
      isAdminOverride: data.isAdminOverride,
      forceScheduleUpdate: data.forceScheduleUpdate,
    };

    const res = await fetchWithAuth(`/streams/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload),
    });

    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload?.message || 'Error al actualizar vivo');
    }
    return mapStream(payload);
  },

  deleteStream: async (id: string) => {
    await fetchWithAuth(`/streams/${id}`, { method: 'DELETE' });
  },

  cancelStream: async (id: string, reason?: string) => {
    const res = await fetchWithAuth(`/streams/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.message || 'Error al cancelar vivo');
    }
  },

  banStream: async (id: string, reason?: string) => {
    const res = await fetchWithAuth(`/streams/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.message || 'Error al bloquear vivo');
    }
  },

  buyReelQuota: async (shopId: string, amount: number, _payment?: any) => {
    const res = await fetchWithAuth(`/shops/${shopId}/buy-reel-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      shop: data?.shop ? mapShop(data.shop) : null,
      purchase: data?.purchase || null,
    };
  },

  buyStreamQuota: async (shopId: string, amount: number, _payment?: any) => {
    const res = await fetchWithAuth(`/shops/${shopId}/buy-stream-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      shop: data?.shop ? mapShop(data.shop) : null,
      purchase: data?.purchase || null,
    };
  },

  buyQuota: async (shopId: string, amount: number) => {
    return api.buyStreamQuota(shopId, amount);
  },

  reportStream: async (streamId: string, reason: string) => {
    try {
      const res = await fetchWithAuth(`/streams/${streamId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al reportar');
      return { success: true, message: 'Reporte recibido' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error de conexion' };
    }
  },

  rateStream: async (streamId: string, rating: number, comment?: string) => {
    const res = await fetchWithAuth(`/streams/${streamId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Error al calificar vivo');
    }
    return data;
  },

  toggleLikeStream: async (streamId: string): Promise<{ liked: boolean; likes: number } | null> => {
    try {
      const res = await fetchWithAuth(`/streams/${streamId}/like`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo guardar el like');
      }
      return { liked: Boolean(data?.liked), likes: Number(data?.likes ?? 0) };
    } catch (error) {
      console.error('Error toggling like:', error);
      return null;
    }
  },

  fetchReels: async (): Promise<Reel[]> => {
    try {
      const res = await fetchWithAuth('/reels');
      if (!res.ok) throw new Error('Error al obtener reels');
      const data = await res.json();
      return data.map(mapReel);
    } catch (error) {
      console.error('Error fetching reels:', error);
      return [];
    }
  },

  fetchAllReelsAdmin: async (): Promise<Reel[]> => {
    try {
      const res = await fetchWithAuth('/reels/admin');
      if (!res.ok) throw new Error('Error al obtener reels');
      const data = await res.json();
      return data.map(mapReel);
    } catch (error) {
      console.error('Error fetching reels:', error);
      return [];
    }
  },
  fetchReelsByShop: async (shopId: string): Promise<Reel[]> => {
    try {
      const res = await fetchWithAuth(`/reels/shop/${shopId}`);
      if (!res.ok) throw new Error('Error al obtener reels');
      const data = await res.json();
      return data.map(mapReel);
    } catch (error) {
      console.error('Error fetching reels:', error);
      return [];
    }
  },

  fetchReportsAdmin: async (): Promise<any[]> => {
    try {
      const res = await fetchWithAuth('/reports');
      if (!res.ok) throw new Error('Error al obtener reportes');
      return await res.json();
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  },

  resolveReportAdmin: async (id: string) => {
    const res = await fetchWithAuth(`/reports/${id}/resolve`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al resolver reporte');
    }
    return data;
  },
  rejectReportAdmin: async (id: string) => {
    const res = await fetchWithAuth(`/reports/${id}/reject`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al rechazar reporte');
    }
    return data;
  },
  fetchPurchaseRequests: async (status?: string) => {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetchWithAuth(`/purchases${query}`);
      if (!res.ok) throw new Error('Error al obtener compras');
      return await res.json();
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  },
  fetchPurchasesByShop: async (shopId: string, status?: string) => {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetchWithAuth(`/purchases/shop/${shopId}${query}`);
      if (!res.ok) throw new Error('Error al obtener compras');
      return await res.json();
    } catch (error) {
      console.error('Error fetching shop purchases:', error);
      return [];
    }
  },
  approvePurchase: async (id: string) => {
    const res = await fetchWithAuth(`/purchases/${id}/approve`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al aprobar compra');
    }
    return data;
  },
  rejectPurchase: async (id: string, notes?: string) => {
    const res = await fetchWithAuth(`/purchases/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al rechazar compra');
    }
    return data;
  },
  runSanctions: async () => {
    const res = await fetchWithAuth('/penalties/run', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al ejecutar motor');
    }
    return data;
  },
  runStreamsLifecycle: async () => {
    const res = await fetchWithAuth('/streams/run-lifecycle', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al ejecutar ciclo de vivos');
    }
    return data;
  },
  registerReelView: async (reelId: string) => {
    try {
      const res = await fetchWithAuth(`/reels/${reelId}/view`, { method: 'POST' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error registering reel view:', error);
      return null;
    }
  },

  createReel: async (shopId: string, url: string, platform: SocialPlatform) => {
    try {
      const res = await fetchWithAuth('/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, url, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear reel');
      return { success: true, message: 'Reel creado', reel: mapReel(data) };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error de conexion' };
    }
  },

  hideReel: async (id: string) => {
    await fetchWithAuth(`/reels/${id}/hide`, { method: 'POST' });
  },

  reactivateReel: async (id: string) => {
    await fetchWithAuth(`/reels/${id}/reactivate`, { method: 'POST' });
  },

  togglePenalty: async (id: string) => {
    try {
      await fetchWithAuth(`/shops/${id}/toggle-penalty`, { method: 'POST' });
    } catch (e) {}
    return null;
  },

  activateShop: async (id: string, reason?: string) => {
    await fetchWithAuth(`/shops/${id}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
  },

  rejectShop: async (id: string, reason?: string) => {
    await fetchWithAuth(`/shops/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
  },

  suspendAgenda: async (id: string, reason?: string, days?: number) => {
    await fetchWithAuth(`/shops/${id}/suspend-agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, days }),
    });
  },

  liftAgendaSuspension: async (id: string) => {
    await fetchWithAuth(`/shops/${id}/lift-suspension`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  resetShopPassword: async (id: string) => {
    const res = await fetchWithAuth(`/shops/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Error al resetear clave');
    }
    return data;
  },
  assignShopOwner: async (id: string, payload: { authUserId?: string; email?: string }) => {
    const res = await fetchWithAuth(`/shops/${id}/assign-owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Error al asignar dueño');
    }
    return mapShop(data);
  },
  acceptShop: async (shopId: string) => {
    const res = await fetchWithAuth(`/shops/${shopId}/accept`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Error al aceptar tienda');
    }
    return mapShop(data);
  },

  updateStreamTime: async (streamId: string, minutes: number) => {
    const scheduledAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    return api.updateStream({ id: streamId, fullDateISO: scheduledAt });
  },

  resetSystem: async () => {
    await fetchWithAuth('/testpanel/reset', { method: 'POST' });
  },

  loginUser: async (email: string, _userId?: string) => ({
    id: '1',
    isLoggedIn: true,
    email,
    name: 'Admin',
    favorites: [],
    reminders: [],
    history: [],
    viewedReels: [],
    likes: [],
    reports: [],
    preferences: { theme: 'light', notifications: true },
  }),
};
