import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { changePassword } from '../services/auth'; // 🔥 Import service
import { useToast } from '../context/ToastContext'; // 🔥 Import hook

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast(); // 🔥 Khởi tạo showToast

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "- Bắt buộc";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "- Bắt buộc";
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(formData.newPassword)) {
      newErrors.newPassword = "- Ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt";
    }

    if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "- Mật khẩu xác nhận không khớp";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "- Bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Vui lòng kiểm tra lại thông tin!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = sessionStorage.getItem("sessionId") || localStorage.getItem("sessionId");

      // 🔥 Sử dụng service tập trung
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        sessionId: sessionId
      });

      showToast("Cập nhật mật khẩu thành công!", "success");
      onClose();
    } catch (err) {
      const msg = err.message.toLowerCase();
      // Xử lý mapping lỗi từ server vào các field tương ứng
      if (msg.includes("current password")) {
        setErrors({ currentPassword: "- Mật khẩu hiện tại không đúng" });
      } else if (msg.includes("weak")) {
        setErrors({ newPassword: "- Mật khẩu quá yếu" });
      } else {
        showToast(err.message || "Đã xảy ra lỗi, vui lòng thử lại", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const LabelWithError = ({ title, fieldName, isRequired = false }) => (
    <label 
      className="block text-[12px] font-bold uppercase mb-2" 
      style={{ color: errors[fieldName] ? '#F23F42' : '#B5BAC1' }}
    >
      {title} {isRequired && <span className="text-red-500">*</span>}
      {errors[fieldName] && <span className="italic text-[#F23F42] ml-1">{errors[fieldName]}</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-[2px] px-4 py-6">
      {/* Modal Container: Linh hoạt chiều cao để không bị bàn phím mobile che mất */}
      <div className="bg-[#313338] w-full max-w-[440px] rounded-xl md:rounded-lg shadow-2xl relative flex flex-col max-h-full overflow-hidden transition-all">
        
        {/* Close Button - To hơn trên mobile để dễ bấm */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-[#B5BAC1] hover:text-white p-2 transition z-10"
        >
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">Cập nhật mật khẩu</h2>
            <p className="text-[#B5BAC1] text-center text-sm md:text-[15px] mb-8 leading-relaxed">
              Nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản.
            </p>
            
            <div className="space-y-5">
              <div>
                <LabelWithError title="Mật khẩu hiện tại" fieldName="currentPassword" isRequired={true} />
                <input 
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] p-3 rounded border border-transparent outline-none focus:ring-2 focus:ring-[#5865F2] transition-all text-base"
                  style={{ borderColor: errors.currentPassword ? '#F23F42' : 'transparent' }}
                />
              </div>

              <div>
                <LabelWithError title="Mật khẩu mới" fieldName="newPassword" isRequired={true} />
                <input 
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] p-3 rounded border border-transparent outline-none focus:ring-2 focus:ring-[#5865F2] transition-all text-base"
                  style={{ borderColor: errors.newPassword ? '#F23F42' : 'transparent' }}
                />
              </div>

              <div>
                <LabelWithError title="Xác nhận mật khẩu mới" fieldName="confirmPassword" isRequired={true} />
                <input 
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] p-3 rounded border border-transparent outline-none focus:ring-2 focus:ring-[#5865F2] transition-all text-base"
                  style={{ borderColor: errors.confirmPassword ? '#F23F42' : 'transparent' }}
                />
              </div>
            </div>
          </div>

          {/* Footer - Sắp xếp dọc trên mobile siêu hẹp, ngang trên phần lớn thiết bị */}
          <div className="bg-[#2B2D31] p-4 flex flex-col-reverse sm:flex-row justify-end items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto text-white text-sm font-medium hover:underline px-4 py-2.5 transition"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full sm:min-w-[96px] bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-2.5 rounded font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Đang xử lý...' : 'Xong'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;