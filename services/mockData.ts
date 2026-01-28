import { Reel, Shop, Stream, StreamStatus } from "../types";

export const MOCK_REEL_COUNT = 10;
export const MOCK_REEL_TTL_HOURS = 24;
export const MOCK_STREAM_COUNT = 10;
const DAILY_MOCK_SEED = new Date().toLocaleDateString("en-CA");

const getDailyBaseTime = () => {
  const [year, month, day] = DAILY_MOCK_SEED.split("-").map(Number);
  return new Date(year, month - 1, day, 9, 0, 0, 0).getTime();
};

const createSeededRandom = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = <T,>(items: T[], seed: string) => {
  const rng = createSeededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const normalizeInstagramUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `https://instagram.com/${value.replace("@", "")}`;
};

const buildMapsUrl = (shop: Shop) => {
  if (shop.addressDetails?.mapsUrl) return shop.addressDetails.mapsUrl;
  const addressParts = [
    shop.address,
    shop.addressDetails?.street,
    shop.addressDetails?.number,
    shop.addressDetails?.city,
    shop.addressDetails?.province,
  ].filter(Boolean);
  const query = addressParts.length > 0 ? addressParts.join(" ") : shop.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const resolveCatalogUrl = (shop: Shop) =>
  shop.website || normalizeInstagramUrl(shop.socialHandles?.instagram);

export const buildMockStreams = (
  shops: Shop[],
  streams: Stream[],
  count: number
) => {
  if (shops.length === 0) return [];
  const usedShopIds = new Set(streams.map((stream) => stream.shopId));
  const candidates = shops.filter((shop) => !usedShopIds.has(shop.id));
  const shuffled = shuffleWithSeed(candidates, `${DAILY_MOCK_SEED}-streams`);
  const liveCount = Math.min(3, count);
  const upcomingCount = Math.min(4, count - liveCount);
  const finishedCount = Math.max(count - liveCount - upcomingCount, 0);
  const dayBase = new Date();
  dayBase.setHours(9, 0, 0, 0);
  const baseTime = dayBase.getTime();

  return shuffled.slice(0, count).map((shop, index) => {
    const isLive = index < liveCount;
    const isUpcoming = index >= liveCount && index < liveCount + upcomingCount;
    const isFinished = index >= liveCount + upcomingCount;
    const slotOffset = isLive
      ? index * 15 * 60 * 1000
      : isUpcoming
        ? (index + 1) * 60 * 60 * 1000
        : -1 * (index - liveCount - upcomingCount + 1) * 90 * 60 * 1000;
    const streamTime = new Date(baseTime + slotOffset);
    const scheduledTime = streamTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const rng = createSeededRandom(`${DAILY_MOCK_SEED}-stream-${shop.id}`);
    const likes = Math.floor(rng() * 40) + 5;
    const views = Math.floor(rng() * 180) + 20;
    const status = isLive
      ? StreamStatus.LIVE
      : isUpcoming
        ? StreamStatus.UPCOMING
        : StreamStatus.FINISHED;
    return {
      id: `mock-stream-${shop.id}`,
      shop,
      shopId: shop.id,
      title: isLive
        ? `Vivo de ${shop.name}`
        : isUpcoming
          ? `Proximo vivo de ${shop.name}`
          : `Vivo finalizado de ${shop.name}`,
      coverImage: shop.coverUrl || shop.logoUrl,
      status,
      extensionCount: 0,
      scheduledTime,
      fullDateISO: streamTime.toISOString(),
      startedAt: isLive ? streamTime.getTime() - 5 * 60 * 1000 : undefined,
      platform: "Instagram",
      url: resolveCatalogUrl(shop) || "https://www.distritomoda.com.ar",
      views,
      reportCount: 0,
      isVisible: true,
      likes,
      rating: shop.ratingAverage || 5,
    };
  });
};

export const enrichReelsWithShop = (reels: Reel[], shops: Shop[]) =>
  reels.map((reel) => {
    const shop = shops.find((item) => item.id === reel.shopId);
    return {
      ...reel,
      thumbnail: reel.thumbnail || shop?.coverUrl || shop?.logoUrl,
      shopMapsUrl: shop ? buildMapsUrl(shop) : reel.shopMapsUrl,
      shopCatalogUrl: shop ? resolveCatalogUrl(shop) : reel.shopCatalogUrl,
    };
  });

export const buildMockReels = (shops: Shop[], reels: Reel[], targetCount: number) => {
  const usedShopIds = new Set(reels.map((reel) => reel.shopId));
  const candidates = shops.filter((shop) => !usedShopIds.has(shop.id));
  const shuffled = shuffleWithSeed(candidates, `${DAILY_MOCK_SEED}-reels`);
  const count = Math.min(targetCount, shuffled.length);
  const baseTime = getDailyBaseTime();

  return shuffled.slice(0, count).map((shop, index) => ({
    id: `mock-${shop.id}`,
    shopId: shop.id,
    shopName: shop.name,
    shopLogo: shop.logoUrl,
    url: resolveCatalogUrl(shop) || "https://www.distritomoda.com.ar",
    thumbnail: shop.coverUrl || shop.logoUrl,
    createdAtISO: new Date(baseTime + index * 1000).toISOString(),
    expiresAtISO: new Date(baseTime + MOCK_REEL_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    origin: "PLAN",
    platform: "Instagram",
    views: Math.floor(createSeededRandom(`${DAILY_MOCK_SEED}-reel-${shop.id}`)() * 120) + 1,
    shopMapsUrl: buildMapsUrl(shop),
    shopCatalogUrl: resolveCatalogUrl(shop),
  }));
};
