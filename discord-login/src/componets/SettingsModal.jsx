import React, { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import PhoneVerificationModal from './PhoneVerificationModal';
import SaveNotice from './SaveNotice';
import ChangePasswordModal from './ChangePasswordModal';
import { disconnectSocket } from '../socket/socket';
import DisableAccountModal from './DisableAccountModal';
import { updateProfile, updateAvatar, manageAccount, logout } from '../services/auth';
import { useToast } from '../context/ToastContext'; 

const SettingsModal = ({ isOpen, onClose, user, setUser,setIsAuth }) => {
  const { showToast } = useToast(); // 🔥 Khởi tạo showToast
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
      const result = await updateProfile({
        displayName: formData.displayName,
        birthday: formData.birthday
      });
      
      const userData = result?.user || result?.data?.user;
      if (userData) {
        setUser(userData);
        showToast("Cập nhật thông tin thành công!", "success");
      }
    } catch (error) {
      showToast(error.message || "Không thể cập nhật thông tin", "error");
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
      showToast("Đang tải ảnh lên...", "loading", 2000);
      const result = await updateAvatar(bodyFormData);
      const updatedUser = result?.user || result?.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        showToast("Đã thay đổi ảnh đại diện!", "success");
      }
    } catch (error) {
      showToast(error.message || "Lỗi khi tải ảnh lên", "error");
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
    try {
      showToast("Đang xử lý yêu cầu...", "loading", 3000);
      await manageAccount(password, type);
      const successMsg = type === 'delete' ? "Tài khoản đã được xóa vĩnh viễn." : "Đã vô hiệu hóa tài khoản thành công.";
      showToast(successMsg, "success"); 
      handleLogout();
    } catch (error) {
      showToast(error.message || "Mật khẩu không đúng hoặc đã xảy ra lỗi", "error"); 
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
    <div className="fixed inset-0 z-[100] bg-[#313338] flex flex-col md:flex-row text-[#DBDEE1] overflow-hidden">
      
      {/* Sidebar - Responsive: Ngang trên Mobile, Dọc trên PC */}
      <div className="w-full md:w-[30%] bg-[#2B2D31] flex flex-row md:flex-col md:justify-end py-4 md:py-14 px-4 md:pr-4 border-b md:border-b-0 md:border-r border-[#3F4147]/30 overflow-x-auto md:overflow-y-auto no-scrollbar">
        <div className="flex flex-row md:flex-col gap-1 w-full md:w-48">
          <div className="hidden md:block text-xs font-bold text-[#87898C] uppercase px-2 mb-1">Cài đặt người dùng</div>
          <button className="bg-[#404249] text-white px-3 py-1.5 rounded text-sm md:text-left font-medium whitespace-nowrap">Tài Khoản</button>
          <button className="hover:bg-[#35373C] text-[#B5BAC1] px-3 py-1.5 rounded text-sm md:text-left transition font-medium whitespace-nowrap">Hồ Sơ</button>
          <button className="hover:bg-[#35373C] text-[#B5BAC1] px-3 py-1.5 rounded text-sm md:text-left transition font-medium whitespace-nowrap">Bảo Mật</button>
          <div className="hidden md:block h-[1px] bg-[#3F4147] my-2 mx-2"></div>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-500 hover:bg-[#F23F42]/10 px-3 py-1.5 rounded text-sm md:text-left transition font-medium whitespace-nowrap"
          >
            Đăng xuất
          </button>  
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#313338] py-6 md:py-14 px-4 md:pl-10 md:pr-20 relative overflow-y-auto pb-44">
        <div className="max-w-2xl mx-auto md:mx-0">
          <h2 className="text-xl font-bold text-white mb-6">Tài Khoản Của Tôi</h2>

          <div className="bg-[#1E1F22] rounded-xl overflow-hidden relative pb-4 shadow-lg">
            {/* Banner */}
            <div className="h-20 md:h-24 bg-[#E03A3E]"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start px-4 pt-12 relative">
              {/* Avatar Section */}
              <div 
                className="absolute -top-10 md:-top-12 left-4 w-20 h-20 md:w-24 md:h-24 rounded-full border-8 border-[#1E1F22] bg-[#5865F2] flex items-center justify-center font-bold text-2xl md:text-3xl overflow-hidden cursor-pointer group"
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
              
              <div className="text-xl font-bold text-white mt-2 sm:ml-28">
                {user?.displayName}
                <div className="text-sm font-normal text-[#B5BAC1]">@{user?.username || "user"}</div>
              </div>
            </div>

            <div className="bg-[#2B2D31] m-3 md:m-4 mt-6 rounded-lg p-3 md:p-4 flex flex-col gap-5">
              {/* Field: Display Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase">Tên hiển thị</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded w-full outline-none focus:ring-1 focus:ring-[#00A8FC]"
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="text-xs font-bold text-[#B5BAC1] uppercase mb-1">Email</div>
                  <div className="text-white text-sm md:text-base break-all">
                    {showEmail ? (user?.email || "Chưa cập nhật") : getMaskedEmail(user?.email)}
                    <button onClick={() => setShowEmail(!showEmail)} className="text-[13px] text-[#00A8FC] hover:underline ml-2">
                      {showEmail ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="text-xs font-bold text-[#B5BAC1] uppercase mb-1">Số điện thoại</div>
                  <div className="text-white text-sm md:text-base">
                    {user?.phone ? (
                      <>
                        {showPhone ? user.phone : getMaskedPhone(user.phone)}
                        <button onClick={() => setShowPhone(!showPhone)} className="text-[13px] text-[#00A8FC] hover:underline ml-2">
                          {showPhone ? "Ẩn" : "Hiện"}
                        </button>
                      </>
                    ) : <span className="text-[#B5BAC1]">Chưa có số điện thoại.</span>}
                  </div>
                </div>
                <button onClick={() => setIsPhoneModalOpen(true)} className="w-full sm:w-auto bg-[#4E5058] hover:bg-[#6D6F78] text-white px-4 py-1.5 rounded text-sm font-medium transition">
                  {user?.phone ? "Chỉnh sửa" : "Thêm"}
                </button>
              </div>
            </div>
          </div>

          {/* MẬT KHẨU */}
          <div className="mt-10 border-t border-[#3F4147] pt-8">
            <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wide">Mật Khẩu</h3>
            <button 
              onClick={() => setIsPasswordModalOpen(true)} 
              className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded text-sm font-medium transition"
            >
              Đổi Mật Khẩu
            </button>
          </div>

          {/* XÓA TÀI KHOẢN */}
          <div className="mt-10 border-t border-[#3F4147] pt-8">
            <h3 className="text-xs font-bold text-[#87898C] mb-4 uppercase tracking-wide">Quản trị tài khoản</h3>
            <p className="text-[#B5BAC1] text-sm mb-4">
              Vô hiệu hóa tài khoản giúp bạn có thể khôi phục lại sau này.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setAccountAction('disable')}
                className="flex-1 bg-[#D83C3E] hover:bg-[#A12D2F] text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                Vô hiệu hóa
              </button>
              <button
                onClick={() => setAccountAction('delete')} 
                className="flex-1 border border-[#D83C3E] text-[#D83C3E] hover:bg-[#D83C3E]/10 px-4 py-2 rounded text-sm font-medium transition"
              >
                Xóa Tài Khoản
              </button>
            </div>
          </div>
        </div>

        {/* Nút Close ESC - Di chuyển vị trí để không bị che trên mobile */}
        <div className="fixed top-4 right-4 md:absolute md:top-14 md:right-10 flex flex-col items-center gap-1 cursor-pointer group z-50" onClick={onClose}>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-[#87898C] group-hover:border-[#DBDEE1] flex items-center justify-center text-[#87898C] group-hover:text-[#DBDEE1] bg-[#313338] transition">
            <X size={18} />
          </div>
          <span className="hidden md:block text-xs font-bold text-[#87898C] group-hover:text-[#DBDEE1]">ESC</span>
        </div>
      </div>

      {/* Các Modals khác giữ nguyên */}
      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
      {hasChanges && <SaveNotice onSave={handleSaveAll} onReset={handleReset} isLoading={isSaving} />}
      <PhoneVerificationModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} onSuccess={(newPhone) => setUser(prev => ({...prev, phone: newPhone}))} />
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <DisableAccountModal isOpen={Boolean(accountAction)} type={accountAction} onClose={() => setAccountAction(null)} onConfirm={handleAccountAction} />
    </div>
  );
};

export default SettingsModal;