import { fetchWithAuth } from './http';

export const runSanctions = async () => {
  const res = await fetchWithAuth('/penalties/run', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al ejecutar motor');
  }
  return data;
};

export const fetchSystemStatus = async () => {
  const res = await fetchWithAuth('/system/status');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al obtener estado del sistema');
  }
  return data;
};
