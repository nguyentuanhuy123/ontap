import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import { connectSocket, disconnectSocket, getSocket } from "./socket/socket";
import { refreshToken } from "./services/auth";
import { ToastProvider } from './context/ToastContext'; // Import Provider của bạn

function App() {
  const [isAuth, setIsAuth] = useState(false);

  // Dùng useCallback để hàm không bị tạo lại lãng phí
  const startAutoRefresh = useCallback(() => {
    return setInterval(async () => {
      try {
        const data = await refreshToken();
        const s = getSocket();
        if (s) {
          const sessionId = localStorage.getItem("sessionId");
          s.disconnect();
          s.auth = { token: data.accessToken, sessionId };
          s.connect();
        }
      } catch (err) {
        console.log("Refresh failed:", err.message);
        disconnectSocket();
        setIsAuth(false);
        window.location.href = "/";
      }
    }, 14 * 60 * 1000);
  }, []);

  useEffect(() => {
    let interval;

    const initAuth = async () => {
      let token = sessionStorage.getItem("accessToken");
  
      if (!token) {
        const refresh = localStorage.getItem("refreshToken");
        if (refresh) {
          try {
            const data = await refreshToken();
            token = data.accessToken;
          } catch (err) {
            // Nếu refresh fail (do token hết hạn hoặc account bị khóa/vô hiệu hóa)
            localStorage.clear();
            sessionStorage.clear();
            setIsAuth(false);
            return; // Thoát luôn
          }
        }
      }

      if (token) {
        setIsAuth(true); 
        const s = getSocket();
        if (!s || !s.connected) {
          connectSocket(token);
        }
        
        if (!interval) {
          interval = startAutoRefresh();
        }
      }
    };

    initAuth();

    const handleStorage = (e) => {
      if (e.key === "logout") {
        disconnectSocket();
        setIsAuth(false);
        window.location.href = "/";
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isAuth, startAutoRefresh]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuth ? <Navigate to="/" /> : <Login setIsAuth={setIsAuth} />} />
          <Route path="/" element={isAuth ? <Home setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
          <Route path="/register" element={isAuth ? <Navigate to="/" /> : <Register />} />
          <Route path="/reset" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    
  );
}

export default App;

