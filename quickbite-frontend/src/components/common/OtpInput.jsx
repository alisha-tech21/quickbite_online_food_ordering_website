import { useRef } from "react";

const LENGTH = 6;

const OtpInput = ({ value, onChange }) => {
  const inputsRef = useRef([]);
  const digits = value.padEnd(LENGTH, " ").split("").slice(0, LENGTH);

  const setDigitAt = (index, digit) => {
    const next = value.split("");
    next[index] = digit;
    onChange(next.join("").slice(0, LENGTH));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigitAt(index, "");
      return;
    }
    const digit = raw[raw.length - 1];
    setDigitAt(index, digit);
    if (index < LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (pasted) {
      e.preventDefault();
      onChange(pasted.padEnd(LENGTH, "").slice(0, LENGTH).trimEnd());
      const focusIndex = Math.min(pasted.length, LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-14 w-12 rounded-md border border-slate-200 bg-slate-50 text-center text-xl font-bold text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      ))}
    </div>
  );
};

export default OtpInput;
