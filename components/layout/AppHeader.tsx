import React from "react";
import { ChevronDown } from "lucide-react";

// AppHeader renders the brand, desktop menu, and user greeting.
// It keeps header semantics and avoids layout logic in App.
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 px-6 py-3 shadow-sm backdrop-blur-sm md:py-4">
      <nav
        className="relative flex min-h-[88px] items-center justify-between"
        aria-label="Navegacion principal"
      >
        <div className="relative hidden md:flex items-center">
          <button
            onClick={onToggleDesktopMenu}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-dm-dark"
            aria-expanded={isDesktopMenuOpen}
            aria-controls="desktop-menu"
          >
            Menu
            <ChevronDown
              size={14}
              className={`transition-transform ${
                isDesktopMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isDesktopMenuOpen && (
            <div
              id="desktop-menu"
              className="absolute left-0 top-11 z-50 w-48 rounded-xl border border-gray-100 bg-white shadow-xl"
            >
              <div className="py-2">
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
                      className={`flex w-full items-center justify-between px-4 py-2 text-xs font-bold ${
                        isActive ? "text-dm-crimson" : "text-gray-500"
                      } hover:bg-gray-50`}
                    >
                      <span className="flex items-center gap-2">
                        {item.label}
                        {badgeCount > 0 && (
                          <span className="rounded-full bg-dm-crimson px-1.5 py-0.5 text-[9px] font-bold text-white">
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

        <div className="absolute left-1/2 -translate-x-1/2">
          <img
            src={brandLogo}
            alt="Distrito Moda"
            className="h-20 w-auto object-contain sm:h-24 md:h-28"
          />
        </div>

        <div className="absolute bottom-2 right-4 flex flex-col items-end text-[11px] font-sans text-gray-500 leading-tight md:right-6">
          <span className="flex items-center gap-1">
            <span>Hola</span>
            <span className="font-semibold text-dm-dark">·</span>
            <span className="inline-block max-w-[150px] truncate font-semibold text-dm-dark">
              {userName}
            </span>
          </span>
          {isLoggedIn && (
            <button
              onClick={onLogout}
              className="mt-0.5 text-[10px] font-semibold text-gray-400 underline underline-offset-2 hover:text-dm-crimson"
            >
              Salir
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
