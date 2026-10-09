import React from "react";
import { Link } from "react-router-dom";
import hpic from "../../assets/hpic.jpg";
import {
  Flame,
  ArrowRight,
  Store,
  Zap,
  Star,
  ShieldCheck,
  Bike,
} from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/30 via-white to-white pt-28 pb-16 sm:pt-32 lg:pt-40 lg:py-20">
      {/* Continuous floating animation for hero image + vegetables */}
      <style>
        {`
          @keyframes heroFloat {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-12px);
            }
          }

          .hero-float {
            animation: heroFloat 5s ease-in-out infinite;
            will-change: transform;
          }

          @keyframes veggieFloat1 {
            0%,
            100% {
              transform: translate(0, 0) rotate(-8deg);
            }
            50% {
              transform: translate(0, -10px) rotate(4deg);
            }
          }

          @keyframes veggieFloat2 {
            0%,
            100% {
              transform: translate(0, 0) rotate(8deg);
            }
            50% {
              transform: translate(5px, -12px) rotate(-5deg);
            }
          }

          @keyframes veggieFloat3 {
            0%,
            100% {
              transform: translate(0, 0) rotate(-5deg);
            }
            50% {
              transform: translate(-5px, -9px) rotate(6deg);
            }
          }

          .veggie-float-1 {
            animation: veggieFloat1 4s ease-in-out infinite;
            will-change: transform;
          }

          .veggie-float-2 {
            animation: veggieFloat2 4.5s ease-in-out infinite;
            will-change: transform;
          }

          .veggie-float-3 {
            animation: veggieFloat3 5s ease-in-out infinite;
            will-change: transform;
          }

          @media (prefers-reduced-motion: reduce) {
            .hero-float,
            .veggie-float-1,
            .veggie-float-2,
            .veggie-float-3 {
              animation: none;
            }
          }
        `}
      </style>

      {/* Glowing ambient backdrops */}
      <div className="absolute -top-24 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-brand-100/45 blur-3xl pointer-events-none"></div>

      <div className="absolute top-1/2 -left-20 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-brand-50/70 blur-3xl pointer-events-none"></div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* =========================================================
              LEFT CONTENT
          ========================================================== */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-5 z-10">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-brand-100">
              <Flame
                size={16}
                className="text-brand-500 fill-brand-500 shrink-0"
              />

              <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-600 font-extrabold">
                Fast • Fresh • Guaranteed Hot
              </span>

              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mx-0.5"></span>

              <span className="font-sans text-[10px] sm:text-[11px] text-slate-500 font-medium">
                30 Min Or Free
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-sans font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[54px] lg:leading-[62px] tracking-tight text-slate-900 text-balance">
              Your cravings, <br className="hidden sm:inline" />
              <span className="text-brand-500 relative inline-block">
                delivered fast.
                <svg
                  className="absolute left-0 -bottom-2 w-full text-brand-200 opacity-80"
                  fill="none"
                  height="12"
                  viewBox="0 0 260 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 9C70 2 195 2 258 9"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="font-sans text-sm sm:text-base lg:text-lg text-slate-600 max-w-xl text-balance">
              Discover sizzling hot handi, fragrant biryani, artisan smash
              burgers and stone-baked pizza from top-tier kitchens in your
              vicinity, delivered with real-time temperature tracking.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              <a
                href="#menu-bestsellers"
                className="inline-flex items-center justify-center gap-2 bg-brand-500 text-white font-sans font-bold text-sm px-8 py-3.5 rounded-full shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition-all transform active:scale-95 group text-center"
              >
                <span>Order Now</span>

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

              <a
                href="#popular-restaurants"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 font-sans font-bold text-sm px-6 py-3.5 rounded-full shadow-sm border border-slate-200 hover:bg-brand-50 hover:border-brand-200 transition-colors text-center"
              >
                <Store size={18} className="text-brand-500 shrink-0" />

                <span>Explore Restaurants</span>
              </a>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-2 sm:pt-4 w-full max-w-lg">
              {/* Stat 1 */}
              <div className="flex flex-col bg-white p-3 sm:p-3.5 rounded-2xl shadow-sm border border-slate-200/60 hover:border-brand-300 hover:shadow-md transition-all">
                <span className="font-sans text-xl sm:text-2xl font-extrabold text-slate-900">
                  500+
                </span>

                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Curated Spots
                </span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col bg-white p-3 sm:p-3.5 rounded-2xl shadow-sm border border-slate-200/60 hover:border-brand-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-1">
                  <span className="font-sans text-xl sm:text-2xl font-extrabold text-slate-900">
                    25
                  </span>

                  <span className="font-sans text-[10px] sm:text-xs text-brand-600 font-bold">
                    MIN
                  </span>
                </div>

                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Avg Delivery
                </span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col bg-white p-3 sm:p-3.5 rounded-2xl shadow-sm border border-slate-200/60 hover:border-brand-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-1 text-slate-900">
                  <span className="font-sans text-xl sm:text-2xl font-extrabold">
                    4.9
                  </span>

                  <Star
                    size={16}
                    className="text-amber-500 fill-amber-500 shrink-0"
                  />
                </div>

                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  85k+ Reviews
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT HERO IMAGE
          ========================================================== */}
          <div className="lg:col-span-6 relative mt-10 lg:mt-0">
            {/* =====================================================
                VEGETABLES — ONLY AROUND THE IMAGE
                These stay outside the image itself
            ====================================================== */}

            {/* Top Left Tomato */}
            <span className="veggie-float-1 absolute -top-14 left-[5%] sm:left-[8%] text-2xl sm:text-3xl z-10 select-none pointer-events-none drop-shadow-md">
              🍅
            </span>

            {/* Top Right Lettuce */}
            <span className="veggie-float-2 absolute -top-17 right-[7%] sm:right-[10%] text-2xl sm:text-3xl z-10 select-none pointer-events-none drop-shadow-md">
              🥬
            </span>

            {/* Left Carrot */}
            <span className="veggie-float-3 absolute top-[42%] -left-2  text-xl sm:text-2xl z-10 select-none pointer-events-none drop-shadow-md">
              🥕
            </span>

            {/* Right Chili */}
            <span className="veggie-float-1 absolute top-[60%] -right-10  text-xl sm:text-2xl z-10 select-none pointer-events-none drop-shadow-md">
              🌶️
            </span>

            {/* Bottom Left Broccoli */}
            <span className="veggie-float-2 absolute -bottom-20 left-[1%] sm:left-[30%] text-2xl sm:text-3xl z-10 select-none pointer-events-none drop-shadow-md">
              🥦
            </span>

            {/* Bottom Right Tomato */}
            <span className="veggie-float-3 absolute -bottom-[12%] right-[9%] sm:right-[13%] text-xl sm:text-2xl z-10 select-none pointer-events-none drop-shadow-md">
              🍅
            </span>

            {/* Main floating wrapper */}
            <div className="hero-float relative w-full max-w-[530px] mx-auto">
              {/* Main Hero Platter Image */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 bg-slate-100 border-4 border-white group">
                <img
                  alt="Gourmet smash burger platter"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:-translate-y-1"
                  src={hpic}
                />
                {/* Dark image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>

                {/* Bottom image labels */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs gap-2">
                  <span className="font-sans font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                    Chef Signature Combo
                  </span>

                  <span className="font-bold text-brand-200 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                    🔥 Hot & Fresh
                  </span>
                </div>
              </div>
            </div>

            {/* =========================================================
                FLOATING BADGE 1
            ========================================================== */}
            <div className="absolute -top-4 -left-2 sm:-left-4 sm:top-4 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-brand-100 flex items-center gap-2.5 sm:gap-3 z-20 scale-90 sm:scale-100">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 shadow-inner shrink-0">
                <Zap size={20} className="fill-brand-500" />
              </div>

              <div className="flex flex-col pr-1">
                <span className="font-sans text-[11px] sm:text-xs text-slate-900 font-extrabold whitespace-nowrap">
                  30 min delivery ⚡
                </span>

                <span className="text-[10px] sm:text-[11px] text-brand-600 font-bold whitespace-nowrap">
                  Guaranteed hot or free
                </span>
              </div>
            </div>

            {/* =========================================================
                FLOATING BADGE 2
            ========================================================== */}
            <div className="absolute -bottom-6 left-2 sm:left-8 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-2.5 sm:gap-3 max-w-[250px] sm:max-w-[270px] z-20 hover:-translate-y-1 transition-transform scale-90 sm:scale-100">
              <div className="flex -space-x-2 shrink-0">
                <span className="inline-block w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-[11px] sm:text-xs text-purple-700 border-2 border-white">
                  AK
                </span>

                <span className="inline-block w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 flex items-center justify-center font-bold text-[11px] sm:text-xs text-brand-700 border-2 border-white">
                  ZA
                </span>

                <span className="inline-block w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-[11px] sm:text-xs text-emerald-700 border-2 border-white">
                  HN
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-sans text-xs font-bold text-slate-900">
                    4.9 ★
                  </span>

                  <span className="text-[10px] sm:text-[11px] text-slate-500">
                    (12.4k reviews)
                  </span>
                </div>

                <span className="text-[10px] text-emerald-600 font-bold truncate">
                  #1 Delivery in Gulberg
                </span>
              </div>
            </div>

            {/* =========================================================
                FLOATING BADGE 3
            ========================================================== */}
            <div className="absolute top-1/2 -right-3 sm:-right-6 transform -translate-y-1/2 bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl hidden md:flex items-center gap-3 max-w-[240px] z-20 border border-white/10">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-300 opacity-75"></span>

                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-500"></span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-brand-300 uppercase font-bold tracking-wider">
                  Active Courier
                </span>

                <span className="font-sans text-xs leading-tight text-white font-semibold">
                  Tariq is 3 mins away
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
