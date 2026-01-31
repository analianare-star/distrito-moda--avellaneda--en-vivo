import { api } from '../../services/api';

export const fetchShops = api.fetchShops;
export const checkShopEmail = api.checkShopEmail;
export const createShop = api.createShop;
export const updateShop = api.updateShop;
export const deleteShop = api.deleteShop;
export const activateShop = api.activateShop;
export const rejectShop = api.rejectShop;
export const suspendAgenda = api.suspendAgenda;
export const liftAgendaSuspension = api.liftAgendaSuspension;
export const resetShopPassword = api.resetShopPassword;
export const assignShopOwner = api.assignShopOwner;
export const acceptShop = api.acceptShop;
export const togglePenalty = api.togglePenalty;
export const buyStreamQuota = api.buyStreamQuota;
export const buyReelQuota = api.buyReelQuota;
export const buyQuota = api.buyQuota;
