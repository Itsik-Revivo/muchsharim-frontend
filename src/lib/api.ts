const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('muchsharim_token');
}
export function setToken(token: string) { localStorage.setItem('muchsharim_token', token); }
export function clearToken() { localStorage.removeItem('muchsharim_token'); localStorage.removeItem('muchsharim_user'); }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) { clearToken(); if (typeof window !== 'undefined') window.location.href = '/login'; throw new Error('Unauthorized'); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export const login = (email: string) =>
  api.post<{ token: string; user: { employee_id: number; email: string; name: string; is_admin: boolean } }>('/api/auth/login', { email });

export const getMe = () => api.get('/api/employees/me');
export const updateMe = (data: unknown) => api.put('/api/employees/me', data);
export const getMyProjects = () => api.get('/api/employees/me/projects');
export const createProject = (data: unknown) => api.post('/api/employees/me/projects', data);
export const updateProject = (id: number, data: unknown) => api.put(`/api/employees/me/projects/${id}`, data);
export const deleteProject = (id: number) => api.delete(`/api/employees/me/projects/${id}`);

export const getStats = () => api.get('/api/admin/stats');
export const listEmployees = (params: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/api/admin/employees${qs ? '?' + qs : ''}`);
};
export const listProjects = (params: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/api/admin/projects${qs ? '?' + qs : ''}`);
};
export const getEmployee = (id: number) => api.get(`/api/admin/employees/${id}`);
export const toggleActive = (id: number) => api.patch(`/api/admin/employees/${id}/toggle-active`);
export const getExpiringLicenses = (days: number) => api.get(`/api/admin/licenses/expiring?days=${days}`);
export const sendForms = (data: unknown) => api.post('/api/admin/forms/send', data);
export const exportUrl = () => `${BASE}/api/admin/export`;
