import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Smartphone,
  ArrowRight,
  Gift,
  ShieldCheck,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout";
import PasswordInput from "../../components/common/PasswordInput";
import SocialButtons from "../../components/common/SocialButtons";
import { registerApi } from "../../api/authApi";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
  marketingOptIn: true,
};

const Register = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const checks = {
    minLength: form.password.length >= 8,
    hasNumber: /\d/.test(form.password),
    match: form.password.length > 0 && form.password === form.confirmPassword,
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    };

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
      isValid = false;
    } else {
      const nameRegex = /^[A-Za-z\s]+$/;
      if (!nameRegex.test(form.fullName)) {
        newErrors.fullName = "Name cannot contain numbers or symbols.";
        isValid = false;
      } else if (form.fullName.trim().length < 3) {
        newErrors.fullName = "Full name must be at least 3 characters long.";
        isValid = false;
      } else if (form.fullName.trim().length > 30) {
        newErrors.fullName = "Full name cannot exceed 30 characters.";
        isValid = false;
      }
    }

    if (!form.email.trim()) {
      newErrors.email = "Email address is required.";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = "Please enter a valid email address.";
        isValid = false;
      }
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required.";
      isValid = false;
    } else if (form.phone.replace(/\D/g, "").length < 9) {
      newErrors.phone = "Please enter a valid phone number.";
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
      isValid = false;
    } else if (!checks.minLength || !checks.hasNumber) {
      newErrors.password = "Must be 8+ chars and include a number.";
      isValid = false;
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
      isValid = false;
    } else if (!checks.match) {
      newErrors.confirmPassword = "Passwords do not match.";
      isValid = false;
    }

    if (!form.agreeTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
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
      const data = await registerApi({
        fullName: form.fullName,
        email: form.email,
        countryCode: "+92",
        phone: form.phone,
        password: form.password,
        marketingOptIn: form.marketingOptIn,
      });
      toast.success(
        "Account created! Check your email for the verification code.",
      );
      navigate("/verify-otp", { state: { email: data?.email || form.email } });
    } catch (err) {
      const errorMsg = err.message || "Registration failed. Please try again.";

      if (
        errorMsg.toLowerCase().includes("email") ||
        errorMsg.toLowerCase().includes("exist")
      ) {
        setErrors((prev) => ({ ...prev, email: errorMsg }));
      } else if (errorMsg.toLowerCase().includes("phone")) {
        setErrors((prev) => ({ ...prev, phone: errorMsg }));
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const CheckDot = ({ active, label }) => (
    <span
      className={`flex items-center gap-1.5 text-xs ${
        active ? "text-emerald-600" : "text-slate-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-emerald-500" : "border border-slate-300"
        }`}
      />
      {label}
    </span>
  );

  return (
    <AuthLayout>
      <div className="grid gap-6 md:grid-cols-5 md:items-center">
        {/* Left Banner */}
        <div className="hidden md:flex md:flex-col md:justify-between md:col-span-2 h-[450px]">
          <div>
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-600">
              <Star size={12} fill="currentColor" /> Fast · Fresh · Rewarding
            </span>
            <h1 className="mb-3 text-2xl font-extrabold leading-tight text-ink">
              Unlock Culinary Delights <br /> Delivered in Minutes.
            </h1>
            <p className="mb-4 text-sm text-slate-500">
              Join over 120,000 discerning food lovers. Fresh meals from top
              local kitchens, seamlessly delivered to your doorstep.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg flex-1">
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=60"
              alt="Fresh meal spread"
              className="h-44 md:h-full w-full object-cover"
            />
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
              <ShieldCheck size={13} className="text-emerald-500" /> 30-Min
              Delivery
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2.5 text-white backdrop-blur-sm">
              <p className="text-xs font-semibold">
                4.9/5 Rating from 48,000+ reviews
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="qb-card py-3 px-6 md:py-4 md:px-8 md:col-span-3">
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink">Create Account</h2>
            <span className="whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600">
              60s Signup
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Sign up in under 60 seconds and enjoy free delivery on first 3
            orders!
          </p>

          <div className="mb-4 flex items-center gap-3 rounded-md bg-brand-50 p-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
              <Gift size={16} />
            </span>
            <p className="text-sm">
              <span className="font-bold text-brand-600">SPECIAL OFFER</span> ·
              Flat 20% off + Free Delivery
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Full Name <span className="text-brand-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Tariq Mahmood"
                    className={`qb-input h-10 text-sm pl-10 transition-colors ${
                      errors.fullName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  />
                </div>
                <div className="min-h-[18px] mt-0.5">
                  {errors.fullName && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Email Address <span className="text-brand-500">*</span>
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
                    placeholder="tariq@example.com"
                    className={`qb-input h-10 text-sm pl-10 transition-colors ${
                      errors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  />
                </div>
                <div className="min-h-[18px] mt-0.5">
                  {errors.email && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">
                  Phone Number <span className="text-brand-500">*</span>
                </label>
                <span className="text-xs text-slate-400">For SMS tracking</span>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-ink h-10">
                  🇵🇰 +92
                </span>
                <div className="relative flex-1">
                  <Smartphone
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="300 1234567"
                    className={`qb-input h-10 text-sm pl-10 transition-colors ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  />
                </div>
              </div>
              <div className="min-h-[18px] mt-0.5">
                {errors.phone && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Passwords */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Password <span className="text-brand-500">*</span>
                </label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <div className="min-h-[18px] mt-0.5">
                  {errors.password && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Confirm Password <span className="text-brand-500">*</span>
                </label>
                <PasswordInput
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-type password"
                  autoComplete="new-password"
                />
                <div className="min-h-[18px] mt-0.5">
                  {errors.confirmPassword && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3.5 py-2.5">
              <CheckDot active={checks.minLength} label="Min. 8 chars" />
              <CheckDot active={checks.hasNumber} label="1 number" />
              <CheckDot active={checks.match} label="Match" />
            </div>

            <div className="space-y-2 text-sm pt-1">
              <label className="flex items-start gap-2.5 text-slate-600">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded accent-brand-500"
                />
                <span>
                  I agree to QuickBite&apos;s{" "}
                  <a
                    href="#"
                    className="font-semibold text-brand-500 hover:underline"
                  >
                    Terms
                  </a>{" "}
                  &amp;{" "}
                  <a
                    href="#"
                    className="font-semibold text-brand-500 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-slate-600">
                <input
                  type="checkbox"
                  name="marketingOptIn"
                  checked={form.marketingOptIn}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded accent-brand-500"
                />
                <span>Send me exclusive food deals &amp; flash sales</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="qb-btn-primary h-10 text-sm mt-3"
            >
              {loading ? "Creating account…" : "Create Account & Continue"}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div className="relative py-2 text-center">
              <span className="relative z-10 bg-white px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Or sign up with
              </span>
              <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200" />
            </div>

            <SocialButtons mode="up" />

            <p className="text-center text-sm text-slate-500 pt-1.5">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-brand-500 hover:underline"
              >
                Sign in ›
              </Link>
            </p>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
