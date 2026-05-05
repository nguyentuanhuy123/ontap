import React, { useState } from 'react';
import { useToast } from '../context/ToastContext'; // 1. Import hook

const DisableAccountModal = ({ isOpen, onClose, onConfirm, type = 'disable' }) => {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const isDelete = type === 'delete';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      showToast("Vui lòng nhập mật khẩu để xác nhận!", "error");
      return;
    }
    onConfirm(password, type);
  };

  const content = {
    disable: {
      title: "Vô hiệu hóa tài khoản",
      warning: "Bạn có chắc muốn vô hiệu hóa tài khoản không? Hành động này sẽ đăng xuất bạn ngay lập tức và ẩn tài khoản của bạn.",
      buttonText: "Vô hiệu hóa tài khoản",
      buttonColor: "bg-[#5865F2] hover:bg-[#4752C4]"
    },
    delete: {
      title: "Xóa tài khoản",
      warning: "Hành động này là vĩnh viễn! Bạn sẽ mất toàn bộ tin nhắn và dữ liệu. Bạn có chắc chắn muốn tiếp tục?",
      buttonText: "Xóa tài khoản",
      buttonColor: "bg-[#D83C3E] hover:bg-[#A12D2F]"
    }
  };

  const activeContent = content[type] || content.disable;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all">
      {/* Modal Container: w-full cho mobile, max-w cho desktop */}
      <div className="bg-[#313338] rounded-xl md:rounded-md w-full max-w-[440px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-5 md:p-4">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{activeContent.title}</h2>
          
          {/* Cảnh báo: Chỉnh text nhỏ lại một chút trên mobile để đỡ chiếm diện tích */}
          <div className={`${isDelete ? 'bg-[#D83C3E]' : 'bg-[#F0B232]'} text-white p-4 rounded-md text-sm md:text-[15px] leading-relaxed mb-6 shadow-md`}>
            {activeContent.warning}
          </div>

          <form id="confirm-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 mb-2">
              <label className="text-[11px] font-bold text-[#B5BAC1] uppercase tracking-wider">Mật khẩu của bạn</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // text-base (16px) cực kỳ quan trọng trên mobile để tránh auto-zoom iOS
                className="bg-[#1E1F22] text-[#DBDEE1] p-3 md:p-2.5 rounded w-full outline-none focus:ring-2 focus:ring-[#00A8FC] text-base transition-all"
                placeholder="Nhập mật khẩu..."
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Footer: flex-col-reverse trên mobile để nút chính ở trên, nút hủy ở dưới */}
        <div className="bg-[#2B2D31] p-4 flex flex-col-reverse sm:flex-row justify-end items-center gap-3 sm:gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full sm:w-auto text-white hover:underline text-sm font-medium py-2 px-4 transition"
          >
            Hủy
          </button>
          <button 
            form="confirm-form"
            type="submit" 
            className={`${activeContent.buttonColor} w-full sm:w-auto text-white px-6 py-3 sm:py-2 rounded font-medium text-sm transition-all active:scale-95`}
          >
            {activeContent.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisableAccountModal;