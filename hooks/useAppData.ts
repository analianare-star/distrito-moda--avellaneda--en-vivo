import { useCallback, useEffect, useRef, useState } from "react";
import { fetchShops } from "../domains/shops";
import { fetchStreams } from "../domains/streams";
import { fetchReels } from "../domains/reels";
import { Reel, Shop, Stream } from "../types";
import {
  MOCK_REEL_COUNT,
  buildMockReels,
  enrichReelsWithShop,
} from "../services/mockData";

const SHOP_PAGE_SIZE = 120;
const SHOP_MAX_PAGES = 20;

type UseAppDataArgs = {
  isResetView: boolean;
  currentShopId: string;
  setCurrentShopId: (id: string) => void;
};

export const useAppData = ({
  isResetView,
  currentShopId,
  setCurrentShopId,
}: UseAppDataArgs) => {
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [activeReels, setActiveReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchError, setHasFetchError] = useState(false);
  const mockReelsRef = useRef<{ seed: string; data: Reel[] }>({
    seed: "",
    data: [],
  });

  const refreshData = useCallback(async () => {
    setHasFetchError(false);
    try {
      const [initialShops, streams, reels] = await Promise.all([
        fetchShops({ limit: SHOP_PAGE_SIZE, offset: 0 }),
        fetchStreams(),
        fetchReels(),
      ]);

      const computeActiveReels = (shops: Shop[]) => {
        const enrichedReels = enrichReelsWithShop(reels, shops);
        const dailySeed = new Date().toLocaleDateString("en-CA");
        const seed = `${dailySeed}:${reels.length}`;
        if (mockReelsRef.current.seed !== seed || mockReelsRef.current.data.length === 0) {
          mockReelsRef.current = {
            seed,
            data: buildMockReels(shops, enrichedReels, MOCK_REEL_COUNT),
          };
        }
        return [...enrichedReels, ...mockReelsRef.current.data].filter(
          (reel) => new Date(reel.expiresAtISO).getTime() > Date.now()
        );
      };

      setAllShops(initialShops);
      setAllStreams(streams);
      setActiveReels(computeActiveReels(initialShops));

      const mergeShops = (prev: Shop[], next: Shop[]) => {
        const map = new Map(prev.map((shop) => [shop.id, shop]));
        next.forEach((shop) => map.set(shop.id, shop));
        return Array.from(map.values());
      };

      const loadRemainingShops = async () => {
        if (initialShops.length < SHOP_PAGE_SIZE) return;
        let offset = initialShops.length;
        let combined = initialShops;
        let pages = 0;
        while (pages < SHOP_MAX_PAGES) {
          const next = await fetchShops({ limit: SHOP_PAGE_SIZE, offset });
          if (!next.length) break;
          combined = mergeShops(combined, next);
          setAllShops(combined);
          setActiveReels(computeActiveReels(combined));
          pages += 1;
          if (next.length < SHOP_PAGE_SIZE) break;
          offset += SHOP_PAGE_SIZE;
        }
      };

      void loadRemainingShops();

      if (!currentShopId && initialShops.length > 0) {
        const path =
          typeof window !== "undefined" ? window.location.pathname : "";
        const isShopRoute = path === "/tienda" || path.startsWith("/tienda/");
        const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
        if (!isShopRoute && !isAdminRoute) {
          setCurrentShopId(initialShops[0].id);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setHasFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentShopId, setCurrentShopId]);

  useEffect(() => {
    if (isResetView) return;
    refreshData();
  }, [isResetView, refreshData]);

  useEffect(() => {
    if (isResetView) return;
    const timer = window.setInterval(() => {
      setActiveReels((prev) =>
        prev.filter((reel) => new Date(reel.expiresAtISO).getTime() > Date.now())
      );
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [isResetView]);

  return {
    allShops,
    setAllShops,
    allStreams,
    setAllStreams,
    activeReels,
    setActiveReels,
    isLoading,
    hasFetchError,
    refreshData,
  };
};
