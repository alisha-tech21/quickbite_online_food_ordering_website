import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const PasswordInput = ({
  value,
  onChange,
  placeholder = "Min. 8 characters",
  name,
  autoComplete,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="qb-input pr-11"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
};

export default PasswordInput;
