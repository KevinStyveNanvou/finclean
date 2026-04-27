// lib/auth.ts
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};