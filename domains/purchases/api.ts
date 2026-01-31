import { api } from '../../services/api';

export const fetchPurchaseRequests = api.fetchPurchaseRequests;
export const fetchPurchasesByShop = api.fetchPurchasesByShop;
export const approvePurchase = api.approvePurchase;
export const rejectPurchase = api.rejectPurchase;
export const createMercadoPagoPreference = api.createMercadoPagoPreference;
export const confirmMercadoPagoPayment = api.confirmMercadoPagoPayment;
