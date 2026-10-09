import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  Star,
  Zap,
  ShieldCheck,
  Navigation,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout";
import PasswordInput from "../../components/common/PasswordInput";
import SocialButtons from "../../components/common/SocialButtons";
import { loginApi } from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";

const SignIn = () => {
  const [form, setForm] = useState({ email: "", password: "", remember: true });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = { email: "", password: "" };

    if (!form.email.trim()) {
      newErrors.email = "Email address is required.";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = "Please enter a valid email format.";
        isValid = false;
      }
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
      isValid = false;
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi({
        email: form.email,
        password: form.password,
      });
      login(data.token, data.user);
      toast.success("Welcome back!");
      if (data.user.role === "admin" || data.user.role === "branch_manager") {
        navigate("/admin", { replace: true });
      } else {
        const redirectTo = location.state?.from || "/";
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const errorMsg = err.message || "Invalid credentials. Please try again.";

      if (
        errorMsg.toLowerCase().includes("email") ||
        errorMsg.toLowerCase().includes("user")
      ) {
        setErrors((prev) => ({ ...prev, email: errorMsg }));
      } else {
        setErrors({
          email: " ",
          password: "Invalid email or password. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid overflow-hidden rounded-xl shadow-card md:grid-cols-5">
        {/* Left Side Banner */}
        <div className="relative hidden min-h-[400px] flex-col justify-between bg-ink p-6 text-white md:flex md:col-span-2">
          <img
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=60"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="relative z-10 flex items-start justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Kitchens
              Active
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-500">
              <Zap size={18} fill="currentColor" />
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white p-3.5 text-ink shadow-lg">
              <div>
                <div className="mb-1 flex gap-0.5 text-brand-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  &quot;From artisan kitchen to doorstep in 28 minutes.&quot;
                </p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                    MR
                  </span>
                  <div className="text-xs">
                    <p className="font-semibold">Chef Marco Rossi</p>
                    <p className="text-slate-500 text-[11px]">
                      Culinary Partner, SOHO
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="bg-white py-3 px-8 md:py-4 md:px-10 md:col-span-3">
          <span className="mb-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-600">
            Secure Sign In
          </span>
          <h1 className="mb-1.5 text-2xl font-extrabold text-ink">
            Welcome Back
          </h1>
          <p className="mb-4 text-sm text-slate-500">
            Sign in to order from your favorite spots.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* Email Field */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className={`qb-input h-10 text-sm pl-10 transition-colors ${
                    errors.email && errors.email.trim()
                      ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }`}
                />
              </div>
              <div className="min-h-[18px] mt-0.5">
                {errors.email && errors.email.trim() && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <div className="min-h-[18px] mt-0.5">
                {errors.password && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-600 pt-1">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded accent-brand-500"
              />
              Remember this device for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="qb-btn-primary h-10 text-sm mt-2"
            >
              {loading ? "Signing in…" : "Sign In to QuickBite"}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div className="relative py-2 text-center">
              <span className="relative z-10 bg-white px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Or continue with
              </span>
              <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200" />
            </div>

            <SocialButtons mode="in" />

            <p className="text-center text-sm text-slate-500 pt-1.5">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-brand-500 hover:underline"
              >
                Sign up now
              </Link>
            </p>
          </form>

          <div className="mt-5 flex items-center justify-center gap-3 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" /> 256-bit SSL
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1">
              <Navigation size={14} className="text-brand-500" /> Instant
              Tracking
            </span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignIn;
