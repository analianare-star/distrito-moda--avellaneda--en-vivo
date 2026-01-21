import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { Reel, Shop, Stream } from "../types";
import {
  MOCK_REEL_COUNT,
  buildMockReels,
  enrichReelsWithShop,
} from "../services/mockData";

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

  const refreshData = useCallback(async () => {
    setHasFetchError(false);
    try {
      const [shops, streams, reels] = await Promise.all([
        api.fetchShops(),
        api.fetchStreams(),
        api.fetchReels(),
      ]);

      const enrichedReels = enrichReelsWithShop(reels, shops);
      const mockReels = buildMockReels(shops, enrichedReels, MOCK_REEL_COUNT);
      const activeOnly = [...enrichedReels, ...mockReels].filter(
        (reel) => new Date(reel.expiresAtISO).getTime() > Date.now()
      );

      setAllShops(shops);
      setAllStreams(streams);
      setActiveReels(activeOnly);

      if (!currentShopId && shops.length > 0) {
        setCurrentShopId(shops[0].id);
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
