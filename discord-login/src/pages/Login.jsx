import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, login,restoreAccount,verifyLoginOtp } from '../services/auth';
import { connectSocket } from '../socket/socket';
import { useToast } from '../context/ToastContext'; 


const Login = ({ setIsAuth }) => {
  const { showToast } = useToast(); // 🔥 Khởi tạo showToast

  const navigate = useNavigate();

  // State quản lý luồng UI
  const [step, setStep] = useState(1);
  const [blockedReason, setBlockedReason] = useState('');
  
  // State lưu trữ dữ liệu
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState(''); // Lưu token tạm thời để gửi kèm khi verify OTP (nếu cần)
  const [userId, setUserId] = useState('');
  
  // State UI
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hàm xử lý đăng nhập (Bước 1)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(emailOrPhone, password);

      // KIỂM TRA PHẢN HỒI TỪ BACKEND
      if (data.requireOtp) {
        // Nếu thiết bị lạ -> Chuyển sang bước OTP
        setUserId(data.userId);
        setStep(2);
      } else {
        // Nếu thiết bị tin cậy -> Login luôn
        setIsAuth(true);
        connectSocket(data.accessToken);
        navigate("/");
      }
    } catch (err) {
      if (err.message === "Account disabled" || err.status === 403) {
        setStep(3);
      }else if (err.message === "Account scheduled for deletion") {
        setBlockedReason('pending_delete');
        setStep(3);
      }else {
        setError(err.message || "Tài khoản hoặc mật khẩu không chính xác.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Bước 2: Xác nhận OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await verifyLoginOtp(userId, otp);
      
      // Thành công
      setIsAuth(true);
      connectSocket(data.accessToken);
      navigate("/");
    } catch (err) {
      // Backend của bạn có trả về lỗi "Too many attempts" (429) hoặc "OTP expired"
      setError(err.message || "Mã OTP không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý quên mật khẩu
  const handleForgotPassword = async () => {
    if (!emailOrPhone) {
      setError("Vui lòng nhập email hoặc số điện thoại để đặt lại mật khẩu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 🔥 Gọi hàm từ service thay vì fetch trực tiếp
      await forgotPassword(emailOrPhone);
      showToast("Nếu tài khoản tồn tại, một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.", "success");
    } catch (err) {
      setError(err.message || "Không thể gửi yêu cầu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };
  const handleRestoreAccount = async () => {
    setLoading(true);
    setError("");
    try {
      // Sử dụng email/phone và password đã lưu trong state từ Bước 1
      const data = await restoreAccount(emailOrPhone, password);
      
      sessionStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("sessionId", data.sessionId);
      // Sau khi khôi phục thành công, Backend trả về token và session
      setIsAuth(true);
      connectSocket(data.accessToken);
      
      showToast("Tài khoản của bạn đã được khôi phục thành công!", "success");
      navigate("/");
    } catch (err) {
      setError(err.message || "Khôi phục tài khoản thất bại.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setStep(1);
    setError('');
    setPassword('');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Box Container - Đã loại bỏ responsive width lớn, giữ max-w-[480px] cho cả 2 bước */}
      <div className="bg-discord-bg text-white rounded-lg shadow-2xl flex flex-col w-full max-w-[480px] p-8 transition-all duration-300 relative z-10">
        
        {/* ======================= BƯỚC 1: FORM ĐĂNG NHẬP ======================= */}
        {step === 1 && (
          <div className="w-full flex flex-col justify-center animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-[24px] font-bold mb-2">Chào mừng trở lại!</h2>
              <p className="text-discord-text-muted text-[15px]">Rất vui mừng khi được gặp lại bạn!</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col space-y-4">
              {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}
              
              {/* Input Email/Phone */}
              <div>
                <label className="block text-[12px] font-bold text-discord-text-muted uppercase mb-2">
                  Email hoặc Số Điện Thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
                />
              </div>

              {/* Input Password */}
              <div>
                <label className="block text-[12px] font-bold text-discord-text-muted uppercase mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
                />
                <div className="text-[13px] text-discord-text-muted mt-2">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-discord-link hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-discord-blue hover:bg-discord-blue-hover text-white font-semibold py-3 px-4 rounded transition-colors duration-200 mt-2"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              {/* Register Link */}
              <div className="text-[13px] text-discord-text-muted mt-2">
                Cần một tài khoản? <Link to="/register" className="text-discord-link hover:underline">Đăng ký</Link>
              </div>
            </form>
          </div>
        )}

        {/* ======================= BƯỚC 2: FORM XÁC THỰC OTP ======================= */}
        {step === 2 && (
          <div className="w-full flex flex-col justify-center animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-[24px] font-bold mb-2">Xác thực 2 bước</h2>
              <p className="text-discord-text-muted text-[15px]">
                Vui lòng nhập mã bảo mật gồm 6 chữ số được gửi đến thiết bị của bạn.
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="flex flex-col space-y-4">
              {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}
              
              <div>
                <label className="block text-[12px] font-bold text-discord-text-muted uppercase mb-2">
                  Mã OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Chỉ cho phép nhập số
                  placeholder="000000"
                  required
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-discord-input text-white rounded p-3 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full bg-discord-blue hover:bg-discord-blue-hover text-white font-semibold py-3 px-4 rounded transition-colors duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác nhận mã'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                className="text-[13px] text-discord-link hover:underline mt-2 bg-transparent border-none p-0 cursor-pointer text-center w-full"
              >
                Quay lại đăng nhập
              </button>
            </form>
          </div>
        )}

        {/* ======================= BƯỚC 3: ACCOUNT DISABLED (Giao diện yêu cầu) ======================= */}
        {step === 3 && (
          <div className="w-full flex flex-col items-center animate-fade-in text-center py-4">
            {/* Hiển thị tiêu đề động theo ảnh */}
            <h2 className="text-[32px] font-bold mb-4 text-white">
              {blockedReason === 'disabled' ? 'Account Disabled' : 'Account Scheduled for Deletion'}
            </h2>
            
            {/* Hiển thị nội dung động theo ảnh */}
            <p className="text-[#DBDEE1] text-[16px] mb-10 leading-relaxed">
              {blockedReason === 'disabled' 
                ? "You cannot use it while it's disabled." 
                : "Your account is scheduled to self-destruct soon."}
            </p>

            <button
              onClick={resetToLogin}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3.5 px-4 rounded-sm transition-colors duration-200 text-[16px]"
            >
              Return to Login
            </button>

            <div className="mt-6 text-[#949BA4] text-[14px]">
              Change your mind?{' '}
              <button 
                onClick={handleRestoreAccount}
                disabled={isLoading}
                className="text-[#00A8FC] hover:underline font-medium bg-transparent border-none"
              >
                {isLoading ? 'Restoring...' : 'Restore Account'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;