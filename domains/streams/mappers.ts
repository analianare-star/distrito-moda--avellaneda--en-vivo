import type { Shop, Stream, SocialPlatform } from '../../types';
import { normalizeMediaUrl } from '../../utils/shopMedia';
import { mapShop } from '../shops/mappers';

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const mapStream = (stream: any): Stream => {
  const scheduledAt = stream?.scheduledAt || stream?.startTime || new Date().toISOString();
  const fullDateISO = new Date(scheduledAt).toISOString();
  const shop = stream?.shop ? mapShop(stream.shop) : ({} as Shop);

  return {
    id: stream.id,
    shop,
    shopId: stream.shopId || shop.id,
    title: stream.title,
    coverImage: normalizeMediaUrl(stream.coverImage || shop.coverUrl || shop.logoUrl || ''),
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
