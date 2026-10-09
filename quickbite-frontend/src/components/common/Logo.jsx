import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Logo = ({ withTagline = true }) => {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500 text-white shadow-sm">
        <Zap size={18} strokeWidth={2.5} fill="white" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-extrabold tracking-tight text-ink">
          Quick<span className="text-brand-500">Bite</span>
        </span>
        {withTagline && (
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Fresh food • Fast
          </span>
        )}
      </span>
    </Link>
  );
};

export default Logo;
