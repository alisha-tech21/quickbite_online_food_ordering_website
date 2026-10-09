import React, { useState } from "react";

const SpecialOfferBanner = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("QUICK20");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-4 sm:py-6 bg-[#f8f9fa]" id="special-offers">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Banner Container with Reduced Height */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[24px] bg-gradient-to-r from-[#e33412] via-[#f04b28] to-[#f97352] text-white p-5 sm:p-6 lg:p-7 shadow-[0_15px_35px_rgba(227,52,18,0.25)]">
          {/* Subtle Background Watermark */}
          <div className="absolute right-6 bottom-2 opacity-10 pointer-events-none hidden lg:block">
            <svg
              className="w-48 h-48 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h6v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
            {/* Left Content Area */}
            <div className="lg:col-span-8 flex flex-col items-start space-y-2 sm:space-y-2.5 text-left">
              {/* Flash Deal Timer Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/15 backdrop-blur-md text-white font-sans text-xs sm:text-sm font-bold uppercase tracking-wider">
                <span>⏱</span>
                <span>SPECIAL FLASH DEAL • ENDS IN 05H : 38m</span>
              </div>

              {/* Main Headline */}
              <h2 className="font-sans text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.1] max-w-xl">
                Hungry? We’ve got a deal for you.
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm text-white/95 max-w-lg leading-relaxed font-normal">
                Get{" "}
                <span className="font-bold underline decoration-white/60">
                  Rs. 500 OFF
                </span>{" "}
                your feast order with QuickBite. Apply voucher at checkout or
                copy code below to claim instantly.
              </p>

              {/* Promo Code & Button Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 w-full">
                {/* Promo Code Pill Box */}
                <div className="flex items-center justify-between sm:justify-start bg-white text-gray-900 pl-4 pr-1.5 py-1.5 rounded-full shadow-md w-full sm:w-auto">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 font-semibold mr-2 uppercase tracking-wide">
                      Promo Code:
                    </span>
                    <span className="font-sans font-extrabold text-gray-900 tracking-wider mr-3 text-sm sm:text-base select-all">
                      QUICK20
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="font-sans text-xs uppercase font-extrabold bg-[#fceade] hover:bg-[#f7d3c0] text-[#b33a1e] px-3.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer shrink-0"
                    type="button"
                  >
                    {copied ? "Copied!" : "COPY"}
                  </button>
                </div>

                {/* Claim Voucher Button */}
                <button
                  className="bg-[#1f2229] hover:bg-black text-white font-sans font-bold text-sm sm:text-base px-6 py-2.5 rounded-full shadow-lg transition-all hover:scale-102 active:scale-95 cursor-pointer text-center w-full sm:w-auto"
                  type="button"
                >
                  Claim Rs. 500 Voucher
                </button>
              </div>
            </div>

            {/* Right Side Circular Discount Badge */}
            <div className="lg:col-span-4 hidden lg:flex items-center justify-center">
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-[#ff8c70] to-[#e8431e] flex flex-col items-center justify-center text-center p-3 shadow-[0_10px_25px_rgba(0,0,0,0.15)] border border-white/20 transform hover:scale-105 transition-transform duration-300">
                <span className="font-sans text-[10px] uppercase tracking-widest text-white/90 font-extrabold">
                  FLAT DISCOUNT
                </span>
                <span className="font-sans text-3xl font-black text-white leading-none my-1">
                  Rs. 500
                </span>
                <span className="text-[11px] text-white/95 font-medium leading-tight">
                  On orders over Rs. 1,500
                </span>
                <span className="text-[9px] text-white/80 mt-0.5 uppercase tracking-wider font-semibold">
                  VALID ON ALL KITCHENS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOfferBanner;
