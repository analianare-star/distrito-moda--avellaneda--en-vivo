import React from "react";
import { ChevronDown } from "lucide-react";
import styles from "./AppHeader.module.css";

// AppHeader muestra marca, menu y saludo del usuario.
// AppHeader renders brand, menu, and user greeting.
export interface HeaderNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onSelect: () => void;
  badge?: number;
}

interface AppHeaderProps {
  brandLogo: string;
  bottomNavItems: HeaderNavItem[];
  activeBottomNav: string;
  isDesktopMenuOpen: boolean;
  onToggleDesktopMenu: () => void;
  onCloseDesktopMenu: () => void;
  userName: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  brandLogo,
  bottomNavItems,
  activeBottomNav,
  isDesktopMenuOpen,
  onToggleDesktopMenu,
  onCloseDesktopMenu,
  userName,
  isLoggedIn,
  onLogout,
}) => {
  return (
    <header className={styles.header}>
      <nav
        className={styles.nav}
        aria-label="Navegacion principal"
      >
        <div className={styles.desktopMenuWrap}>
          <button
            onClick={onToggleDesktopMenu}
            className={styles.menuButton}
            aria-expanded={isDesktopMenuOpen}
            aria-controls="desktop-menu"
          >
            Menu
            <ChevronDown
              size={14}
              className={`${styles.menuChevron} ${
                isDesktopMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isDesktopMenuOpen && (
            <div
              id="desktop-menu"
              className={styles.menuPanel}
            >
              <div className={styles.menuList}>
                {bottomNavItems.map((item) => {
                  const isActive = activeBottomNav === item.id;
                  const badgeCount = typeof item.badge === "number" ? item.badge : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onSelect();
                        onCloseDesktopMenu();
                      }}
                      className={`${styles.menuItem} ${
                        isActive ? styles.menuItemActive : styles.menuItemInactive
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {item.label}
                        {badgeCount > 0 && (
                          <span className={styles.badge}>
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </span>
                      <item.icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.logoWrap}>
          <img
            src={brandLogo}
            alt="Distrito Moda"
            className={styles.logoImage}
          />
        </div>

        <div className={styles.userInfo}>
          <span className="flex items-center gap-1">
            <span>Hola</span>
            <span className={styles.userDot}>·</span>
            <span className={styles.userName}>
              {userName}
            </span>
          </span>
          {isLoggedIn && (
            <button
              onClick={onLogout}
              className={styles.logout}
            >
              Salir
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
