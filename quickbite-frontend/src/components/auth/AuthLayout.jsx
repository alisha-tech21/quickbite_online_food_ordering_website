import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "../common/Logo";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f8fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between mb-4">
        <Logo />

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:text-brand-500"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>

      <main className="mx-auto flex flex-1 w-full max-w-[1360px] items-center justify-center">
        <div className="w-full max-w-5xl">{children}</div>
      </main>

      <div className="mx-auto mt-6 w-full max-w-[1360px] text-center text-xs text-slate-400">
        © {new Date().getFullYear()} QuickBite Technologies Inc. All rights
        reserved.
      </div>
    </div>
  );
};

export default AuthLayout;
