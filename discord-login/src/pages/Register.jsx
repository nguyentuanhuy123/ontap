import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  
  // State quản lý dữ liệu form
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    username: '',
    password: '',
    day: '',
    month: '',
    year: '',
    marketing: false
  });

  // State quản lý lỗi hiển thị dưới mỗi input
  const [errors, setErrors] = useState({});
  // State quản lý trạng thái loading
  const [isLoading, setIsLoading] = useState(false);
  // Lỗi chung của server (nếu có)
  const [serverError, setServerError] = useState('');

  // Dữ liệu cho các Select
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Xóa lỗi của trường đó khi người dùng bắt đầu gõ lại
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  // Validate sơ bộ ở Frontend trước khi gọi API
  const validateForm = () => {
    let newErrors = {};

    if (!formData.email) newErrors.email = "- Bắt buộc";
    
    if (!formData.username) {
      newErrors.username = "- Bắt buộc";
    } else if (!/^[a-zA-Z0-9._]{3,20}$/.test(formData.username)) {
      newErrors.username = "- 3-20 ký tự (chữ, số, . _)";
    }

    if (!formData.password) {
      newErrors.password = "- Bắt buộc";
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(formData.password)) {
      newErrors.password = "- Ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt";
    }

    if (!formData.day || !formData.month || !formData.year) {
      newErrors.birthday = "- Vui lòng chọn đầy đủ ngày sinh";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
  };

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra validate form
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    // Ghép ngày tháng năm thành chuỗi YYYY-MM-DD (hoặc format tuỳ backend của bạn)
    // Đảm bảo tháng và ngày có 2 chữ số (vd: 01, 09)
    const formattedMonth = formData.month.toString().padStart(2, '0');
    const formattedDay = formData.day.toString().padStart(2, '0');
    const birthdayString = `${formData.year}-${formattedMonth}-${formattedDay}`;

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName, // Có thể rỗng nếu backend cho phép
          username: formData.username,
          password: formData.password,
          birthday: birthdayString
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Ánh xạ lỗi từ Backend về hiển thị cho đúng input
        // Backend của bạn trả về data.message (dựa theo hàm sendError của bạn)
        const errMsg = data.message || "Đăng ký thất bại";
        
        if (errMsg.toLowerCase().includes("email")) {
          setErrors({ email: `- ${errMsg}` });
        } else if (errMsg.toLowerCase().includes("username")) {
          setErrors({ username: `- ${errMsg}` });
        } else if (errMsg.toLowerCase().includes("password")) {
          setErrors({ password: `- ${errMsg}` });
        } else {
           setServerError(errMsg);
        }
        throw new Error(errMsg);
      }

      // Đăng ký thành công -> Chuyển về trang đăng nhập
      alert("Tạo tài khoản thành công! Vui lòng đăng nhập.");
      navigate('/login'); // Quay về trang Login

    } catch (err) {
      console.error("Lỗi đăng ký:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm render Label để dùng lại, có kèm hiển thị lỗi kiểu Discord
  const LabelWithError = ({ title, fieldName, isRequired = false }) => (
    <label className="block text-[12px] font-bold uppercase mb-2" style={{ color: errors[fieldName] ? '#F23F42' : '#B5BAC1' }}>
      {title} {isRequired && <span className="text-red-500">*</span>}
      {errors[fieldName] && <span className="italic text-[#F23F42] ml-1">{errors[fieldName]}</span>}
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-discord-bg text-white rounded-lg shadow-2xl w-full max-w-[480px] p-8 relative z-10">
        <h2 className="text-[24px] font-bold text-center mb-6">Tạo tài khoản</h2>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-2 rounded mb-4 text-sm text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <LabelWithError title="Email" fieldName="email" isRequired={true} />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
            />
          </div>

          {/* Tên hiển thị */}
          <div>
             <LabelWithError title="Tên hiển thị" fieldName="displayName" isRequired={false} />
            <input
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
            />
          </div>

          {/* Tên đăng nhập */}
          <div>
            <LabelWithError title="Tên đăng nhập" fieldName="username" isRequired={true} />
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
            />
          </div>

          {/* Mật khẩu */}
          <div>
             <LabelWithError title="Mật khẩu" fieldName="password" isRequired={true} />
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-discord-input text-white rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-discord-blue border border-transparent transition-all"
            />
          </div>

          {/* Ngày sinh */}
          <div>
             <LabelWithError title="Ngày sinh" fieldName="birthday" isRequired={true} />
            <div className="grid grid-cols-3 gap-3">
              <select name="day" value={formData.day} onChange={handleChange} className="bg-discord-input text-[#B5BAC1] rounded p-2.5 focus:outline-none cursor-pointer">
                <option value="" disabled>Ngày</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select name="month" value={formData.month} onChange={handleChange} className="bg-discord-input text-[#B5BAC1] rounded p-2.5 focus:outline-none cursor-pointer">
                <option value="" disabled>Tháng</option>
                {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select name="year" value={formData.year} onChange={handleChange} className="bg-discord-input text-[#B5BAC1] rounded p-2.5 focus:outline-none cursor-pointer">
                <option value="" disabled>Năm</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Checkbox Marketing */}
          <div className="flex items-start space-x-3 pt-2">
            <input
              name="marketing"
              type="checkbox"
              checked={formData.marketing}
              onChange={handleChange}
              className="mt-1 w-5 h-5 rounded bg-discord-input border-gray-600 checked:bg-discord-blue cursor-pointer"
            />
            <span className="text-[12px] text-discord-text-muted leading-tight">
              (Không bắt buộc) Chấp nhận email thông báo về cập nhật, các mẹo cũng như ưu đãi đặc biệt. Bạn có thể bỏ tùy chọn này bất cứ lúc nào.
            </span>
          </div>

          {/* Điều khoản */}
          <p className="text-[12px] text-discord-text-muted">
            Khi nhấn vào "Tiếp tục", bạn đồng ý với <a href="#" className="text-discord-link hover:underline">Điều khoản Dịch vụ</a> và đã đọc kỹ <a href="#" className="text-discord-link hover:underline">Chính sách Bảo mật</a>.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-discord-blue hover:bg-discord-blue-hover text-white font-semibold py-2.5 rounded transition-colors mt-4 disabled:opacity-50"
          >
             {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
          </button>

          <Link to="/" className="block text-discord-link text-[14px] hover:underline mt-2">
            Đã có tài khoản?
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Register;