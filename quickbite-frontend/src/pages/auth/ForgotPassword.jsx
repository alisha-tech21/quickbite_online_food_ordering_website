import { useState } from "react";
import { Link } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
  Mail,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout";
import { forgotPasswordApi } from "../../api/authApi";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { email: identifier, method: "email" };
      await forgotPasswordApi(payload);
      setSent(true);
      toast.success("If an account exists, reset instructions were sent.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg">
        <div className="qb-card p-6 sm:p-8 text-center">
          <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <KeyRound size={24} className="text-brand-500" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
              <ShieldCheck size={11} className="text-emerald-500" />
            </span>
          </div>

          <span className="mb-1 inline-block text-[11px] font-bold uppercase tracking-wide text-brand-600">
            Account Assistance
          </span>
          <h1 className="mb-1 text-2xl font-extrabold text-ink">
            Forgot Your Password?
          </h1>
          <p className="mb-4 text-xs sm:text-sm text-slate-500">
            No worries! Enter your registered email address, and we will send
            you instructions to reset your password.
          </p>

          {sent ? (
            <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
              Check your inbox for reset instructions. It can take a minute or
              two to arrive.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-ink">
                    Email Address
                  </label>
                  <span className="text-[11px] text-slate-400">Required</span>
                </div>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="qb-input text-sm py-2 pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 rounded-md bg-brand-50 p-3 text-left text-xs text-slate-600">
                <Lightbulb
                  size={15}
                  className="mt-0.5 flex-shrink-0 text-brand-500"
                />
                <p>
                  <span className="font-semibold text-ink">Helpful Tip:</span>{" "}
                  Make sure to check your spam or junk folder if you don't
                  receive an email within 2 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="qb-btn-primary py-2.5 text-sm"
              >
                {loading ? "Sending…" : "Send Reset Link"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-ink hover:text-brand-500"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-500">
            <ShieldCheck size={12} className="text-emerald-500" /> Protected by
            QuickBite Account Guard · SSL Encrypted
          </span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <a href="#" className="hover:text-ink">
            Contact Customer Concierge
          </a>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <a href="#" className="hover:text-ink">
            Account FAQ
          </a>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
