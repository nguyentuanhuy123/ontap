const API_URL = "http://localhost:3000/api/auth";
const API_USER_URL = "http://localhost:3000/api/user";

// Login
export const login = async (email, password) => {
  const sessionId = localStorage.getItem("sessionId");

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-session-id": sessionId || ""   // 🔥 thêm dòng này
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");

  // 🔥 CHỈ LƯU KHI CÓ TOKEN (Trường hợp thiết bị tin cậy)
  if (data.accessToken) {
    sessionStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("sessionId", data.sessionId);
    // Bạn có thể lưu cả user vào localStorage nếu cần
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data; // Trả về data để Component check requireOtp
};

export const verifyLoginOtp = async (userId, otp) => {

  const sessionId = localStorage.getItem("sessionId");

  const res = await fetch(`${API_URL}/login/verify-otp`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-session-id": sessionId || "" // 🔥 PHẢI GỬI LÊN Ở ĐÂY NỮA
    },
    body: JSON.stringify({ userId, otp })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "OTP verification failed");

  // 🔥 Bước này chắc chắn có token khi thành công
  sessionStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("sessionId", data.sessionId);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};

// Refresh token
export const refreshToken = async () => {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Refresh failed");

  sessionStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("sessionId", data.sessionId); // ✅ đúng

  return data;
};

// Logout
export const logout = async () => {
  const accessToken = sessionStorage.getItem("accessToken");
  const refreshTokenValue = localStorage.getItem("refreshToken");

  if (accessToken && refreshTokenValue) {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue })
    });
  }

  sessionStorage.clear();
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  localStorage.setItem("logout", Date.now());
};



// Get current user
export const getMe = async () => {
  let token = sessionStorage.getItem("accessToken");

  // 1. Nếu không có token, thử refresh ngay lập tức
  if (!token) {
    const hasRefresh = localStorage.getItem("refreshToken");
    if (!hasRefresh) throw new Error("No refresh token found");
    const data = await refreshToken(); // Hàm này đã lưu token vào sessionStorage rồi
    token = data.accessToken;
  }

  // 2. Gọi fetchProfile
  const res = await fetch(`${API_USER_URL}/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  // 3. Nếu token hết hạn bất thình lình (401), thì mới refresh lại lần cuối
  if (res.status === 401) {
    const refreshData = await refreshToken();
    // Gọi lại fetch lần nữa với token mới
    return await getMe(); 
  }

  if (!res.ok) throw new Error(data.message || "Failed");
  return data.user;
};
