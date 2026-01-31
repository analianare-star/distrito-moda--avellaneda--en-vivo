import { fetchWithAuth } from './http';

export const fetchReportsAdmin = async (): Promise<any[]> => {
  try {
    const res = await fetchWithAuth('/reports');
    if (!res.ok) throw new Error('Error al obtener reportes');
    return await res.json();
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

export const resolveReportAdmin = async (id: string) => {
  const res = await fetchWithAuth(`/reports/${id}/resolve`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al resolver reporte');
  }
  return data;
};

export const rejectReportAdmin = async (id: string) => {
  const res = await fetchWithAuth(`/reports/${id}/reject`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Error al rechazar reporte');
  }
  return data;
};
