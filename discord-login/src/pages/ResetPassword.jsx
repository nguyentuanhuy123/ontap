
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import { useToast } from '../context/ToastContext'; 



const ResetPassword = () => {
  const { showToast } = useToast(); // 🔥 Khởi tạo showToast


  const navigate = useNavigate();
  // Giả định link đặt lại mật khẩu là /reset-password/:token
  const [searchParams] = useSearchParams();
  
  // Lấy uid và token từ URL (?uid=xxx&token=yyy)
  const userId = searchParams.get('uid');
  const token = searchParams.get('token'); 
  
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    setNewPassword(e.target.value);
    // Xóa lỗi của trường khi người dùng gõ lại
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: '' }));
    }
    setServerError('');
  };

  // Validate mật khẩu mạnh ở Frontend (tái sử dụng từ Backend)
  const validateForm = () => {
    let newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "- Bắt buộc";
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) {
      newErrors.newPassword = "- Ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
  };

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');
    const sessionId = localStorage.getItem("sessionId");

    try {
      // 🔥 Gọi hàm từ service, truyền vào object chứa dữ liệu
      await resetPassword({
        userId: userId, 
        token: token,   
        newPassword: newPassword,
        sessionId: sessionId 
      });

      setIsSuccess(true);
      showToast("Đặt lại mật khẩu thành công!", "success");
      
      // Chuyển hướng người dùng
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      setServerError(err.message || "Lỗi kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  // Tái sử dụng LabelWithError kiểu Discord (label đỏ + thông báo nghiêng)
  const LabelWithError = ({ title, fieldName, isRequired = false }) => (
    <label className="block text-[12px] font-bold uppercase mb-2" style={{ color: errors[fieldName] ? '#F23F42' : '#B5BAC1' }}>
      {title} {isRequired && <span className="text-red-500">*</span>}
      {errors[fieldName] && <span className="italic text-[#F23F42] ml-1">{errors[fieldName]}</span>}
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Nền không gian đã được định nghĩa trong body của index.css */}
      
      {/* Box Container */}
      <div className="bg-discord-bg text-white rounded-lg shadow-2xl w-full max-w-[480px] p-8 relative z-10 flex flex-col items-center">
        
        {/* Biểu tượng minh họa */}
        <div className="mb-6">
          {/* Tôi sử dụng hình ảnh SVG chính thức hoặc ảnh mẫu mô tả chi tiết biểu tượng tủ khóa và bàn tay */}
          <img 
            src="https://cdn.discordapp.com/assets/images/reset_password_illustration.svg" 
            alt="Đổi mật khẩu" 
            className="w-40 h-auto"
            // Hoặc có thể dùng SVG nội tuyến nếu có
          />
        </div>
        
        {/* Tiêu đề */}
        <h2 className="text-[24px] font-bold text-center mb-6">Đổi Mật Khẩu Của Bạn</h2>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-2 rounded mb-4 text-sm text-center">
            {serverError}
          </div>
        )}

        {isSuccess && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-2 rounded mb-4 text-sm text-center">
            Mật khẩu đã được đổi thành công! Đang chuyển hướng về trang đăng nhập...
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          
          {/* Mật khẩu mới */}
          <div>
            <LabelWithError title="Mật khẩu mới" fieldName="newPassword" isRequired={true} />
            <input
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={handleChange}
              className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
            />
          </div>

          {/* Nút Đổi mật khẩu */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full bg-discord-blue hover:bg-discord-blue-hover text-white font-semibold py-3 px-4 rounded transition-colors duration-200 mt-4 disabled:opacity-50"
          >
             {isLoading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
          </button>
          
          {/* Link quay lại */}
          <Link to="/" className="block text-discord-link text-[14px] hover:underline mt-4 text-center">
            Quay lại đăng nhập
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;