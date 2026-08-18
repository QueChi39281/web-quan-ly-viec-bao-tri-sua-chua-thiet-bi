import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Wrench, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from "../../services/api";
import './login.css';

export const getRouteByRole = (role) => {
  const normalizedRole = role?.toUpperCase();
  switch (normalizedRole) {
    case 'ADMIN':
      return '/admin/users';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'TECH':
    case 'TECHNICIAN':
    case 'MAINTENANCE_STAFF':
      return '/technician-dashboard';
    case 'USER':
    default:
      return '/device-report';
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập trước khi yêu cầu cấp lại mật khẩu!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authApi.forgotPassword({ username: formData.username });
      if (res?.success) {
        setSuccessMessage(res?.message || 'Nếu tài khoản tồn tại, liên kết khôi phục đã được gửi.');
      } else {
        setErrorMessage(res?.message || res?.error?.message || 'Không thể gửi yêu cầu quên mật khẩu.');
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.login({
        username: formData.username.trim(),
        password: formData.password,
      });

      console.log('[LOGIN RESULT]', res);

      if (res?.success) {
        const payload = res?.data || res;
        const authData = payload?.data || payload;
        const userData = authData?.user || payload?.user;
        const token = authData?.accessToken || payload?.accessToken;
        const refreshToken = authData?.refreshToken || payload?.refreshToken;

        if (!userData || !userData.role) {
          throw new Error("Dữ liệu trả về không hợp lệ (thiếu user/role)");
        }

        if (!token) {
          throw new Error('Đăng nhập trả về token rỗng. Vui lòng kiểm tra gateway response.');
        }

        // Lưu thông tin vào LocalStorage theo contract gateway thực tế
        const employeeId = userData.employee_id || userData.id;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken || '');
        localStorage.setItem('employeeId', employeeId);
        localStorage.setItem('userId', employeeId);
        localStorage.setItem('userAccountId', userData.id || employeeId);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userInfo', JSON.stringify(userData));

        // Phát sự kiện toàn cục để HeaderInfo cập nhật ngay lập tức
        window.dispatchEvent(new Event('userLoginSuccess'));

        // Chuyển hướng theo Role
        const targetRoute = getRouteByRole(userData.role);
        navigate(targetRoute, { replace: true });
      } else {
        setErrorMessage(res?.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      const apiErrorMsg = err?.response?.data?.message || err?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      setErrorMessage(apiErrorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Header / Logo */}
        <div className="login-header">
          <div className="login-icon">
            <Wrench />
          </div>
          <h2 className="login-title">
            Hệ Thống Bảo Trì
          </h2>
          <p className="login-subtitle">
            Đăng nhập để quản lý và xử lý sự cố thiết bị
          </p>
        </div>

        {/* Thông báo Lỗi */}
        {errorMessage && (
          <div className="alert-box error">
            <AlertCircle className="alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông báo Thành công */}
        {successMessage && (
          <div className="alert-box success">
            <CheckCircle2 className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Đăng nhập */}
        <form onSubmit={handleSubmit}>
          {/* Field: Username */}
          <div className="form-group">
            <label>TÊN ĐĂNG NHẬP</label>
            <div className="input-wrapper">
              <User className="left-icon" />
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập (VD: admin)"
              />
            </div>
          </div>

          {/* Field: Mật khẩu */}
          <div className="form-group">
            <div className="form-label-row">
              <label>MẬT KHẨU</label>
              <a
                href="#forgot"
                onClick={handleForgotPassword}
                className="forgot-link"
              >
                Quên?
              </a>
            </div>
            <div className="input-wrapper">
              <Lock className="left-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-submit-original"
          >
            {loading ? (
              <>
                <Loader2 className="spinner" />
                Đang xử lý...
              </>
            ) : (
              'Đăng Nhập'
            )}
          </button>
        </form>

        {/* Chú thích */}
        <div className="login-footer">
          <p>
            Hệ thống không hỗ trợ tự đăng ký. <br />
            Liên hệ <strong>Admin</strong> để lấy tài khoản.
          </p>
        </div>

      </div>
    </div>
  );
}