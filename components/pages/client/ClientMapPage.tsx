import React, { Suspense } from "react";

const ShopMapModal = React.lazy(async () => {
  const mod = await import("../../ShopMapModal");
  return { default: mod.ShopMapModal };
});

interface ClientMapPageProps {
  onClose: () => void;
}

export const ClientMapPage: React.FC<ClientMapPageProps> = ({ onClose }) => {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[180] bg-black/70" />}>
      <ShopMapModal open onClose={onClose} />
    </Suspense>
  );
};
