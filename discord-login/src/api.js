// src/api.js
export const apiFetch = async (url, options = {}) => {
  const accessToken = sessionStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  // Add Authorization header
  options.headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };

  let res = await fetch(url, options);

  // Nếu accessToken hết hạn (401), tự động refresh
  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!refreshRes.ok) {
      // Refresh token hết hạn → logout
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('Session expired. Please login again.');
    }

    const refreshData = await refreshRes.json();
    // Lưu token mới
    sessionStorage.setItem('accessToken', refreshData.accessToken);
    localStorage.setItem('refreshToken', refreshData.refreshToken);

    // Retry request với token mới
    options.headers.Authorization = `Bearer ${refreshData.accessToken}`;
    res = await fetch(url, options);
  }

  return res;
};

export const restoreAccount = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/account/restore', { // Thay URL bằng endpoint của bạn
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể khôi phục tài khoản.');
  }
  return data;
};