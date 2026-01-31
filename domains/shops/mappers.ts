import type { Shop, SocialHandles, WhatsappLine, ShopPlan } from '../../types';
import { normalizeMediaUrl } from '../../utils/shopMedia';

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

export const normalizePlan = (value: unknown): ShopPlan => {
  const plan = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return PLAN_BY_BACKEND[plan] || 'Estandar';
};

export const normalizeShopStatus = (value: unknown) => {
  if (value === 'PENDING_VERIFICATION') return 'PENDING_VERIFICATION';
  if (value === 'ACTIVE') return 'ACTIVE';
  if (value === 'AGENDA_SUSPENDED') return 'AGENDA_SUSPENDED';
  if (value === 'HIDDEN') return 'HIDDEN';
  if (value === 'BANNED') return 'BANNED';
  return 'ACTIVE';
};

export const mapSocialHandles = (handles: unknown): SocialHandles => {
  const result: SocialHandles = {};
  if (!handles) return result;

  if (Array.isArray(handles)) {
    handles.forEach((handle) => {
      const key = typeof handle?.platform === 'string' ? handle.platform.toLowerCase() : '';
      if (key === 'instagram') result.instagram = handle.handle;
      if (key === 'tiktok') result.tiktok = handle.handle;
      if (key === 'facebook') result.facebook = handle.handle;
      if (key === 'youtube') result.youtube = handle.handle;
    });
    return result;
  }

  if (typeof handles === 'object') {
    const obj = handles as Record<string, unknown>;
    if (typeof obj.instagram === 'string') result.instagram = obj.instagram.trim();
    if (typeof obj.tiktok === 'string') result.tiktok = obj.tiktok.trim();
    if (typeof obj.facebook === 'string') result.facebook = obj.facebook.trim();
    if (typeof obj.youtube === 'string') result.youtube = obj.youtube.trim();
  }

  return result;
};

const normalizeWhatsappNumber = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\D/g, '');
};

export const mapWhatsappLines = (lines: unknown): WhatsappLine[] => {
  if (!lines) return [];
  if (Array.isArray(lines)) {
    return lines
      .filter((line) => line?.number)
      .map((line) => ({
        label: (line.label || 'Ventas por mayor') as WhatsappLine['label'],
        number: normalizeWhatsappNumber(line.number),
      }))
      .filter((line) => line.number);
  }
  if (typeof lines === 'string') {
    const number = normalizeWhatsappNumber(lines);
    return number ? [{ label: 'Ventas por mayor', number }] : [];
  }
  if (typeof lines === 'object') {
    const obj = lines as Record<string, unknown>;
    const number = normalizeWhatsappNumber(obj.number ?? obj.phone ?? obj.whatsapp);
    if (!number) return [];
    const label = (typeof obj.label === 'string' && obj.label.trim()
      ? obj.label
      : 'Ventas por mayor') as WhatsappLine['label'];
    return [{ label, number }];
  }
  return [];
};

export const mapShop = (shop: any): Shop => {
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
  const logoUrl = normalizeMediaUrl(shop?.logoUrl || '');
  const coverUrl = normalizeMediaUrl(
    shop?.coverUrl ||
      shop?.addressDetails?.storeImageUrl ||
      shop?.addressDetails?.imageUrl ||
      shop?.logoUrl ||
      ''
  );
  const addressDetails = shop?.addressDetails
    ? {
        ...shop.addressDetails,
        storeImageUrl: normalizeMediaUrl(shop.addressDetails.storeImageUrl) || undefined,
        imageUrl: normalizeMediaUrl(shop.addressDetails.imageUrl) || undefined,
      }
    : shop?.addressDetails;
  return {
    ...shop,
    plan: normalizePlan(shop?.plan),
    status,
    statusReason: shop?.statusReason || undefined,
    statusChangedAt: shop?.statusChangedAt ? new Date(shop.statusChangedAt).toISOString() : undefined,
    agendaSuspendedUntil: shop?.agendaSuspendedUntil
      ? new Date(shop.agendaSuspendedUntil).toISOString()
      : undefined,
    agendaSuspendedReason: shop?.agendaSuspendedReason || undefined,
    ownerAcceptedAt: shop?.ownerAcceptedAt ? new Date(shop.ownerAcceptedAt).toISOString() : undefined,
    baseQuota: quotaWallet ? liveBaseRemaining : Number(shop?.streamQuota ?? shop?.baseQuota ?? 0),
    extraQuota: quotaWallet ? liveExtraBalance : Number(shop?.extraQuota ?? 0),
    reelsExtraQuota: quotaWallet ? reelExtraBalance : Number(shop?.reelQuota ?? shop?.reelsExtraQuota ?? 0),
    paymentMethods: shop?.paymentMethods || [],
    whatsappLines: mapWhatsappLines(shop?.whatsappLines ?? shop?.whatsapp ?? shop?.whatsappLine ?? []),
    socialHandles: mapSocialHandles(shop?.socialHandles ?? shop?.socials ?? []),
    dataIntegrity: shop?.dataIntegrity || 'MINIMAL',
    isPenalized: Boolean(
      (shop?.isPenalized ?? penalties.some((p: any) => p?.active)) ||
        status === 'AGENDA_SUSPENDED'
    ),
    penalties: penalties.map((p: any) => ({
      id: p.id,
      reason: p.reason || '',
      dateISO: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      active: Boolean(p.active),
    })),
    reviews: shop?.reviews || [],
    ratingAverage: Number(shop?.ratingAverage ?? 0),
    ratingCount: Number(shop?.ratingCount ?? 0),
    logoUrl,
    coverUrl: coverUrl || undefined,
    addressDetails,
    quotaWallet,
  };
};
