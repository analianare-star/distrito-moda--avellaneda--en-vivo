import React from "react";
import styles from "./AppFooterNav.module.css";

// AppFooterNav muestra la navegacion inferior mobile.
// AppFooterNav renders the mobile bottom navigation.
export interface FooterNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isCenter?: boolean;
  badge?: number;
  onSelect: () => void;
}

interface AppFooterNavProps {
  items: FooterNavItem[];
  activeId: string;
}

export const AppFooterNav: React.FC<AppFooterNavProps> = ({ items, activeId }) => {
  return (
    <footer className={styles.footer}>
      <nav
        className={styles.nav}
        aria-label="Navegación inferior"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const badgeCount = typeof item.badge === "number" ? item.badge : 0;
          return (
            <button
              key={item.id}
              onClick={item.onSelect}
              className={`${styles.item} ${
                item.isCenter ? styles.itemCenter : ""
              } ${isActive ? styles.itemActive : styles.itemInactive}`}
            >
              <span
                className={`${styles.iconWrap} ${
                  item.isCenter ? styles.iconWrapCenter : ""
                }`}
              >
                <Icon
                  size={20}
                  className={
                    item.isCenter
                      ? styles.iconCenter
                      : isActive
                      ? styles.iconActive
                      : styles.iconInactive
                  }
                />
                {badgeCount > 0 && !item.isCenter && (
                  <span className={styles.badge}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
