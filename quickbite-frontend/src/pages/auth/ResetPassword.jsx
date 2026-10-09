import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout";
import { resetPasswordApi } from "../../api/authApi"; // Apni API function ka path check kar liyega

const ResetPassword = () => {
  const { token } = useParams(); // URL se reset token lene ke liye (e.g. /reset-password/:token)
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signOutOtherDevices, setSignOutOtherDevices] = useState(true);
  const [loading, setLoading] = useState(false);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const hasSpecialOrNum = /(?=.*[0-9@$!%*?&])/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!hasMinLength || !hasUpperLower || !hasSpecialOrNum) {
      toast.error("Please meet all password security requirements.");
      return;
    }

    setLoading(true);
    try {
      // Yahan 'password' ko 'newPassword' kar dein taake backend ke sath match ho jaye
      await resetPasswordApi({
        token,
        newPassword: password, // <--- Yeh change karna hai
        signOutOtherDevices,
      });

      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg">
        <div className="qb-card p-6 sm:p-8 text-center">
          {/* Top Icon Badge */}
          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Lock size={24} className="text-brand-500" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
              <ShieldCheck size={11} className="text-emerald-500" />
            </span>
          </div>

          <span className="mb-1 inline-block text-[11px] font-bold uppercase tracking-wide text-brand-600">
            Secure Credential Reset
          </span>
          <h1 className="mb-1 text-2xl font-extrabold text-ink">
            Set New Password
          </h1>
          <p className="mb-4 text-xs sm:text-sm text-slate-500">
            Please choose a strong, unique password to secure your QuickBite
            culinary profile.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* New Password Field */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-ink">
                  New Password <span className="text-brand-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Enter password
                </span>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="qb-input text-sm py-2 pl-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist Box */}
            <div className="rounded-lg bg-slate-50 p-3.5 space-y-2 text-xs text-slate-600 border border-slate-100">
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 flex-shrink-0"
                  />
                ) : (
                  <Circle size={14} className="text-slate-300 flex-shrink-0" />
                )}
                <span
                  className={
                    hasMinLength
                      ? "text-emerald-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  At least 8 characters length
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasUpperLower ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 flex-shrink-0"
                  />
                ) : (
                  <Circle size={14} className="text-slate-300 flex-shrink-0" />
                )}
                <span
                  className={
                    hasUpperLower
                      ? "text-emerald-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  Both uppercase & lowercase letters
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasSpecialOrNum ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 flex-shrink-0"
                  />
                ) : (
                  <Circle size={14} className="text-slate-300 flex-shrink-0" />
                )}
                <span
                  className={
                    hasSpecialOrNum
                      ? "text-emerald-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  At least 1 number or special symbol (@, $, #, etc.)
                </span>
              </div>
            </div>

            {/* Confirm New Password Field */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-ink">
                  Confirm New Password <span className="text-brand-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="qb-input text-sm py-2 pl-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Sign out other devices checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="signOutDevices"
                checked={signOutOtherDevices}
                onChange={(e) => setSignOutOtherDevices(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
              />
              <label
                htmlFor="signOutDevices"
                className="text-xs text-slate-600 cursor-pointer"
              >
                <span className="font-semibold text-ink block">
                  Sign out from other devices
                </span>
                Recommended. Terminate active sessions on all browsers & phones.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="qb-btn-primary py-2.5 text-sm w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Updating..." : "Reset Password & Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Security footer badge */}
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-500">
            <ShieldCheck size={12} className="text-emerald-500" /> Protected by
            QuickBite Account Guard · 256-bit TLS Encryption
          </span>

          {/* Back to sign in link */}
          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-ink hover:text-brand-500"
          >
            <ArrowLeft size={14} /> Return to Sign In
          </Link>
        </div>

        {/* Footer info links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <a href="#" className="hover:text-ink">
            Customer Concierge
          </a>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <a href="#" className="hover:text-ink">
            Security Guidelines
          </a>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
