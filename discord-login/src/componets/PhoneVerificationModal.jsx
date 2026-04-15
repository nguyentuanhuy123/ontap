import React, { useState } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react'; // Thêm Loader2 để làm hiệu ứng loading
import axios from 'axios'; // Giả sử bạn dùng axios, nếu dùng fetch thì thay đổi tương ứng


const PhoneVerificationModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState({ code: "+84", name: "Việt Nam" });
  
  // State quản lý UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
    setError(""); // Xóa lỗi khi người dùng nhập mới
  };

  const handleGoToPassword = () => {
    if (phoneNumber.length >= 9) {
      setStep('password');
      setError("");
    }
  };

  // HÀM QUAN TRỌNG: Gọi API Backend
  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    const fullPhone = `${country.code}${phoneNumber}`;

    try {
      // QUAN TRỌNG: Đổi localStorage thành sessionStorage cho đúng với logic login của bạn
      const token = sessionStorage.getItem('accessToken'); 
      
      // Kiểm tra nếu không có token thì báo lỗi ngay tại FE
      if (!token) {
        setError("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      const response = await axios.put('http://localhost:3000/api/auth/phone', 
        { 
          phone: fullPhone, 
          password: password 
        }, 
        {
          headers: { 
            // Đảm bảo Token được gửi đi chính xác
            Authorization: `Bearer ${token}` 
          }
        }
      );

      // Backend của bạn trả về sendSuccess(res, { user: safeUser }, ...) 
      // nên ta kiểm tra response.data.user
      if (response.data && response.data.user) {
        onSuccess(response.data.user.phone); 
        onClose(); 
        setStep('phone');
        setPhoneNumber("");
        setPassword("");
      }
    } catch (err) {
      console.error("Update phone error:", err);
      // Lấy message lỗi từ Backend trả về (sendError)
      const message = err.response?.data?.message || "Đã có lỗi xảy ra.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setPassword("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
      <div className="bg-[#313338] w-[440px] rounded-lg shadow-xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#B5BAC1] hover:text-[#DBDEE1] transition z-10">
          <X size={24} />
        </button>

        {step === 'phone' && (
          <div className="p-4">
            <div className="text-center mt-4 mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Nhập Số Điện Thoại</h2>
              <p className="text-[#B5BAC1] text-sm px-4">Bạn sẽ nhận được tin nhắn có chứa mã xác minh.</p>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="w-[140px]">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase mb-2 block">Mã Quốc Gia</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border-none outline-none appearance-none cursor-pointer"
                    onChange={(e) => setCountry({ ...country, code: e.target.value })}
                    value={country.code}
                  >
                    <option value="+84">VN +84</option>
                    <option value="+1">US +1</option>
                    <option value="+81">JP +81</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-3 text-[#B5BAC1] pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-[#B5BAC1] uppercase mb-2 block">Số Điện Thoại</label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-[#DBDEE1] font-medium">{country.code}</div>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#1E1F22] text-white p-2.5 pl-12 rounded outline-none focus:ring-2 focus:ring-[#5865F2]"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleGoToPassword}
              disabled={phoneNumber.length < 9}
              className={`w-full py-3 rounded font-medium text-white transition ${phoneNumber.length >= 9 ? 'bg-[#5865F2] hover:bg-[#4752C4]' : 'bg-[#4E5058] opacity-50 cursor-not-allowed'}`}
            >
              Tiếp theo
            </button>
          </div>
        )}

        {step === 'password' && (
          <div className="p-4 pt-6">
            <h2 className="text-xl font-bold text-white mb-6">Nhập mật khẩu để xác nhận</h2>
            
            <div className="mb-2">
              <label className="text-xs font-bold text-[#B5BAC1] uppercase mb-2 block">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={`w-full bg-[#1E1F22] text-white p-2.5 rounded outline-none focus:ring-1 ${error ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-[#5865F2]'}`}
                autoFocus
              />
              {/* Hiển thị thông báo lỗi từ BE */}
              {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={handleBack} className="text-white text-sm hover:underline">Hủy bỏ</button>
              <button 
                onClick={handleConfirm}
                disabled={!password || loading}
                className={`px-8 py-2.5 rounded font-medium text-white flex items-center gap-2 ${password && !loading ? 'bg-[#248046] hover:bg-[#1A6334]' : 'bg-[#4E5058] opacity-50 cursor-not-allowed'}`}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationModal;