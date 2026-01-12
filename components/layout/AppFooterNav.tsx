import React from "react";

// AppFooterNav renders the bottom navigation for mobile.
// It keeps labels, badges, and the center CTA in one place.
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
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm md:hidden overflow-visible">
      <nav
        className="mx-auto grid w-full max-w-md grid-cols-5 items-end gap-1 px-2 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3"
        aria-label="Navegacion inferior"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const badgeCount = typeof item.badge === "number" ? item.badge : 0;
          return (
            <button
              key={item.id}
              onClick={item.onSelect}
              className={`flex w-full min-h-[44px] flex-col items-center gap-1 text-[11px] font-semibold ${
                item.isCenter ? "-translate-y-4" : ""
              } ${isActive ? "text-dm-crimson" : "text-gray-500"}`}
            >
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-full ${
                  item.isCenter
                    ? "bg-dm-crimson text-white shadow-lg shadow-dm-crimson/30 ring-4 ring-white"
                    : "bg-white"
                }`}
              >
                <Icon
                  size={20}
                  className={
                    item.isCenter
                      ? "text-white"
                      : isActive
                      ? "text-dm-crimson"
                      : "text-gray-400"
                  }
                />
                {badgeCount > 0 && !item.isCenter && (
                  <span className="absolute -right-0.5 -top-0.5 rounded-full bg-dm-crimson px-1.5 py-0.5 text-[9px] font-bold text-white">
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
