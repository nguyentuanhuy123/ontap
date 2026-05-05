import React, { useState } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react'; // Thêm Loader2 để làm hiệu ứng loading
import axios from 'axios'; // Giả sử bạn dùng axios, nếu dùng fetch thì thay đổi tương ứng
import { updatePhone } from '../services/auth';


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

    try {
      const fullPhone = `${country.code}${phoneNumber}`;
      
      // Gọi service đã tạo ở Bước 1
      const result = await updatePhone({ 
        phone: fullPhone, 
        password: password 
      });

      // Nếu thành công (apiFetch đã lo phần check res.ok)
      if (result?.user) {
        onSuccess(result.user.phone); 
        handleClose();
      }
    } catch (err) {
      // Lấy message từ Error object mà service đã throw
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhoneNumber("");
    setPassword("");
    setError("");
    onClose();
  };

  const handleBack = () => {
    setStep('phone');
    setPassword("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4">
      {/* Modal Container: Linh hoạt chiều rộng, bo góc lớn hơn trên mobile */}
      <div className="bg-[#313338] w-full max-w-[440px] rounded-xl sm:rounded-lg shadow-2xl relative overflow-hidden transition-all">
        
        {/* Nút đóng to hơn, dễ chạm trên mobile */}
        <button onClick={onClose} className="absolute top-4 right-4 text-[#B5BAC1] hover:text-[#DBDEE1] p-1 transition z-10">
          <X size={24} />
        </button>

        {step === 'phone' && (
          <div className="p-6 md:p-8">
            <div className="text-center mt-2 mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Nhập Số Điện Thoại</h2>
              <p className="text-[#B5BAC1] text-sm px-2">
                Bạn sẽ nhận được tin nhắn có chứa mã xác minh.
              </p>
            </div>

            {/* Layout mã vùng và số điện thoại */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="w-full sm:w-[120px]">
                <label className="text-[11px] font-bold text-[#B5BAC1] uppercase mb-2 block tracking-wider">Mã Quốc Gia</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#1E1F22] text-[#DBDEE1] py-3 px-3 rounded border-none outline-none appearance-none cursor-pointer text-base"
                    onChange={(e) => setCountry({ ...country, code: e.target.value })}
                    value={country.code}
                  >
                    <option value="+84">VN +84</option>
                    <option value="+1">US +1</option>
                    <option value="+81">JP +81</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-3.5 text-[#B5BAC1] pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex-1">
                <label className="text-[11px] font-bold text-[#B5BAC1] uppercase mb-2 block tracking-wider">Số Điện Thoại</label>
                <div className="relative">
                  <div className="absolute left-3 top-[13px] text-[#DBDEE1] font-medium text-base">{country.code}</div>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#1E1F22] text-white py-3 pl-14 pr-3 rounded outline-none focus:ring-2 focus:ring-[#5865F2] text-base transition-all"
                    placeholder="123 456 789"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleGoToPassword}
              disabled={phoneNumber.length < 9}
              className={`w-full py-3.5 rounded font-medium text-white transition-all active:scale-[0.98] ${phoneNumber.length >= 9 ? 'bg-[#5865F2] hover:bg-[#4752C4]' : 'bg-[#4E5058] opacity-50 cursor-not-allowed'}`}
            >
              Tiếp theo
            </button>
          </div>
        )}

        {step === 'password' && (
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6">Xác nhận mật khẩu</h2>
            
            <div className="mb-4">
              <label className="text-[11px] font-bold text-[#B5BAC1] uppercase mb-2 block tracking-wider">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={`w-full bg-[#1E1F22] text-white py-3 px-3 rounded outline-none text-base focus:ring-1 ${error ? 'focus:ring-red-500 border border-red-500' : 'focus:ring-[#5865F2]'}`}
                placeholder="Nhập mật khẩu của bạn"
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-2 font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>

            {/* Nút bấm trên mobile ưu tiên diện tích lớn */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
              <button 
                onClick={handleBack} 
                className="w-full sm:w-auto px-4 py-2.5 text-white text-sm font-medium hover:underline transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirm}
                disabled={!password || loading}
                className={`w-full sm:w-auto px-8 py-3 rounded font-medium text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${password && !loading ? 'bg-[#248046] hover:bg-[#1A6334]' : 'bg-[#4E5058] opacity-50 cursor-not-allowed'}`}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
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