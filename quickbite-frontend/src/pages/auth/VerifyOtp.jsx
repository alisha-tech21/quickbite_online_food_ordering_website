import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  MessageSquare,
  Timer,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout";
import OtpInput from "../../components/common/OtpInput";
import { verifyOtpApi, resendOtpApi } from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";

const RESEND_SECONDS = 45;

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 4);
  return `${visible}${"•".repeat(Math.max(name.length - 4, 3))}@${domain}`;
};

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [trustDevice, setTrustDevice] = useState(true);

  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formattedTime = `00:${String(secondsLeft).padStart(2, "0")}`;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtpApi({ email, code });
      login(data.token, data.user);
      toast.success("Email verified! Welcome to QuickBite.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtpApi({ email });
      toast.success("A new code has been sent to your email");
      setSecondsLeft(RESEND_SECONDS);
      setCode("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg">
        <div className="qb-card p-5 sm:p-6 text-center">
          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <ShieldCheck size={24} className="text-brand-500" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow">
              <MessageSquare size={11} />
            </span>
          </div>

          <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
            Two-Step Sign In Verification
          </span>
          <h1 className="mb-1 text-2xl font-extrabold text-ink">
            Verify Your Sign In
          </h1>
          <p className="mb-1 text-xs sm:text-sm text-slate-500">
            To protect your QuickBite account, enter the 6-digit verification
            code sent to your registered email:
          </p>
          {/* Yahan mb-6 ki jagah mb-4 kar diya hai taake spacing balanced ho */}
          <p className="mb-4 text-xs sm:text-sm font-semibold text-ink">
            {maskEmail(email)}
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <OtpInput value={code} onChange={setCode} />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Timer size={14} />
                {secondsLeft > 0 ? (
                  <>
                    Resend code in{" "}
                    <span className="font-bold text-ink">{formattedTime}</span>
                  </>
                ) : (
                  "You can resend the code now"
                )}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={secondsLeft > 0 || resending}
                className="font-semibold text-brand-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
              >
                {resending ? "Resending…" : "Resend Code"}
              </button>
            </div>

            <label className="flex items-center justify-between gap-2 text-left text-xs sm:text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-500"
                />
                Trust this device for 30 days
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Recommended
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="qb-btn-primary py-2.5 text-sm"
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-4 flex gap-2.5 rounded-md bg-slate-50 p-3 text-left text-xs text-slate-600">
            <ShieldAlert
              size={15}
              className="mt-0.5 flex-shrink-0 text-brand-500"
            />
            <p>
              <span className="font-semibold text-ink">
                QuickBite Security:
              </span>{" "}
              We sent this one-time passcode because you are signing in from a
              new browser or device. Never share this code with anyone.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs sm:text-sm">
            <Link
              to="/login"
              className="flex items-center gap-1.5 font-semibold text-ink hover:text-brand-500"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
            <a
              href="#"
              className="font-semibold text-brand-500 hover:underline"
            >
              24/7 Support
            </a>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" /> 256-bit TLS
            Encrypted
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>Instant Activation</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
