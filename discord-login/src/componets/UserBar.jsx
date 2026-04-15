import React, { useState, useEffect } from 'react';
import { Mic, Headset, Settings } from 'lucide-react';
import { getSocket } from '../socket/socket';
import { getMe } from '../services/auth';
import SettingsModal from './SettingsModal'; // Bổ sung dòng này

const UserBar = ({ setIsAuth }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : { displayName: "Đang tải...", avatar: "" };
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State quản lý Modal
  
  const socket = getSocket();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("Không thể lấy thông tin user:", err);
      }
    };

    fetchUserData();

    if (socket) {
      setIsOnline(socket.connected);
      const handleConnect = () => setIsOnline(true);
      const handleDisconnect = () => setIsOnline(false);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, [socket]);

  return (
    <>
      <div className="fixed bottom-0 left-0 w-60 bg-[#232428] p-1.5 flex items-center justify-between group z-40">
        <div className="flex items-center gap-2 hover:bg-[#35373c] p-1 rounded-md cursor-pointer transition-colors flex-1 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-discord-blue flex items-center justify-center font-bold text-xs overflow-hidden text-white">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user.displayName?.charAt(0).toUpperCase()
              )}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#232428] ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>

          <div className="flex flex-col truncate text-white">
            <span className="text-[14px] font-bold leading-tight truncate">
              {user.displayName}
            </span>
            <span className="text-[12px] text-[#B5BAC1] leading-tight">
              {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button title="Tắt tiếng" className="p-2 hover:bg-[#35373c] rounded-md text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors">
            <Mic size={16} />
          </button>
          <button title="Điếc" className="p-2 hover:bg-[#35373c] rounded-md text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors">
            <Headset size={16} />
          </button>
          {/* Nút Mở Cài Đặt */}
          <button 
            title="Cài đặt người dùng" 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-[#35373c] rounded-md text-[#B5BAC1] hover:text-[#DBDEE1] transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Hiển thị Modal Cài Đặt */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user}
        setUser={setUser}
        setIsAuth={setIsAuth}
      />
    </>
  );
};

export default UserBar;