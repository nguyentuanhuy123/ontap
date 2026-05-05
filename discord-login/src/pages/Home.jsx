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
    <div className="min-h-screen bg-discord-bg flex flex-col items-center justify-center text-white p-4 sm:p-6 relative">
      {/* Nội dung chính */}
      <div className="bg-[#2B2D31] p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl text-center w-full max-w-md mx-auto transition-all">
        
        {/* Icon thu nhỏ lại một chút trên mobile */}
        <div className="w-20 h-20 md:w-24 md:h-24 bg-discord-blue rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center text-3xl md:text-4xl font-bold transition-all">
          !
        </div>
        
        {/* Tiêu đề tự động giảm size trên mobile */}
        <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 transition-all">Chào mừng bạn!</h1>
        
        <p className="text-discord-text-muted mb-6 md:mb-8 text-sm md:text-base transition-all">
          Bạn đã đăng nhập thành công vào hệ thống.
        </p>
        
        {/* Nút bấm trải dài trên mobile (w-full), thu gọn trên màn hình lớn (sm:w-auto). Tăng py để dễ chạm */}
        <button 
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 sm:py-2 rounded-lg font-medium transition-all active:scale-95"
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