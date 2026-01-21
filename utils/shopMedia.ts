import { Shop } from "../types";

export const getShopCoverUrl = (shop: Shop) => {
  return (
    shop.coverUrl?.trim() ||
    shop.addressDetails?.storeImageUrl ||
    shop.addressDetails?.imageUrl ||
    shop.logoUrl
  );
};
