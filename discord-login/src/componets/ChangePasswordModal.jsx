import React, { useState } from 'react';
import { X } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose }) => {
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
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      
      const token = sessionStorage.getItem("accessToken");
      const sessionId = sessionStorage.getItem("sessionId") || localStorage.getItem("sessionId");

      // 2. Gửi đầy đủ 3 trường mà Backend yêu cầu
      const response = await fetch('http://localhost:3000/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          sessionId: sessionId // 🔥 Đã thêm dòng này để hết lỗi Missing fields
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert("Cập nhật mật khẩu thành công!");
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onClose();
      } else {
        const msg = result.message || "";
        if (msg.toLowerCase().includes("current password")) {
          setErrors({ currentPassword: "- Mật khẩu hiện tại không đúng" });
        } else if (msg.toLowerCase().includes("weak")) {
          setErrors({ newPassword: "- Mật khẩu quá yếu" });
        } else {
          alert(msg || "Có lỗi xảy ra khi đổi mật khẩu");
        }
      }
    } catch (err) {
      console.error("Lỗi API Password:", err);
      alert("Không thể kết nối đến máy chủ");
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#313338] w-full max-w-[440px] rounded-lg shadow-2xl relative overflow-hidden">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B5BAC1] hover:text-white transition"
        >
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Cập nhật mật khẩu</h2>
            <p className="text-[#B5BAC1] text-center text-[15px] mb-6">
              Nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản.
            </p>
            
            <div className="flex flex-col gap-5">
              <div>
                <LabelWithError title="Mật khẩu hiện tại" fieldName="currentPassword" isRequired={true} />
                <input 
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border border-transparent outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
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
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border border-transparent outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
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
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border border-transparent outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                  style={{ borderColor: errors.confirmPassword ? '#F23F42' : 'transparent' }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#2B2D31] p-4 mt-2 flex justify-end items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="text-white text-sm font-medium hover:underline px-4 py-2"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-2.5 rounded text-sm font-medium transition-colors min-w-[96px] disabled:opacity-50"
            >
              {isLoading ? 'Đang xử lý...' : 'Xong'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;