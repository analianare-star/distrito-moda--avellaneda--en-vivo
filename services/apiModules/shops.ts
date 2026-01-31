import { Shop } from '../../types';
import { mapShop } from '../../domains/shops/mappers';
import { API_URL, fetchWithAuth } from './http';

export const fetchShops = async (options?: { limit?: number; offset?: number }): Promise<Shop[]> => {
  try {
    const params = new URLSearchParams();
    if (options?.limit && Number.isFinite(options.limit)) {
      params.set('limit', String(options.limit));
    }
    if (options?.offset && Number.isFinite(options.offset)) {
      params.set('offset', String(options.offset));
    }
    const query = params.toString();
    const res = await fetchWithAuth(`/shops${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Error al conectar con el servidor');
    const data = await res.json();
    return data.map(mapShop);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return [];
  }
};

export const checkShopEmail = async (email: string): Promise<boolean> => {
  try {
    const trimmed = email.trim();
    if (!trimmed) return false;
    const res = await fetch(`${API_URL}/shops/check-email?email=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.exists);
  } catch (error) {
    console.error('Error checking shop email:', error);
    return false;
  }
};

export const deleteShop = async (shopId: string) => {
  try {
    const res = await fetchWithAuth(`/shops/${shopId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'No se pudo eliminar la tienda.');
    }
    return await res.json();
  } catch (error) {
    console.error('Error deleting shop:', error);
    throw error;
  }
};

export const createShop = async (payload: any): Promise<{ success: boolean; message: string; shop?: Shop }> => {
  try {
    const res = await fetchWithAuth('/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al crear tienda');
    return { success: true, message: 'Tienda creada exitosamente!', shop: mapShop(data) };
  } catch (error: any) {
    console.error('Error creating shop:', error);
    return { success: false, message: error.message || 'Error de conexion' };
  }
};

export const updateShop = async (id: string, data: any) => {
  const dbPayload = {
    name: data.name,
    razonSocial: data.razonSocial,
    cuit: data.cuit,
    email: data.email,
    address: data.address,
    logoUrl: data.logoUrl,
    coverUrl: data.coverUrl,
    website: data.website,
    addressDetails: data.addressDetails || {},
    paymentMethods: data.paymentMethods || [],
    minimumPurchase: Number(data.minimumPurchase || 0),
    socialHandles: data.socialHandles || {},
    whatsappLines: data.whatsappLines || [],
  };

  const res = await fetchWithAuth(`/shops/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dbPayload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al guardar datos de tienda');
  }

  return mapShop(await res.json());
};

export const buyReelQuota = async (shopId: string, amount: number, _payment?: any) => {
  const res = await fetchWithAuth(`/shops/${shopId}/buy-reel-quota`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    shop: data?.shop ? mapShop(data.shop) : null,
    purchase: data?.purchase || null,
  };
};

export const buyStreamQuota = async (shopId: string, amount: number, _payment?: any) => {
  const res = await fetchWithAuth(`/shops/${shopId}/buy-stream-quota`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    shop: data?.shop ? mapShop(data.shop) : null,
    purchase: data?.purchase || null,
  };
};

export const buyQuota = async (shopId: string, amount: number) => buyStreamQuota(shopId, amount);

export const togglePenalty = async (id: string) => {
  try {
    await fetchWithAuth(`/shops/${id}/toggle-penalty`, { method: 'POST' });
  } catch (e) {}
  return null;
};

export const activateShop = async (id: string, reason?: string) => {
  await fetchWithAuth(`/shops/${id}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
};

export const rejectShop = async (id: string, reason?: string) => {
  await fetchWithAuth(`/shops/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
};

export const suspendAgenda = async (id: string, reason?: string, days?: number) => {
  await fetchWithAuth(`/shops/${id}/suspend-agenda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, days }),
  });
};

export const liftAgendaSuspension = async (id: string) => {
  await fetchWithAuth(`/shops/${id}/lift-suspension`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const resetShopPassword = async (id: string) => {
  const res = await fetchWithAuth(`/shops/${id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Error al resetear clave');
  }
  return data;
};

export const assignShopOwner = async (id: string, payload: { authUserId?: string; email?: string }) => {
  const res = await fetchWithAuth(`/shops/${id}/assign-owner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Error al asignar dueño');
  }
  return mapShop(data);
};

export const acceptShop = async (shopId: string) => {
  const res = await fetchWithAuth(`/shops/${shopId}/accept`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Error al aceptar tienda');
  }
  return mapShop(data);
};
