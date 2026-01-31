import { auth } from '../../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const buildHeaders = async (options: { json?: boolean; headers?: Record<string, string> } = {}) => {
  const baseHeaders: Record<string, string> = {};
  if (options.json) {
    baseHeaders['Content-Type'] = 'application/json';
  }
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }
  return options.headers ? { ...baseHeaders, ...options.headers } : baseHeaders;
};

export const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
  const headers = await buildHeaders({
    json: Boolean(options.body),
    headers: options.headers as Record<string, string> | undefined,
  });
  return fetch(`${API_URL}${path}`, { ...options, headers });
};

export const fetchWithAuthForm = async (path: string, options: RequestInit = {}) => {
  const headers = await buildHeaders({ json: false, headers: options.headers as Record<string, string> | undefined });
  return fetch(`${API_URL}${path}`, { ...options, headers });
};

export { API_URL };
