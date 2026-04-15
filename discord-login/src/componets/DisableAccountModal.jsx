import React, { useState } from 'react';

const DisableAccountModal = ({ isOpen, onClose, onConfirm, type = 'disable' }) => {
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const isDelete = type === 'delete';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      alert("Vui lòng nhập mật khẩu!");
      return;
    }
    // Trả ra password và type để BE biết là xóa hay vô hiệu hóa
    onConfirm(password, type);
  };

  // Cấu hình nội dung dựa trên type
  const content = {
    disable: {
      title: "Vô hiệu hóa tài khoản",
      warning: "Bạn có chắc chắn muốn vô hiệu hóa tài khoản của mình không? Hành động này sẽ ngay lập tức đăng xuất bạn và làm cho tài khoản của bạn không ai có thể truy cập được.",
      buttonText: "Vô hiệu hóa tài khoản",
      buttonColor: "bg-[#5865F2] hover:bg-[#4752C4]"
    },
    delete: {
      title: "Xóa tài khoản",
      warning: "Hành động này là vĩnh viễn và không thể hoàn tác. Bạn sẽ mất toàn bộ tin nhắn, server và dữ liệu cá nhân. Bạn có chắc chắn muốn tiếp tục?",
      buttonText: "Xóa tài khoản",
      buttonColor: "bg-[#D83C3E] hover:bg-[#A12D2F]"
    }
  };

  const activeContent = content[type] || content.disable;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#313338] rounded-md w-full max-w-[440px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-4">{activeContent.title}</h2>
          
          {/* Cảnh báo thay đổi màu dựa trên loại hành động */}
          <div className={`${isDelete ? 'bg-[#D83C3E]' : 'bg-[#F0B232]'} text-white p-3 rounded-md text-[15px] leading-relaxed mb-5 shadow-sm`}>
            {activeContent.warning}
          </div>

          <form id="confirm-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 mb-2">
              <label className="text-xs font-bold text-[#B5BAC1] uppercase">Mật khẩu</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded w-full outline-none focus:ring-1 focus:ring-[#00A8FC]"
                autoFocus
              />
            </div>
          </form>
        </div>

        <div className="bg-[#2B2D31] p-4 flex justify-end items-center gap-4">
          <button type="button" onClick={onClose} className="text-white hover:underline text-sm font-medium px-2">
            Hủy
          </button>
          <button 
            form="confirm-form"
            type="submit" 
            className={`${activeContent.buttonColor} text-white px-6 py-2 rounded text-sm font-medium transition`}
          >
            {activeContent.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisableAccountModal;