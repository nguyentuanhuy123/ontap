import React from 'react';
import { logout } from '../services/auth';
import { disconnectSocket } from '../socket/socket';
import UserBar from '../componets/UserBar';
const Home = ({ setIsAuth }) => {
  
  const handleLogout = async () => {
    // 1. Ngắt kết nối socket ngay lập tức để tránh lỗi nhận tin nhắn khi đang thoát
    disconnectSocket();

    // 2. Chạy hàm logout để dọn dẹp Storage và báo cho Server
    await logout();

    setIsAuth(false);
  };

  return (
    <div className="min-h-screen bg-discord-bg flex flex-col items-center justify-center text-white p-4 relative">
      {/* Nội dung chính */}
      <div className="bg-[#2B2D31] p-10 rounded-2xl shadow-xl text-center max-w-md">
        <div className="w-24 h-24 bg-discord-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold">
          !
        </div>
        <h1 className="text-3xl font-bold mb-4">Chào mừng bạn!</h1>
        <p className="text-discord-text-muted mb-8">
          Bạn đã đăng nhập thành công vào hệ thống.
        </p>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-medium transition-all"
        >
          Đăng xuất
        </button>
      </div>

      {/* Chèn Component UserBar vào đây */}
      <UserBar setIsAuth={setIsAuth}/>
    </div>
  );
};

export default Home;