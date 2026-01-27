import React from "react";
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
  hideUserInfoOnDesktop?: boolean;
  showLogoOnDesktop?: boolean;
  hideOnDesktop?: boolean;
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
  hideUserInfoOnDesktop,
  showLogoOnDesktop,
  hideOnDesktop,
}) => {
  const headerRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (!headerRef.current) {
        return;
      }
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${headerRef.current.offsetHeight}px`
      );
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  return (
    <header
      className={`${styles.header} ${
        hideOnDesktop ? styles.headerDesktopHidden : ""
      }`}
      ref={headerRef}
    >
      <nav className={styles.nav} aria-label="Navegacion principal">
        <div
          className={`${styles.logoWrap} ${
            showLogoOnDesktop ? styles.logoWrapDesktop : ""
          }`}
        >
          <img
            src={brandLogo}
            alt="Distrito Moda"
            className={`${styles.logoImage} ${
              showLogoOnDesktop ? styles.logoImageDesktop : ""
            }`}
          />
        </div>
        <div
          className={`${styles.userInfo} ${
            hideUserInfoOnDesktop ? styles.userInfoDesktopHidden : ""
          }`}
        >
          <span className="flex items-center gap-1">
            <span>Hola</span>
            <span className={styles.userDot}>-</span>
            <span className={styles.userName}>{userName}</span>
          </span>
          {isLoggedIn && (
            <button onClick={onLogout} className={styles.logout}>
              Salir
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
