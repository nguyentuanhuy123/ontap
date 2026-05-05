import { API_AUTH_URL, API_USER_URL } from '../config';
import { apiFetch } from '../api';

const saveAuthData = (data) => {
  if (data?.accessToken) {
    sessionStorage.setItem('accessToken', data.accessToken);
  }

  if (data?.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  if (data?.sessionId) {
    localStorage.setItem('sessionId', data.sessionId);
  }

  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
};

// Login
export const login = async (email, password) => {
  const sessionId = localStorage.getItem('sessionId');

  const res = await fetch(`${API_AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId || '',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  saveAuthData(data);
  return data;
};

// Verify OTP
export const verifyLoginOtp = async (userId, otp) => {
  const sessionId = localStorage.getItem('sessionId');

  const res = await fetch(`${API_AUTH_URL}/login/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId || '',
    },
    body: JSON.stringify({ userId, otp }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }

  saveAuthData(data);
  return data;
};

// Refresh token
export const refreshToken = async () => {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${API_AUTH_URL}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Refresh failed');
  }

  saveAuthData(data);
  return data;
};

// Logout
export const logout = async () => {
  const accessToken = sessionStorage.getItem('accessToken');
  const refreshTokenValue = localStorage.getItem('refreshToken');

  if (refreshTokenValue) {
    await fetch(`${API_AUTH_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    }).catch(() => {});
  }

  sessionStorage.clear();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.setItem('logout', Date.now().toString());
};

// Get current user
export const getMe = async () => {
  const res = await apiFetch(`${API_USER_URL}/me`, {
    method: 'GET',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to get user profile');
  }

  return data.user;
};

// Forgot password
export const forgotPassword = async (email) => {
  const res = await fetch(`${API_AUTH_URL}/forgot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Gửi yêu cầu thất bại.');
  }

  return data;
};

// Register
export const registerAccount = async (userData) => {
  const res = await fetch(`${API_AUTH_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });

  const contentType = res.headers.get("content-type") || "";
  let data = null;

  if (res.status !== 204 && contentType.includes("application/json")) {
    data = await res.json();
  } else if (res.status !== 204) {
    const text = await res.text();
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || "Đăng ký thất bại");
  }

  return data || { success: true };
};

// Reset password
export const resetPassword = async (resetData) => {
  const res = await fetch(`${API_AUTH_URL}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resetData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Đặt lại mật khẩu thất bại.');
  }

  if (data.accessToken) {
    saveAuthData(data);
  }

  return data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const res = await apiFetch(`${API_AUTH_URL}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Cập nhật thất bại');
  }

  return data;
};

// Update avatar
export const updateAvatar = async (formData) => {
  const res = await apiFetch(`${API_AUTH_URL}/avatar`, {
    method: 'PUT',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Lỗi tải ảnh');
  }

  return data;
};

// Delete / Disable account
export const manageAccount = async (password, type) => {
  const endpoint = type === 'delete' ? 'delete' : 'disable';

  const res = await apiFetch(`${API_AUTH_URL}/account/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Xác nhận mật khẩu không chính xác');
  }

  return data;
};

// Update phone
export const updatePhone = async (phoneData) => {
  const res = await apiFetch(`${API_AUTH_URL}/phone`, {
    method: 'PUT',
    body: JSON.stringify(phoneData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Không thể cập nhật số điện thoại');
  }

  return data;
};

// Change password
export const changePassword = async (passwordData) => {
  const res = await apiFetch(`${API_AUTH_URL}/password`, {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Không thể cập nhật mật khẩu');
  }

  return data;
};

// Restore account
export const restoreAccount = async (email, password) => {
  const res = await fetch(`${API_AUTH_URL}/account/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Không thể khôi phục tài khoản.');
  }

  // 🔥 QUAN TRỌNG NHẤT
  saveAuthData(data);

  return data;
};