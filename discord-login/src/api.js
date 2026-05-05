import { API_AUTH_URL } from './config';

const clearAuthStorage = () => {
  sessionStorage.clear();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');
};

export const apiFetch = async (url, options = {}) => {
  const accessToken = sessionStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  const headers = new Headers(options.headers || {});

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = hasBody && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  let res = await fetch(url, fetchOptions);

  if (res.status !== 401 || !refreshToken) {
    return res;
  }

  try {
    const refreshRes = await fetch(`${API_AUTH_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      clearAuthStorage();
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    const refreshData = await refreshRes.json();

    sessionStorage.setItem('accessToken', refreshData.accessToken);
    if (refreshData.refreshToken) {
      localStorage.setItem('refreshToken', refreshData.refreshToken);
    }
    if (refreshData.sessionId) {
      localStorage.setItem('sessionId', refreshData.sessionId);
    }

    headers.set('Authorization', `Bearer ${refreshData.accessToken}`);

    return await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error('Lỗi tự động refresh token:', err);
    clearAuthStorage();
    window.location.href = '/login';
    throw err;
  }
};