import { fetchWithAuth } from './http';

export const fetchAuthMe = async (): Promise<{ userType?: string; shopId?: string; adminRole?: string; authUserId?: string } | null> => {
  try {
    const res = await fetchWithAuth('/auth/me');
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching auth profile:', error);
    return null;
  }
};

export const createClientMe = async (payload: { displayName?: string; avatarUrl?: string }) => {
  const res = await fetchWithAuth('/clients/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
};

export const fetchClientState = async (): Promise<{ favorites: string[]; reminders: string[]; viewedReels?: string[]; likes?: string[] } | null> => {
  try {
    const res = await fetchWithAuth('/clients/me');
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching client state:', error);
    return null;
  }
};

export const loginUser = async (email: string, _userId?: string) => ({
  id: '1',
  isLoggedIn: true,
  email,
  name: 'Admin',
  favorites: [],
  reminders: [],
  history: [],
  viewedReels: [],
  likes: [],
  reports: [],
  preferences: { theme: 'light', notifications: true },
});
