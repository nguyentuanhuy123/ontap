import React, { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import PhoneVerificationModal from './PhoneVerificationModal';
import SaveNotice from './SaveNotice';
import ChangePasswordModal from './ChangePasswordModal';
import { logout } from '../services/auth';
import { disconnectSocket } from '../socket/socket';
import DisableAccountModal from './DisableAccountModal';

const SettingsModal = ({ isOpen, onClose, user, setUser,setIsAuth }) => {
  // --- States ---
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
const [password, setPassword] = useState("");

const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

const [accountAction, setAccountAction] = useState(null);

  
  // Dữ liệu tạm thời để chỉnh sửa (FormData)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    birthday: user?.birthday || ""
  });

  // Cập nhật lại formData mỗi khi Modal mở hoặc user prop thay đổi
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        displayName: user.displayName || "",
        // Đảm bảo định dạng yyyy-MM-dd để input type="date" hiểu được
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ""
      });
    }
  }, [isOpen, user]);

  const fileInputRef = useRef(null);

  // --- Logic Kiểm tra Thay đổi ---
  const currentBirthday = user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "";
  const hasChanges = 
    formData.displayName !== (user?.displayName || "") || 
    formData.birthday !== currentBirthday;

  // --- API Handlers ---

  const handleReset = () => {
    setFormData({
      displayName: user?.displayName || "",
      birthday: currentBirthday
    });
  };

  // Cập nhật Profile (DisplayName & Birthday)
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Lấy token từ sessionStorage theo đúng file auth.js của bạn
      const token = sessionStorage.getItem("accessToken"); 
      
      const response = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          birthday: formData.birthday
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Log ra để bạn kiểm tra chính xác cấu trúc BE trả về trong Console
        console.log("BE Check:", result); 

        // Kiểm tra các cấp độ dữ liệu để tránh lỗi undefined
        const userData = result?.data?.user || result?.user;

        if (userData) {
          setUser(userData);
          alert("Cập nhật thông tin thành công!");
        } else {
          console.error("Không tìm thấy dữ liệu user trong response", result);
          alert("Cập nhật thành công nhưng không thể đồng bộ dữ liệu.");
        }
      } else {
        alert(result.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi API Profile:", error);
      alert("Không thể kết nối đến máy chủ");
    } finally {
      setIsSaving(false);
    }
  };

  // Cập nhật Avatar
  // Cập nhật Avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const bodyFormData = new FormData();
    bodyFormData.append("avatar", file);

    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await fetch('http://localhost:3000/api/auth/avatar', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
          // Lưu ý: Không để Content-Type ở đây khi dùng FormData
        },
        body: bodyFormData
      });

      const result = await response.json();
      
      if (response.ok) {
        // SỬA LỖI TẠI ĐÂY: Dùng optional chaining (?.) để tránh văng lỗi TypeError
        const updatedUser = result?.user || result?.data?.user;
        
        if (updatedUser) {
          setUser(updatedUser);
          alert("Đã thay đổi ảnh đại diện!");
        } else {
          alert("Tải ảnh thành công nhưng dữ liệu trả về không đúng.");
        }
      } else {
        alert(result.message || "Lỗi khi tải ảnh lên");
      }
    } catch (error) {
      // Bây giờ lỗi này sẽ hiện thông báo ra màn hình thay vì im lặng
      console.error("Lỗi upload avatar:", error);
      alert("Lỗi hệ thống: " + error.message);
    }
  };

  // --- Helper Functions ---
  const getMaskedPhone = (phone) => {
    if (!phone) return "";
    return `********${phone.slice(-4)}`;
  };

  const getMaskedEmail = (email) => {
    if (!email) return "*****************@gmail.com";
    const [name, domain] = email.split("@");
    return `${name.charAt(0)}********@${domain}`;
  };

  // Hàm xử lý chung cho cả Xóa và Vô hiệu hóa
  const handleAccountAction = async (password, type) => {
    const endpoint = type === 'delete' 
      ? 'http://localhost:3000/api/auth/account/delete' 
      : 'http://localhost:3000/api/auth/account/disable';

    try {
      const token = sessionStorage.getItem("accessToken"); 
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (response.ok) {
        alert(type === 'delete' ? "Tài khoản của bạn đã được xóa." : "Tài khoản đã được vô hiệu hóa.");
        setAccountAction(null);
        handleLogout(); 
      } else {
        alert(result.message || "Mật khẩu không chính xác.");
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ.");
    }
  };

  if (!isOpen) return null;

  const handleLogout = async () => {
    // 1. Ngắt kết nối socket ngay lập tức
    disconnectSocket();

    // 2. Chạy hàm logout để dọn dẹp Storage và báo cho Server
    await logout();

    // 3. Đóng Modal và quay về trang chủ (React Router sẽ tự đá về login do isAuth = false)
    onClose(); 
    // Lưu ý: Bạn cần nhận setIsAuth từ props giống như ở Home để set nó về false
    if (typeof setIsAuth === 'function') {
      setIsAuth(false);
    } else {
      // Nếu không truyền setIsAuth, dùng cách này để reload lại toàn bộ app
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#313338] flex text-[#DBDEE1]">
      
      {/* Sidebar */}
      <div className="w-[30%] bg-[#2B2D31] flex justify-end py-14 pr-4 border-r border-[#3F4147]/30">
        <div className="w-48 flex flex-col gap-1">
          <div className="text-xs font-bold text-[#87898C] uppercase px-2 mb-1">Cài đặt người dùng</div>
          <button className="bg-[#404249] text-white px-2 py-1.5 rounded text-left font-medium">Tài Khoản</button>
          <button className="hover:bg-[#35373C] text-[#B5BAC1] px-2 py-1.5 rounded text-left transition font-medium">Hồ Sơ</button>
          <button className="hover:bg-[#35373C] text-[#B5BAC1] px-2 py-1.5 rounded text-left transition font-medium">Bảo Mật</button>
          <div className="h-[1px] bg-[#3F4147] my-2 mx-2"></div>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-500 hover:bg-[#F23F42]/10 px-2 py-1.5 rounded text-left transition font-medium"
          >
            Đăng xuất
          </button>  
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#313338] py-14 pl-10 pr-20 relative overflow-y-auto pb-44">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Tài Khoản Của Tôi</h2>

          <div className="bg-[#1E1F22] rounded-xl overflow-hidden relative pb-4 shadow-lg">
            {/* Banner */}
            <div className="h-24 bg-[#E03A3E]"></div>

            <div className="flex justify-between items-start px-4 pt-12 relative">
              {/* Avatar Section */}
              <div 
                className="absolute -top-12 left-4 w-24 h-24 rounded-full border-8 border-[#1E1F22] bg-[#5865F2] flex items-center justify-center font-bold text-3xl overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current.click()}
              >
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  user?.displayName?.charAt(0).toUpperCase()
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col items-center justify-center text-[10px] text-white uppercase font-bold text-center p-1">
                  <Camera size={18} className="mb-1" />
                  <span>Đổi ảnh</span>
                </div>
              </div>
              
              <div className="text-xl font-bold text-white mt-2 ml-28">
                {user?.displayName}
                <div className="text-sm font-normal text-[#B5BAC1]">@{user?.username || "user"}</div>
              </div>
            </div>

            <div className="bg-[#2B2D31] m-4 mt-6 rounded-lg p-4 flex flex-col gap-5">
              
              {/* Field: Display Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase">Tên hiển thị</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded w-full outline-none focus:ring-1 focus:ring-[#00A8FC]"
                  placeholder="Nhập tên hiển thị..."
                />
              </div>

              {/* Field: Birthday */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase">Ngày sinh</label>
                <input 
                  type="date" 
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded w-full outline-none focus:ring-1 focus:ring-[#00A8FC] [color-scheme:dark]"
                />
              </div>

              <div className="h-[1px] bg-[#3F4147] my-1"></div>

              {/* Email & Phone */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-[#B5BAC1] uppercase mb-1">Email</div>
                  <div className="text-white text-base">
                    {showEmail ? (user?.email || "Chưa cập nhật") : getMaskedEmail(user?.email)}
                    <button onClick={() => setShowEmail(!showEmail)} className="text-[13px] text-[#00A8FC] hover:underline ml-2">
                      {showEmail ? "Ẩn" : "Hiển thị"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-[#B5BAC1] uppercase mb-1">Số điện thoại</div>
                  <div className="text-white text-base">
                    {user?.phone ? (
                      <>
                        {showPhone ? user.phone : getMaskedPhone(user.phone)}
                        <button onClick={() => setShowPhone(!showPhone)} className="text-[13px] text-[#00A8FC] hover:underline ml-2">
                          {showPhone ? "Ẩn" : "Hiển thị"}
                        </button>
                      </>
                    ) : <span className="text-[#B5BAC1]">Bạn chưa thêm số điện thoại nào cả.</span>}
                  </div>
                </div>
                <button onClick={() => setIsPhoneModalOpen(true)} className="bg-[#4E5058] hover:bg-[#6D6F78] text-white px-4 py-1.5 rounded text-sm font-medium transition">
                  {user?.phone ? "Chỉnh sửa" : "Thêm"}
                </button>
              </div>

            </div>
          </div>

           {/* PHẦN MỚI: MẬT KHẨU VÀ XÁC THỰC */}         
            <div className="mt-10 border-t border-[#3F4147] pt-8">
                <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wide">Mật Khẩu</h3>
                <button 
                onClick={() => setIsPasswordModalOpen(true)} // Mở Modal khi click
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-sm font-medium transition"
                >
                Đổi Mật Khẩu
                </button>
            </div>
            <div className="mt-10 border-t border-[#3F4147] pt-8">
              <h3 className="text-xs font-bold text-[#87898C] mb-4 uppercase tracking-wide">Yêu cầu xóa tài khoản</h3>
              <p className="text-[#B5BAC1] text-sm mb-4">
                Vô hiệu hóa tài khoản của bạn có nghĩa là bạn có thể khôi phục nó bất kỳ lúc nào sau khi thực hiện hành động này.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setAccountAction('disable')}
                  className="bg-[#D83C3E] hover:bg-[#A12D2F] text-white px-4 py-2 rounded text-sm font-medium transition"
                >
                  Vô hiệu hóa tài khoản
                </button>
                {/* Nút Xóa tài khoản (Thường là viền đỏ, chữ đỏ) */}
                <button
                  onClick={() => setAccountAction('delete')} 
                  className="border border-[#D83C3E] text-[#D83C3E] hover:bg-[#D83C3E]/10 px-4 py-2 rounded text-sm font-medium transition">
                  Xóa Tài Khoản

                </button>
              </div>
            </div>

        </div>

        {/* Close Button ESC */}
        <div className="absolute top-14 right-10 flex flex-col items-center gap-1 cursor-pointer group" onClick={onClose}>
          <div className="w-9 h-9 rounded-full border-2 border-[#87898C] group-hover:border-[#DBDEE1] flex items-center justify-center text-[#87898C] group-hover:text-[#DBDEE1] transition">
            <X size={20} />
          </div>
          <span className="text-xs font-bold text-[#87898C] group-hover:text-[#DBDEE1]">ESC</span>
        </div>
      </div>

      {/* Save Notice Bar (Hiện lên khi có thay đổi) */}
      {hasChanges && (
        <SaveNotice 
          onSave={handleSaveAll} 
          onReset={handleReset} 
          isLoading={isSaving} 
        />
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAvatarChange} 
        className="hidden" 
        accept="image/*" 
      />
      
      {/* Phone Modal */}
      <PhoneVerificationModal 
        isOpen={isPhoneModalOpen} 
        onClose={() => setIsPhoneModalOpen(false)} 
        onSuccess={(newPhone) => setUser(prev => ({...prev, phone: newPhone}))}
      />
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      <DisableAccountModal
        isOpen={Boolean(accountAction)}
        type={accountAction}
        onClose={() => setAccountAction(null)}
        onConfirm={handleAccountAction}
      />

    </div>
  );
};

export default SettingsModal;