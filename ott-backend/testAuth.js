const axios = require("axios");

const BASE_URL = "http://localhost:3000/api/auth";

const user = {
  email: `test${Date.now()}@mail.com`,
  password: "Password@123",
  displayName: "Test User",
  username: "testuser" + Math.floor(Math.random() * 1000),
  birthday: "2000-01-01"
};

let accessToken1, refreshToken1;
let accessToken2, refreshToken2;

/**
 * HELPER
 */
const log = (title, data) => {
  console.log("\n====================");
  console.log(title);
  console.log("====================");
  console.log(data?.data || data);
};

/**
 * REGISTER
 */
const register = async () => {
  const res = await axios.post(`${BASE_URL}/register`, user);
  log("REGISTER", res.data);
};

/**
 * LOGIN DEVICE 1
 */
const login1 = async () => {
  const res = await axios.post(`${BASE_URL}/login`, {
    email: user.email,
    password: user.password
  });

  accessToken1 = res.data.accessToken;
  refreshToken1 = res.data.refreshToken;

  log("LOGIN DEVICE 1", res.data);
};

/**
 * LOGIN DEVICE 2
 */
const login2 = async () => {
  const res = await axios.post(`${BASE_URL}/login`, {
    email: user.email,
    password: user.password
  });

  accessToken2 = res.data.accessToken;
  refreshToken2 = res.data.refreshToken;

  log("LOGIN DEVICE 2", res.data);
};

/**
 * REFRESH TOKEN (DEVICE 1)
 */
const refresh1 = async () => {
  const res = await axios.post(`${BASE_URL}/refresh`, {
    refreshToken: refreshToken1
  });

  accessToken1 = res.data.accessToken;
  refreshToken1 = res.data.refreshToken;

  log("REFRESH DEVICE 1", res.data);
};

/**
 * PING (AUTH TEST)
 */
const ping = async (accessToken, label) => {
  const res = await axios.post(
    `${BASE_URL}/ping`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  log(`PING ${label}`, res.status);
};

/**
 * LOGOUT DEVICE 1
 */
const logout1 = async () => {
  const res = await axios.post(
    `${BASE_URL}/logout`,
    { refreshToken: refreshToken1 },
    {
      headers: {
        Authorization: `Bearer ${accessToken1}`
      }
    }
  );

  log("LOGOUT DEVICE 1", res.data);
};

/**
 * TRY REFRESH AFTER LOGOUT (SHOULD FAIL)
 */
const refreshAfterLogout = async () => {
  try {
    await axios.post(`${BASE_URL}/refresh`, {
      refreshToken: refreshToken1
    });
  } catch (err) {
    log("REFRESH AFTER LOGOUT (EXPECTED FAIL)", err.response.data);
  }
};

/**
 * RESET PASSWORD (LOGOUT ALL)
 */
const resetPassword = async () => {
  console.log("\n⚠️  Skipping real email flow... simulate reset");

  // ⚠️ Bạn cần thay token thật nếu test email thật
  // ở đây chỉ demo concept
};

/**
 * MAIN TEST FLOW
 */
const run = async () => {
  try {
    await register();

    await login1();
    await login2();

    await ping(accessToken1, "DEVICE 1");
    await ping(accessToken2, "DEVICE 2");

    await refresh1();

    await logout1();

    await refreshAfterLogout();

    console.log("\n✅ TEST COMPLETED");

  } catch (err) {
    console.error("❌ ERROR:", err.response?.data || err.message);
  }
};

run();