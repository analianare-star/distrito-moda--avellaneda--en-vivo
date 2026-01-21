import { Shop } from "../types";

export const normalizeMediaUrl = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutQuery = trimmed.split("?")[0];
  const match = withoutQuery.match(
    /^(https?:\/\/[^/]+)\/sites\/default\/files\/styles\/[^/]+\/public\/(.+)$/
  );
  if (match) {
    return `${match[1]}/sites/default/files/${match[2]}`;
  }
  return withoutQuery;
};

export const getShopCoverUrl = (shop: Shop) => {
  const raw =
    shop.coverUrl?.trim() ||
    shop.addressDetails?.storeImageUrl ||
    shop.addressDetails?.imageUrl ||
    shop.logoUrl;
  return normalizeMediaUrl(raw);
};
