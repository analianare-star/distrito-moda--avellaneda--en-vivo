import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X } from 'lucide-react';
import styles from './ShopMapModal.module.css';

interface ShopMapModalProps {
  open: boolean;
  onClose: () => void;
  focusName?: string;
  focusKeys?: string[];
}

type RawShop = Record<string, unknown>;

type MapShop = {
  uid: string;
  name: string;
  logoUrl: string | null;
  catalogUrl: string | null;
  address: string | null;
  lat: number;
  lng: number;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAP_API_URL = `${API_URL}/shops/map-data`;
const API_URL = import.meta.env.VITE_API_URL;
const MAP_API_URL = API_URL ? `${API_URL}/shops/map-data` : DATA_URL;
const DEFAULT_CENTER: [number, number] = [-34.6275057, -58.4752695];
const DEFAULT_ZOOM = 15;
const FOCUS_ZOOM = 16;
const MAX_RADIUS_METERS = 2500;
const LOW_ZOOM_CLUSTER_LIMIT = 5;

type Cluster = {
  key: string;
  lat: number;
  lng: number;
  count: number;
  shops: MapShop[];
  containsFocus: boolean;
};

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toMapShop = (row: RawShop): MapShop | null => {
  const lat = parseNumber(row['lat']);
  const lng = parseNumber(row['lng']);
  if (lat === null || lng === null) return null;
  const name = String(row['Nombre completo'] || row['Usuario'] || 'Tienda').trim();
  const logoUrl = String(row['Logo_URL'] || row['logourl'] || row['logoUrl'] || '').trim();
  const catalogUrl = String(row['url_catalogo'] || '').trim();
  const uid = String(row['Uid'] || row['UID'] || row['uid'] || '').trim();
  const addressParts = [
    row['Calle'],
    row['Ciudad'],
    row['Provincia'],
    row['Código postal'] ?? row['Codigo postal'],
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : null;
  return {
    uid,
    name,
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
  const markerClass = isFocus ? `${styles.marker} ${styles.markerSelected}` : styles.marker;
  if (shop.logoUrl) {
    return `<div class="${markerClass}"><img class="${styles.markerLogo}" src="${shop.logoUrl}" alt="" /></div>`;
  }
  return `<div class="${markerClass}"><span class="${styles.markerFallback}">DM</span></div>`;
};

const buildClusterHtml = (cluster: Cluster) => {
  const clusterClass = cluster.containsFocus
    ? `${styles.clusterMarker} ${styles.clusterSelected}`
    : styles.clusterMarker;
  return `<div class="${clusterClass}"><span class="${styles.clusterCount}">${cluster.count}</span></div>`;
};

const buildClusterPopupHtml = (cluster: Cluster) => {
  const message = cluster.containsFocus
    ? 'Zona con tu tienda seleccionada'
    : 'Zona con tiendas cercanas';
  return `
    <div class="${styles.popup}">
      <div class="${styles.popupName}">${message}</div>
      <div class="${styles.popupMeta}">${cluster.count} tiendas en esta zona</div>
      <div class="${styles.popupMeta}">Acercá el mapa para ver más detalle</div>
    </div>
  `;
};

const buildPopupHtml = (shop: MapShop) => {
  const name = escapeHtml(shop.name || 'Tienda');
  const uid = shop.uid ? `UID ${escapeHtml(shop.uid)}` : 'Tienda Avellaneda';
  const mapsQuery = shop.address ? shop.address : `${shop.lat},${shop.lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const logoMarkup = shop.logoUrl
    ? `<img class="${styles.popupLogo}" src="${shop.logoUrl}" alt="${name}" />`
    : `<div class="${styles.popupLogoFallback}">DM</div>`;
  const catalogButton = shop.catalogUrl
    ? `<a class="${styles.popupButton}" target="_blank" rel="noreferrer" href="${shop.catalogUrl}">Ver catálogo DM</a>`
    : '';
  return `
    <div class="${styles.popup}">
      <div class="${styles.popupHeader}">
        ${logoMarkup}
        <div>
          <div class="${styles.popupName}">${name}</div>
          <div class="${styles.popupMeta}">${uid}</div>
        </div>
      </div>
      <div class="${styles.popupActions}">
        <a class="${styles.popupButton} ${styles.popupPrimary}" target="_blank" rel="noreferrer" href="${mapsUrl}">Cómo llegar</a>
        ${catalogButton}
      </div>
    </div>
  `;
};

export const ShopMapModal: React.FC<ShopMapModalProps> = ({
  open,
  onClose,
  focusName,
  focusKeys,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const zoomTimerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const focusSignature = (focusKeys && focusKeys.length > 0 ? focusKeys.join('|') : focusName || '');

  useEffect(() => {
    if (!open || !mapContainerRef.current) return undefined;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    setMapReady(true);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    map.whenReady(() => {
      map.invalidateSize();
    });

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);

    return () => {
      window.clearTimeout(resizeTimer);
      setMapReady(false);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !mapReady || !mapRef.current) return;
    if (!('geolocation' in navigator)) return;

    const mapInstance = mapRef.current;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!mapInstance) return;
        const latlng: [number, number] = [position.coords.latitude, position.coords.longitude];
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(latlng);
          return;
        }
        userMarkerRef.current = L.circleMarker(latlng, {
          radius: 6,
          color: '#1d4ed8',
          weight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
        }).addTo(mapInstance);
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 10_000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [open, mapReady]);

  useEffect(() => {
    if (!open || !mapRef.current || !markersRef.current) return;

    if (zoomTimerRef.current) {
      window.clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = null;
    }

    setLoading(true);
    setError(null);

    let isCancelled = false;
    const mapInstance = mapRef.current;
    const layer = markersRef.current;

    fetch(MAP_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((data) => {
        if (isCancelled || !data) return;
        const rows: RawShop[] = Array.isArray(data) ? data : [];
        const shops = rows
          .map(toMapShop)
          .filter((shop): shop is MapShop => Boolean(shop));

        if (!layer || !mapInstance) return;
        layer.clearLayers();

        const normalizedKeys = (focusKeys?.length ? focusKeys : focusName ? [focusName] : [])
          .map((value) => normalizeValue(String(value)))
          .filter(Boolean);
        const focusShop = normalizedKeys.length
          ? shops.find((shop) =>
              normalizedKeys.some((key) => {
                const nameKey = normalizeValue(shop.name || '');
                const uidKey = normalizeValue(shop.uid || '');
                const isExactMatch = nameKey === key || (uidKey && uidKey === key);
                if (isExactMatch) return true;
                if (key.length < 4) return false;
                return (
                  (nameKey && nameKey.includes(key)) ||
                  (key.includes(nameKey) && nameKey.length >= 4)
                );
              })
            )
          : null;

        const shopsInRadius = shops.filter(
          (shop) => distanceMeters(shop.lat, shop.lng, DEFAULT_CENTER) <= MAX_RADIUS_METERS
        );
        if (focusShop) {
          const focusId = focusShop.uid || normalizeValue(focusShop.name);
          const alreadyIncluded = shopsInRadius.some(
            (shop) => (shop.uid || normalizeValue(shop.name)) === focusId
          );
          if (!alreadyIncluded) {
            shopsInRadius.push(focusShop);
          }
        }

        let focusMarker: L.Marker | null = null;

        const updateMarkers = () => {
          if (!mapInstance || !layer) return;
          layer.clearLayers();

          const zoom = mapInstance.getZoom();
          const { gridSize, maxClusters } = getClusterConfig(zoom);
          const visibleShops = shopsInRadius;

          if (gridSize > 0) {
            let clusters = buildClusters(visibleShops, gridSize, focusShop);
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
                className: styles.markerWrapper,
                iconSize: cluster.containsFocus ? [64, 64] : [56, 56],
                iconAnchor: cluster.containsFocus ? [32, 32] : [28, 28],
                popupAnchor: cluster.containsFocus ? [0, -32] : [0, -28],
              });
              const marker = L.marker([cluster.lat, cluster.lng], { icon });
              marker.bindPopup(buildClusterPopupHtml(cluster), { closeButton: true });
              marker.addTo(layer);
              if (cluster.containsFocus) focusMarker = marker;
            });
          } else {
            visibleShops.forEach((shop) => {
              const isFocus =
                Boolean(focusShop) &&
                ((focusShop?.uid && shop.uid === focusShop.uid) ||
                  normalizeValue(shop.name) === normalizeValue(focusShop?.name || ''));
              const icon = L.divIcon({
                html: buildIconHtml(shop, isFocus),
                className: styles.markerWrapper,
                iconSize: isFocus ? [54, 54] : [44, 44],
                iconAnchor: isFocus ? [27, 27] : [22, 22],
                popupAnchor: isFocus ? [0, -27] : [0, -22],
              });
              const marker = L.marker([shop.lat, shop.lng], { icon });
              marker.bindPopup(buildPopupHtml(shop), { closeButton: true });
              marker.addTo(layer);
              if (isFocus) focusMarker = marker;
            });
          }
        };

        updateMarkers();
        mapInstance.on('zoomend moveend', updateMarkers);

        mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        if (focusShop) {
          const target: [number, number] = [focusShop.lat, focusShop.lng];
          zoomTimerRef.current = window.setTimeout(() => {
            mapRef.current?.flyTo(target, FOCUS_ZOOM, { duration: 1.2 });
            focusMarker?.openPopup();
          }, 2000);
        }
        requestAnimationFrame(() => mapInstance.invalidateSize());

        return () => {
          mapInstance.off('zoomend moveend', updateMarkers);
        };
      })
      .catch(() => {
        setError('No se pudo cargar el mapa');
      })
      .finally(() => setLoading(false));
    return () => {
      isCancelled = true;
      if (zoomTimerRef.current) {
        window.clearTimeout(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
    };
  }, [open, focusSignature]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Mapa de tiendas</div>
            <div className={styles.subtitle}>Vista general de Avellaneda</div>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div ref={mapContainerRef} className={styles.map}>
          {(loading || error) && (
            <div className={styles.statusOverlay}>
              <div className={styles.status}>
                {error ? 'No se pudo cargar el mapa' : 'Cargando mapa…'}
              </div>
            </div>
          )}
          <div className={styles.footerGlass} aria-hidden="true">
            <div className={styles.footerText}>
              AVELLANEDA EN VIV<span className={styles.footerRec}>O</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
