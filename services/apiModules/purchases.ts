import { fetchWithAuth } from './http';

export const createMercadoPagoPreference = async (payload: { type: string; quantity: number; shopId?: string; plan?: string }) => {
  const res = await fetchWithAuth(`/payments/mercadopago/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo iniciar el pago');
  }
  return data;
};

export const confirmMercadoPagoPayment = async (payload: { paymentId?: string; purchaseId?: string }) => {
  const res = await fetchWithAuth(`/payments/mercadopago/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo confirmar el pago');
  }
  return data;
};

export const fetchPurchaseRequests = async (status?: string) => {
  try {
    const query = status ? `?status=${status}` : '';
    const res = await fetchWithAuth(`/purchases${query}`);
    if (!res.ok) throw new Error('Error al obtener compras');
    return await res.json();
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
};

export const fetchPurchasesByShop = async (shopId: string, status?: string) => {
  try {
    const query = status ? `?status=${status}` : '';
    const res = await fetchWithAuth(`/purchases/shop/${shopId}${query}`);
    if (!res.ok) throw new Error(`Error al obtener compras (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching shop purchases:', error);
    return [];
  }
};

export const approvePurchase = async (id: string) => {
  const res = await fetchWithAuth(`/purchases/${id}/approve`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al aprobar compra');
  }
  return data;
};

export const rejectPurchase = async (id: string, notes?: string) => {
  const res = await fetchWithAuth(`/purchases/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al rechazar compra');
  }
  return data;
};
