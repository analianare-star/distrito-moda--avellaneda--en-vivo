import React from "react";
import { Shop } from "../types";
import { LogoBubble } from "./LogoBubble";
import styles from "./ShopCard.module.css";

// ShopCard renders a store card with optional cover overlay.
// ShopCard muestra una tarjeta de tienda con portada opcional.
interface ShopCardProps {
  shop: Shop;
  isActive: boolean;
  onToggleActive: (shopId: string) => void;
  onOpenShop: (shop: Shop) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, shopId: string) => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  isActive,
  onToggleActive,
  onOpenShop,
  onKeyDown,
}) => {
  const hasCover = Boolean(shop.coverUrl);

  if (!hasCover) {
    return (
      <button
        key={shop.id}
        onClick={() => onOpenShop(shop)}
        className={styles.card}
      >
        <div className={styles.header}>
          <LogoBubble
            src={shop.logoUrl}
            alt={shop.name}
            size={48}
            seed={shop.id || shop.name}
          />
          <div>
            <p className={styles.name}>{shop.name}</p>
            <p className={styles.plan}>{shop.plan}</p>
          </div>
        </div>
        <div className={styles.ratingRow}>
          <span className={styles.ratingValue}>
            {shop.ratingAverage?.toFixed(1) || "0.0"}
          </span>
          <span>★</span>
          <span>({shop.ratingCount || 0})</span>
        </div>
        <p className={styles.address}>
          {shop.address || "Sin dirección cargada"}
        </p>
      </button>
    );
  }

  return (
    <div
      key={shop.id}
      role="button"
      tabIndex={0}
      onClick={() => onToggleActive(shop.id)}
      onKeyDown={(event) => onKeyDown(event, shop.id)}
      className={`${styles.coverCard} group`}
    >
      <img
        src={shop.coverUrl}
        alt={`Portada ${shop.name}`}
        className={styles.coverImage}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className={`${styles.chip} ${isActive ? styles.chipHidden : ''}`}>
        <div className={styles.chipAvatar}>
          <LogoBubble
            src={shop.logoUrl}
            alt={shop.name}
            size={28}
            seed={shop.id || shop.name}
          />
        </div>
        <span className={styles.chipName}>{shop.name}</span>
      </div>

      {isActive && (
        <>
          <div className={styles.activeOverlay} />
          <div className={styles.activeBody}>
            <div className={styles.activeHead}>
              <div className={styles.activeAvatar}>
                <LogoBubble
                  src={shop.logoUrl}
                  alt={shop.name}
                  size={44}
                  seed={shop.id || shop.name}
                />
              </div>
              <div className="min-w-0">
                <p className={styles.activeName}>{shop.name}</p>
                <p className={styles.activePlan}>{shop.plan}</p>
                <div className={styles.activeRating}>
                  <span className={styles.activeRatingValue}>
                    {shop.ratingAverage?.toFixed(1) || "0.0"}
                  </span>
                  <span>★</span>
                  <span>({shop.ratingCount || 0})</span>
                </div>
              </div>
            </div>
            <div className={styles.activeFooter}>
              <p className={styles.activeAddress}>
                {shop.address || "Sin dirección cargada"}
              </p>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenShop(shop);
                }}
                className={styles.activeButton}
              >
                Ver más
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
