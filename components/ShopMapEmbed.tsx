import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import modalStyles from "./ShopMapModal.module.css";
import styles from "./ShopMapEmbed.module.css";

type RawShop = Record<string, unknown>;

type MapShop = {
  uid: string;
  name: string;
  email?: string;
  logoUrl: string | null;
  catalogUrl: string | null;
  address: string | null;
  lat: number;
  lng: number;
};

type Cluster = {
  key: string;
  lat: number;
  lng: number;
  count: number;
  shops: MapShop[];
  containsFocus: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MAP_API_URL = `${API_URL}/shops/map-data`;
const DEFAULT_CENTER: [number, number] = [-34.6275057, -58.4752695];
const DEFAULT_ZOOM = 15;
const FOCUS_ZOOM = 16;
const MAX_RADIUS_METERS = 3200;
const LOW_ZOOM_CLUSTER_LIMIT = 3;

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toMapShop = (row: RawShop): MapShop | null => {
  const lat = parseNumber(row["lat"]);
  const lng = parseNumber(row["lng"]);
  if (lat === null || lng === null) return null;
  const name = String(row["Nombre completo"] || row["Usuario"] || "Tienda").trim();
  const email = String(row["Mail"] || row["mail"] || "").trim();
  const logoUrl = String(row["Logo_URL"] || row["logourl"] || row["logoUrl"] || "").trim();
  const catalogUrl = String(row["url_catalogo"] || "").trim();
  const uid = String(row["Uid"] || row["UID"] || row["uid"] || "").trim();
  const addressParts = [
    row["Calle"],
    row["Ciudad"],
    row["Provincia"],
    row["Codigo postal"],
    row["CÃ³digo postal"],
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;
  return {
    uid,
    name,
    email: email || undefined,
    logoUrl: logoUrl || null,
    catalogUrl: catalogUrl || null,
    address,
    lat,
    lng,
  };
};

const projectPoint = (lat: number, lng: number) =>
  L.CRS.EPSG3857.project(L.latLng(lat, lng));

const distanceMeters = (lat: number, lng: number, center: [number, number]) => {
  const centerPoint = projectPoint(center[0], center[1]);
  const point = projectPoint(lat, lng);
  return centerPoint.distanceTo(point);
};

const getClusterConfig = (zoom: number) => {
  if (zoom <= 15) return { gridSize: 500, maxClusters: LOW_ZOOM_CLUSTER_LIMIT };
  if (zoom <= 16) return { gridSize: 300 };
  if (zoom <= 17) return { gridSize: 200 };
  return { gridSize: 0 };
};

const buildClusters = (
  shops: MapShop[],
  gridSize: number,
  focusShop: MapShop | null
): Cluster[] => {
  const focusName = focusShop ? normalizeValue(focusShop.name) : "";
  const focusUid = focusShop?.uid;
  const buckets = new Map<string, Cluster>();

  shops.forEach((shop) => {
    const point = projectPoint(shop.lat, shop.lng);
    const key = `${Math.floor(point.x / gridSize)}:${Math.floor(point.y / gridSize)}`;
    const isFocus =
      Boolean(focusShop) &&
      ((focusUid && shop.uid === focusUid) ||
        normalizeValue(shop.name) === focusName);

    const existing = buckets.get(key);
    if (existing) {
      existing.shops.push(shop);
      existing.count += 1;
      existing.lat += shop.lat;
      existing.lng += shop.lng;
      if (isFocus) existing.containsFocus = true;
      return;
    }

    buckets.set(key, {
      key,
      lat: shop.lat,
      lng: shop.lng,
      count: 1,
      shops: [shop],
      containsFocus: isFocus,
    });
  });

  return Array.from(buckets.values()).map((cluster) => ({
    ...cluster,
    lat: cluster.lat / cluster.count,
    lng: cluster.lng / cluster.count,
  }));
};

const buildIconHtml = (shop: MapShop, isFocus: boolean) => {
  const markerClass = isFocus
    ? `${modalStyles.marker} ${modalStyles.markerSelected}`
    : modalStyles.marker;
  if (shop.logoUrl) {
    return `<div class="${markerClass}"><img class="${modalStyles.markerLogo}" src="${shop.logoUrl}" alt="" /></div>`;
  }
  return `<div class="${markerClass}"><span class="${modalStyles.markerFallback}">DM</span></div>`;
};

const buildClusterHtml = (cluster: Cluster) => {
  const clusterClass = cluster.containsFocus
    ? `${modalStyles.clusterMarker} ${modalStyles.clusterSelected}`
    : modalStyles.clusterMarker;
  return `<div class="${clusterClass}"><span class="${modalStyles.clusterCount}">${cluster.count}</span></div>`;
};

const buildClusterPopupHtml = (cluster: Cluster) => {
  const message = cluster.containsFocus
    ? "Zona con tu tienda seleccionada"
    : "Zona con tiendas cercanas";
  return `
    <div class="${modalStyles.popup}">
      <div class="${modalStyles.popupName}">${message}</div>
      <div class="${modalStyles.popupMeta}">${cluster.count} tiendas en esta zona</div>
      <div class="${modalStyles.popupMeta}">Acerca el mapa para ver mas detalle</div>
    </div>
  `;
};

const buildPopupHtml = (shop: MapShop) => {
  const name = escapeHtml(shop.name || "Tienda");
  const uid = shop.uid ? `UID ${escapeHtml(shop.uid)}` : "Tienda Avellaneda";
  const mapsQuery = shop.address ? shop.address : `${shop.lat},${shop.lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapsQuery
  )}`;
  const logoMarkup = shop.logoUrl
    ? `<img class="${modalStyles.popupLogo}" src="${shop.logoUrl}" alt="${name}" />`
    : `<div class="${modalStyles.popupLogoFallback}">DM</div>`;
  const catalogButton = shop.catalogUrl
    ? `<a class="${modalStyles.popupButton}" target="_blank" rel="noreferrer" href="${shop.catalogUrl}">Ver catalogo</a>`
    : "";
  return `
    <div class="${modalStyles.popup}">
      <div class="${modalStyles.popupHeader}">
        ${logoMarkup}
        <div>
          <div class="${modalStyles.popupName}">${name}</div>
          <div class="${modalStyles.popupMeta}">${uid}</div>
        </div>
      </div>
      <div class="${modalStyles.popupActions}">
        <a class="${modalStyles.popupButton} ${modalStyles.popupPrimary}" target="_blank" rel="noreferrer" href="${mapsUrl}">Como llegar</a>
        ${catalogButton}
      </div>
    </div>
  `;
};

export const ShopMapEmbed: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const zoomTimerRef = useRef<number | null>(null);
  const [shops, setShops] = useState<MapShop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const focusShop = useMemo(() => {
    if (!searchQuery) return null;
    const key = normalizeValue(searchQuery);
    if (!key) return null;
    return (
      shops.find((shop) => {
        const nameKey = normalizeValue(shop.name || "");
        const uidKey = normalizeValue(shop.uid || "");
        const emailKey = normalizeValue(shop.email || "");
        if (uidKey && uidKey === key) return true;
        if (emailKey && emailKey === key) return true;
        if (nameKey === key) return true;
        if (key.length < 3) return false;
        return nameKey.includes(key) || key.includes(nameKey);
      }) || null
    );
  }, [shops, searchQuery]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    map.whenReady(() => map.invalidateSize());
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    fetch(MAP_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("fetch_failed");
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        const rows: RawShop[] = Array.isArray(data) ? data : [];
        const parsed = rows
          .map(toMapShop)
          .filter((shop): shop is MapShop => Boolean(shop));
        setShops(parsed);
      })
      .catch(() => {
        if (!isCancelled) setError("No se pudo cargar el mapa");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    if (zoomTimerRef.current) {
      window.clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = null;
    }

    const mapInstance = mapRef.current;
    const layer = markersRef.current;
    layer.clearLayers();

    const shopsInRadius = shops.filter(
      (shop) => distanceMeters(shop.lat, shop.lng, DEFAULT_CENTER) <= MAX_RADIUS_METERS
    );
    const resolvedList = shopsInRadius.length > 0 ? shopsInRadius : shops;

    const updateMarkers = () => {
      layer.clearLayers();
      const zoom = mapInstance.getZoom();
      const { gridSize, maxClusters } = getClusterConfig(zoom);

      if (gridSize > 0) {
        let clusters = buildClusters(resolvedList, gridSize, focusShop);
        clusters.sort((a, b) => b.count - a.count);

        if (maxClusters && clusters.length > maxClusters) {
          const focusIndex = clusters.findIndex((cluster) => cluster.containsFocus);
          if (focusIndex >= maxClusters) {
            const focusCluster = clusters[focusIndex];
            clusters = clusters.slice(0, maxClusters - 1).concat(focusCluster);
          } else {
            clusters = clusters.slice(0, maxClusters);
          }
        }

        clusters.forEach((cluster) => {
          const icon = L.divIcon({
            html: buildClusterHtml(cluster),
            className: modalStyles.markerWrapper,
            iconSize: cluster.containsFocus ? [64, 64] : [56, 56],
            iconAnchor: cluster.containsFocus ? [32, 32] : [28, 28],
            popupAnchor: cluster.containsFocus ? [0, -32] : [0, -28],
          });
          const marker = L.marker([cluster.lat, cluster.lng], { icon });
          marker.bindPopup(buildClusterPopupHtml(cluster), { closeButton: true });
          marker.addTo(layer);
        });
      } else {
        resolvedList.forEach((shop) => {
          const isFocus =
            Boolean(focusShop) &&
            ((focusShop?.uid && shop.uid === focusShop.uid) ||
              normalizeValue(shop.name) === normalizeValue(focusShop?.name || ""));
          const icon = L.divIcon({
            html: buildIconHtml(shop, isFocus),
            className: modalStyles.markerWrapper,
            iconSize: isFocus ? [54, 54] : [44, 44],
            iconAnchor: isFocus ? [27, 27] : [22, 22],
            popupAnchor: isFocus ? [0, -27] : [0, -22],
          });
          const marker = L.marker([shop.lat, shop.lng], { icon });
          marker.bindPopup(buildPopupHtml(shop), { closeButton: true });
          marker.addTo(layer);
        });
      }
    };

    updateMarkers();
    mapInstance.on("zoomend moveend", updateMarkers);

    mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    if (focusShop) {
      const target: [number, number] = [focusShop.lat, focusShop.lng];
      zoomTimerRef.current = window.setTimeout(() => {
        mapRef.current?.flyTo(target, FOCUS_ZOOM, { duration: 1.1 });
      }, 300);
    }

    return () => {
      mapInstance.off("zoomend moveend", updateMarkers);
    };
  }, [shops, focusShop]);

  return (
    <div className={`${modalStyles.panel} ${styles.embedPanel}`}>
      <div className={modalStyles.header}>
        <div>
          <div className={modalStyles.title}>Mapa de tiendas</div>
          <div className={modalStyles.subtitle}>Vista general de Avellaneda</div>
        </div>
      </div>
      <div className={styles.searchWrap}>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar tienda o UID..."
          className={styles.searchInput}
          aria-label="Buscar tienda en el mapa"
        />
      </div>
      <div ref={mapContainerRef} className={`${modalStyles.map} ${styles.embedMap}`}>
        {(loading || error) && (
          <div className={modalStyles.statusOverlay}>
            <div className={modalStyles.status}>
              {error ? "No se pudo cargar el mapa" : "Cargando mapa..."}
            </div>
          </div>
        )}
        <div className={modalStyles.footerGlass} aria-hidden="true">
          <div className={modalStyles.footerText}>
            AVELLANEDA EN VIV<span className={modalStyles.footerRec}>O</span>
          </div>
        </div>
      </div>
    </div>
  );
};
