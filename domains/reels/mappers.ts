import type { Reel, SocialPlatform } from '../../types';
import { normalizeMediaUrl } from '../../utils/shopMedia';

export const mapReel = (reel: any): Reel => {
  const createdAtISO = reel?.createdAt ? new Date(reel.createdAt).toISOString() : new Date().toISOString();
  const expiresAtISO = reel?.expiresAt
    ? new Date(reel.expiresAt).toISOString()
    : new Date(new Date(createdAtISO).getTime() + 24 * 60 * 60 * 1000).toISOString();
  const isExpired = new Date(expiresAtISO).getTime() < Date.now();
  const status = reel?.status || (reel?.hidden ? 'HIDDEN' : isExpired ? 'EXPIRED' : 'ACTIVE');
  const shop = reel?.shop || {};
  const videoUrl = reel?.videoUrl || reel?.url || '';
  const photoUrls = Array.isArray(reel?.photoUrls) ? reel.photoUrls : [];
  const fallbackUrl = videoUrl || photoUrls[0] || '';
  const thumbnailUrl = reel?.thumbnailUrl || reel?.thumbnail || '';

  return {
    id: reel.id,
    shopId: reel.shopId,
    shopName: shop.name || '',
    shopLogo: normalizeMediaUrl(shop.logoUrl || ''),
    url: fallbackUrl,
    type: reel?.type || (photoUrls.length ? 'PHOTO_SET' : 'VIDEO'),
    videoUrl: normalizeMediaUrl(videoUrl || '') || undefined,
    photoUrls: photoUrls.map((item: string) => normalizeMediaUrl(item) || item),
    durationSeconds: Number(reel?.durationSeconds ?? 10),
    thumbnail: normalizeMediaUrl(thumbnailUrl || '') || undefined,
    processingJobId: reel?.processingJobId || undefined,
    createdAtISO,
    expiresAtISO,
    status,
    origin: reel.origin || 'PLAN',
    platform: reel.platform as SocialPlatform,
    views: Number(reel.views ?? 0),
  };
};
