import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X } from 'lucide-react';
import styles from './ShopMapModal.module.css';

interface ShopMapModalProps {
  open: boolean;
  onClose: () => void;
  focusName?: string;
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

const DATA_URL = '/data/datos_convertidos.json';
const DEFAULT_CENTER: [number, number] = [-34.6619, -58.3663];

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

const buildIconHtml = (shop: MapShop, isFocus: boolean) => {
  const markerClass = isFocus ? `${styles.marker} ${styles.markerSelected}` : styles.marker;
  if (shop.logoUrl) {
    return `<div class="${markerClass}"><img class="${styles.markerLogo}" src="${shop.logoUrl}" alt="" /></div>`;
  }
  return `<div class="${markerClass}"><span class="${styles.markerFallback}">DM</span></div>`;
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

export const ShopMapModal: React.FC<ShopMapModalProps> = ({ open, onClose, focusName }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return undefined;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    map.setView(DEFAULT_CENTER, 12);
    map.whenReady(() => {
      map.invalidateSize();
    });

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !mapRef.current || !markersRef.current) return;

    setLoading(true);
    setError(null);

    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((data) => {
        const rows: RawShop[] = Array.isArray(data) ? data : [];
        const shops = rows
          .map(toMapShop)
          .filter((shop): shop is MapShop => Boolean(shop));

        const layer = markersRef.current;
        if (!layer) return;
        layer.clearLayers();

        const focusKey = focusName ? normalizeValue(focusName) : '';
        const focusShop = focusKey
          ? shops.find((shop) => normalizeValue(shop.name) === focusKey || normalizeValue(shop.uid) === focusKey)
          : null;

        const bounds = L.latLngBounds([] as L.LatLngExpression[]);
        let focusMarker: L.Marker | null = null;

        shops.forEach((shop) => {
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
          bounds.extend([shop.lat, shop.lng]);
          if (isFocus) focusMarker = marker;
        });

        if (mapRef.current) {
          if (focusShop) {
            const focusCircle = L.circle([focusShop.lat, focusShop.lng], { radius: 2000 });
            mapRef.current.fitBounds(focusCircle.getBounds(), { padding: [40, 40], maxZoom: 15 });
          } else if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          }
          if (focusMarker) {
            focusMarker.openPopup();
          }
        }
        if (mapRef.current) {
          requestAnimationFrame(() => mapRef.current?.invalidateSize());
        }
      })
      .catch(() => {
        setError('No se pudo cargar el mapa');
      })
      .finally(() => setLoading(false));
  }, [open, focusName]);

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
        </div>
      </div>
    </div>
  );
};
