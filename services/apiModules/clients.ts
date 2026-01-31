import { fetchWithAuth } from './http';

export const addFavorite = async (shopId: string): Promise<string[] | null> => {
  try {
    const res = await fetchWithAuth(`/clients/me/favorites/${shopId}`, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error adding favorite:', error);
    return null;
  }
};

export const removeFavorite = async (shopId: string): Promise<string[] | null> => {
  try {
    const res = await fetchWithAuth(`/clients/me/favorites/${shopId}`, { method: 'DELETE' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.favorites || [];
  } catch (error) {
    console.error('Error removing favorite:', error);
    return null;
  }
};

export const addReminder = async (streamId: string): Promise<string[] | null> => {
  try {
    const res = await fetchWithAuth(`/clients/me/reminders/${streamId}`, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reminders || [];
  } catch (error) {
    console.error('Error adding reminder:', error);
    return null;
  }
};

export const removeReminder = async (streamId: string): Promise<string[] | null> => {
  try {
    const res = await fetchWithAuth(`/clients/me/reminders/${streamId}`, { method: 'DELETE' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reminders || [];
  } catch (error) {
    console.error('Error removing reminder:', error);
    return null;
  }
};
