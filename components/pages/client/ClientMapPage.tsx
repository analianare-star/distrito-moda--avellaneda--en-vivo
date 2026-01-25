import React from "react";
import { ShopMapModal } from "../../ShopMapModal";

interface ClientMapPageProps {
  onClose: () => void;
}

export const ClientMapPage: React.FC<ClientMapPageProps> = ({ onClose }) => {
  return <ShopMapModal open onClose={onClose} />;
};
