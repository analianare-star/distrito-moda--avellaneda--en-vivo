import { fetchWithAuth } from './http';

export const resetSystem = async () => {
  await fetchWithAuth('/testpanel/reset', { method: 'POST' });
};
