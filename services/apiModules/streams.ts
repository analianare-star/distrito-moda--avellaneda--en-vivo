import { Stream, StreamStatus } from '../../types';
import { mapStream } from '../../domains/streams/mappers';
import { fetchWithAuth } from './http';

export const fetchStreams = async (): Promise<Stream[]> => {
  try {
    const res = await fetchWithAuth('/streams');
    if (!res.ok) throw new Error('Error al obtener vivos');
    const data = await res.json();
    return data.map(mapStream);
  } catch (error) {
    console.error('Error fetching streams:', error);
    return [];
  }
};

export const createStream = async (payload: any): Promise<{ success: boolean; message: string; stream?: Stream }> => {
  try {
    const scheduledAt = payload.fullDateISO || payload.scheduledAt;
    const streamPayload = {
      title: payload.title,
      description: payload.description,
      shopId: payload.shopId || payload.shop?.id,
      status: payload.status,
      scheduledAt,
      platform: payload.platform || 'Instagram',
      url: payload.url,
      isVisible: payload.isVisible,
      extensionCount: payload.extensionCount ?? 0,
      isAdminOverride: payload.isAdminOverride,
    };

    const res = await fetchWithAuth('/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(streamPayload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al crear vivo');
    return { success: true, message: 'Vivo agendado exitosamente!', stream: mapStream(data) };
  } catch (error: any) {
    console.error('Error creating stream:', error);
    return { success: false, message: error.message || 'Error de conexion al crear vivo' };
  }
};

export const updateStream = async (data: any) => {
  if (!data.id) throw new Error('No ID provided for update');

  const shouldSendSchedule =
    !data.status ||
    data.status === StreamStatus.UPCOMING ||
    data.status === StreamStatus.PENDING_REPROGRAMMATION ||
    data.forceScheduleUpdate;
  const scheduledAt = shouldSendSchedule ? data.fullDateISO || data.scheduledAt : undefined;
  const startTime = data.startedAt ? new Date(data.startedAt).toISOString() : data.startTime;
  const dbPayload = {
    title: data.title,
    description: data.description,
    status: data.status,
    scheduledAt,
    platform: data.platform,
    url: data.url,
    isVisible: data.isVisible,
    extensionCount: data.extensionCount,
    reportCount: data.reportCount,
    startTime,
    isAdminOverride: data.isAdminOverride,
    forceScheduleUpdate: data.forceScheduleUpdate,
  };

  const res = await fetchWithAuth(`/streams/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dbPayload),
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || 'Error al actualizar vivo');
  }
  return mapStream(payload);
};

export const deleteStream = async (id: string) => {
  await fetchWithAuth(`/streams/${id}`, { method: 'DELETE' });
};

export const cancelStream = async (id: string, reason?: string) => {
  const res = await fetchWithAuth(`/streams/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || 'Error al cancelar vivo');
  }
};

export const banStream = async (id: string, reason?: string) => {
  const res = await fetchWithAuth(`/streams/${id}/ban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || 'Error al bloquear vivo');
  }
};

export const reportStream = async (streamId: string, reason: string) => {
  try {
    const res = await fetchWithAuth(`/streams/${streamId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al reportar');
    return { success: true, message: 'Reporte recibido' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error de conexion' };
  }
};

export const rateStream = async (streamId: string, rating: number, comment?: string) => {
  const res = await fetchWithAuth(`/streams/${streamId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Error al calificar vivo');
  }
  return data;
};

export const toggleLikeStream = async (streamId: string): Promise<{ liked: boolean; likes: number } | null> => {
  try {
    const res = await fetchWithAuth(`/streams/${streamId}/like`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'No se pudo guardar el like');
    }
    return { liked: Boolean(data?.liked), likes: Number(data?.likes ?? 0) };
  } catch (error) {
    console.error('Error toggling like:', error);
    return null;
  }
};

export const updateStreamTime = async (streamId: string, minutes: number) => {
  const scheduledAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  return updateStream({ id: streamId, fullDateISO: scheduledAt });
};

export const runStreamsLifecycle = async () => {
  const res = await fetchWithAuth('/streams/run-lifecycle', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al ejecutar ciclo de vivos');
  }
  return data;
};
