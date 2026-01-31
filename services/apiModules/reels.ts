import { Reel, SocialPlatform } from '../../types';
import { mapReel } from '../../domains/reels/mappers';
import { fetchWithAuth, fetchWithAuthForm } from './http';

export const fetchReels = async (): Promise<Reel[]> => {
  try {
    const res = await fetchWithAuth('/reels');
    if (!res.ok) throw new Error('Error al obtener reels');
    const data = await res.json();
    return data.map(mapReel);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return [];
  }
};

export const fetchAllReelsAdmin = async (): Promise<Reel[]> => {
  try {
    const res = await fetchWithAuth('/reels/admin');
    if (!res.ok) throw new Error('Error al obtener reels');
    const data = await res.json();
    return data.map(mapReel);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return [];
  }
};

export const fetchReelsByShop = async (shopId: string): Promise<Reel[]> => {
  try {
    const res = await fetchWithAuth(`/reels/shop/${shopId}`);
    if (!res.ok) throw new Error('Error al obtener reels');
    const data = await res.json();
    return data.map(mapReel);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return [];
  }
};

export const registerReelView = async (reelId: string) => {
  try {
    const res = await fetchWithAuth(`/reels/${reelId}/view`, { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error registering reel view:', error);
    return null;
  }
};

export const createReel = async (payload: {
  shopId: string;
  type?: 'VIDEO' | 'PHOTO_SET';
  videoUrl?: string;
  photoUrls?: string[];
  thumbnailUrl?: string;
  durationSeconds?: number;
  platform: SocialPlatform;
  isAdminOverride?: boolean;
  status?: string;
  processingJobId?: string;
}) => {
  try {
    const res = await fetchWithAuth('/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al crear reel');
    return { success: true, message: 'Reel creado', reel: mapReel(data) };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error de conexion' };
  }
};

export const createReelUploadUrls = async (payload: {
  shopId: string;
  type: 'VIDEO' | 'PHOTO_SET';
  files: { fileName: string; contentType: string }[];
}) => {
  const res = await fetchWithAuth('/storage/reels/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo generar URLs de subida');
  }
  return data as { bucket: string; uploads: { path: string; signedUrl: string; publicUrl: string }[] };
};

export const uploadReelMedia = async (payload: { shopId: string; type: 'VIDEO' | 'PHOTO_SET'; files: FileList | File[] }) => {
  const form = new FormData();
  form.append('shopId', payload.shopId);
  form.append('type', payload.type);
  Array.from(payload.files).forEach((file) => form.append('files', file));
  const res = await fetchWithAuthForm('/storage/reels/upload', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || 'No se pudo subir el reel.');
  }
  return res.json();
};

export const hideReel = async (id: string) => {
  await fetchWithAuth(`/reels/${id}/hide`, { method: 'POST' });
};

export const reactivateReel = async (id: string) => {
  await fetchWithAuth(`/reels/${id}/reactivate`, { method: 'POST' });
};
