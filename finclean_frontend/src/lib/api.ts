// lib/api.ts
import axios from 'axios';

// =====================
// Helpers cookies
// =====================
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
}

function clearAuthCookies() {
  deleteCookie('access_token');
  deleteCookie('refresh_token');
  deleteCookie('csrftoken');
}

// =====================
// Instance axios
// =====================
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// =====================
// Intercepteur requête
// =====================
api.interceptors.request.use(
  (config) => {
    const token = getCookie('access_token'); // cookies, pas localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =====================
// Intercepteur réponse
// =====================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getCookie('refresh_token');

      // Pas de refresh token disponible → logout immédiat sans boucle
      if (!refreshToken) {
        clearAuthCookies();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
        return Promise.reject(error);
      }

      try {
        // Le refresh_token est envoyé via cookie (withCredentials)
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}user/refresh/`,
          {},
          { withCredentials: true }
        );

        // Le backend a reposé un nouveau access_token en cookie
        const newToken = getCookie('access_token');
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh échoué → logout propre
        clearAuthCookies();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// =====================
// API Functions
// =====================
export const getPermanentScans = () => api.get('/scans/permanent/');
export const createPermanentScan = (data: any) => api.post('/scans/permanent/create/', data);
export const updatePermanentScan = (id: number, data: any) => api.put(`/scans/permanent/${id}/update/`, data);
export const deletePermanentScan = (id: number) => api.delete(`/scans/permanent/${id}/delete/`);
export const getDiscoveredHosts = () => api.get('/scans/hosts/discovered/');
export const updateCriticalities = (data: any) => api.put('/scans/criticalities/update/', data);