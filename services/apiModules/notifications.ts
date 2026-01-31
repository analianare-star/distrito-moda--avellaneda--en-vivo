import { fetchWithAuth } from './http';

export const fetchNotifications = async (userId: string) => {
  try {
    const res = await fetchWithAuth(`/notifications/${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    const res = await fetchWithAuth(`/notifications/${id}/read`, { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error marking notification read:', error);
    return null;
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  try {
    const res = await fetchWithAuth(`/notifications/${userId}/read-all`, { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return null;
  }
};

export const runNotifications = async (minutesAhead: number = 15) => {
  try {
    const res = await fetchWithAuth('/notifications/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutesAhead }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error running notifications:', error);
    return null;
  }
};

export const fetchNotificationsAdmin = async (options?: { limit?: number; unreadOnly?: boolean; type?: string }) => {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.unreadOnly) params.set('unread', 'true');
    if (options?.type && options.type !== 'ALL') params.set('type', options.type);
    const query = params.toString();
    const res = await fetchWithAuth(`/notifications${query ? `?${query}` : ''}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }
};
