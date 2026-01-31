import { useDeferredValue, useMemo, useRef } from "react";
import { buildMockStreams, MOCK_STREAM_COUNT } from "../../../services/mockData";
import { Shop, Stream, StreamStatus, UserContext } from "../../../types";

type UseClientSelectorsArgs = {
  allShops: Shop[];
  allStreams: Stream[];
  user: UserContext;
  activeFilter: string;
  shopQuery: string;
};

const planWeight = (plan: string) => {
  if (plan === "Maxima Visibilidad") return 3;
  if (plan === "Alta Visibilidad") return 2;
  return 1;
};

const isPublicShop = (shop: Shop) => {
  if (!shop.status) return true;
  return shop.status === "ACTIVE";
};

const sortShopsByPriority = (shops: Shop[]) =>
  [...shops].sort((a, b) => {
    const weightA = planWeight(a.plan);
    const weightB = planWeight(b.plan);
    if (weightA !== weightB) return weightB - weightA;
    if (a.ratingAverage !== b.ratingAverage)
      return b.ratingAverage - a.ratingAverage;
    return a.name.localeCompare(b.name);
  });

const getFilteredStreams = (source: Stream[], activeFilter: string) => {
  let filtered = source.filter((s) => s.isVisible);
  filtered = filtered.filter((s) => s.shop?.status === "ACTIVE");
  filtered = filtered.filter(
    (s) => s.status !== StreamStatus.CANCELLED && s.status !== StreamStatus.BANNED
  );
  if (activeFilter === "En Vivo")
    filtered = filtered.filter((s) => s.status === StreamStatus.LIVE);
  if (activeFilter === "Próximos")
    filtered = filtered.filter((s) => s.status === StreamStatus.UPCOMING);
  if (activeFilter === "Finalizados")
    filtered = filtered.filter(
      (s) =>
        s.status === StreamStatus.FINISHED || s.status === StreamStatus.MISSED
    );

  if (activeFilter === "En Vivo") {
    filtered.sort((a, b) => {
      const weightA = planWeight(a.shop.plan);
      const weightB = planWeight(b.shop.plan);
      if (weightA !== weightB) return weightB - weightA;
      if (a.shop.ratingAverage !== b.shop.ratingAverage)
        return b.shop.ratingAverage - a.shop.ratingAverage;
      return (b.views || 0) - (a.views || 0);
    });
    return filtered;
  }

  filtered.sort((a, b) => {
    const getPriority = (status: StreamStatus) => {
      if (status === StreamStatus.LIVE) return 1;
      if (status === StreamStatus.UPCOMING) return 2;
      return 3;
    };
    const pA = getPriority(a.status);
    const pB = getPriority(b.status);
    if (pA !== pB) return pA - pB;
    const dateA = new Date(a.fullDateISO).getTime();
    const dateB = new Date(b.fullDateISO).getTime();
    if (a.status === StreamStatus.UPCOMING) {
      return dateA - dateB;
    }
    return dateB - dateA;
  });
  return filtered;
};

const filterShopsByQuery = (shops: Shop[], query: string) => {
  if (!query) return shops;
  return shops.filter((shop) => {
    const address = shop.address || "";
    const city = shop.addressDetails?.city || "";
    const province = shop.addressDetails?.province || "";
    const razon = shop.razonSocial || "";
    return [shop.name, razon, address, city, province]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
};

export const useClientSelectors = ({
  allShops,
  allStreams,
  user,
  activeFilter,
  shopQuery,
}: UseClientSelectorsArgs) => {
  const mockStreamsRef = useRef<{ seed: string; data: Stream[] }>({
    seed: "",
    data: [],
  });
  const publicShops = useMemo(
    () => sortShopsByPriority(allShops.filter(isPublicShop)),
    [allShops]
  );
  const featuredShops = useMemo(() => publicShops.slice(0, 60), [publicShops]);
  const favoriteShops = useMemo(
    () =>
      sortShopsByPriority(allShops.filter((shop) => user.favorites.includes(shop.id))),
    [allShops, user.favorites]
  );
  const mockStreams = useMemo(() => {
    const dailySeed = new Date().toLocaleDateString("en-CA");
    const seed = `${dailySeed}:${allStreams.length}`;
    if (mockStreamsRef.current.seed !== seed || mockStreamsRef.current.data.length === 0) {
      mockStreamsRef.current = {
        seed,
        data: buildMockStreams(publicShops, allStreams, MOCK_STREAM_COUNT),
      };
    }
    return mockStreamsRef.current.data;
  }, [publicShops, allStreams]);
  const streamSource = useMemo(
    () => [...allStreams, ...mockStreams],
    [allStreams, mockStreams]
  );
  const liveStreams = useMemo(
    () =>
      streamSource.filter(
        (s) =>
          s.status === StreamStatus.LIVE &&
          s.isVisible &&
          s.shop?.status === "ACTIVE"
      ),
    [streamSource]
  );
  const sortedLiveStreams = useMemo(() => {
    return [...liveStreams].sort((a, b) => {
      const weightA = planWeight(a.shop.plan);
      const weightB = planWeight(b.shop.plan);
      if (weightA !== weightB) return weightB - weightA;
      if (a.shop.ratingAverage !== b.shop.ratingAverage)
        return b.shop.ratingAverage - a.shop.ratingAverage;
      return (b.views || 0) - (a.views || 0);
    });
  }, [liveStreams]);
  const filteredStreams = useMemo(
    () => getFilteredStreams(streamSource, activeFilter),
    [streamSource, activeFilter]
  );
  const queueStreamsSource = streamSource;
  const deferredShopQuery = useDeferredValue(shopQuery);
  const normalizedShopQuery = useMemo(
    () => deferredShopQuery.trim().toLowerCase(),
    [deferredShopQuery]
  );
  const filteredPublicShops = useMemo(
    () => filterShopsByQuery(publicShops, normalizedShopQuery),
    [publicShops, normalizedShopQuery]
  );
  const filteredFavoriteShops = useMemo(
    () => filterShopsByQuery(favoriteShops, normalizedShopQuery),
    [favoriteShops, normalizedShopQuery]
  );
  const reminderStreams = useMemo(
    () =>
      allStreams
        .filter((stream) => user.reminders.includes(stream.id))
        .sort(
          (a, b) =>
            new Date(a.fullDateISO).getTime() - new Date(b.fullDateISO).getTime()
        ),
    [allStreams, user.reminders]
  );

  return {
    publicShops,
    featuredShops,
    favoriteShops,
    streamSource,
    liveStreams,
    sortedLiveStreams,
    filteredStreams,
    queueStreamsSource,
    filteredPublicShops,
    filteredFavoriteShops,
    reminderStreams,
  };
};
