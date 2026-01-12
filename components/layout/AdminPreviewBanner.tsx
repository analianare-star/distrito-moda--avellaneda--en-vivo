import React from "react";

// AdminPreviewBanner indica vista previa admin de cliente o tienda.
// AdminPreviewBanner highlights admin preview for client or shop.
interface AdminPreviewBannerProps {
  mode: "CLIENT" | "MERCHANT";
  shopName?: string;
  onExit: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({
  mode,
  shopName,
  onExit,
}) => {
  const label = mode === "CLIENT" ? "Cliente" : "Tienda";
  const subtitle = mode === "MERCHANT" && shopName ? ` · ${shopName}` : "";

  return (
    <div className="fixed top-14 left-0 right-0 z-[60] flex items-center justify-between bg-dm-dark/95 px-4 py-2 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-dm-crimson" />
        <span>
          Vista admin: {label}
          {subtitle}
        </span>
      </div>
      <button
        onClick={onExit}
        className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold text-white hover:border-white/60"
      >
        Volver al admin
      </button>
    </div>
  );
};
