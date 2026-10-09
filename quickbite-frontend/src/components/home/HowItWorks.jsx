import React from "react";

const HowItWorks = () => {
  return (
    <section
      className="py-12 bg-[#f8f9fa] border-y border-gray-200"
      id="how-it-works"
    >
      <div className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="font-sans text-xs text-[#e33412] uppercase font-extrabold tracking-wider">
            Effortless Dining
          </span>
          <h2 className="font-sans text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
            How to Order on QuickBite
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-1.5">
            From cravings to dining table satisfaction in four simple
            frictionless steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {/* Step 1: Discover */}
          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-lg hover:border-[#e33412]/40 transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#e33412] flex items-center justify-center font-sans font-extrabold text-base mb-3.5 group-hover:bg-[#e33412] group-hover:text-white transition-colors shadow-inner">
                01
              </div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-gray-900">
                Choose Location &amp; Dish
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Explore hundreds of vetted artisanal menus, authentic local
                kitchens, and verified diner reviews.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[#e33412] text-xs font-bold pt-3 border-t border-gray-100">
              <span className="material-symbols-outlined text-[15px]">
                menu_book
              </span>
              <span>Curated Menus</span>
            </div>
          </div>

          {/* Step 2: Order */}
          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-lg hover:border-[#e33412]/40 transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-sans font-extrabold text-base mb-3.5 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-inner">
                02
              </div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-gray-900">
                Customize &amp; Order
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Tweak spice blends, add raita or artisan sides, and build your
                perfect culinary lineup in a tap.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-amber-700 text-xs font-bold pt-3 border-t border-gray-100">
              <span className="material-symbols-outlined text-[15px]">
                tune
              </span>
              <span>Easy Customization</span>
            </div>
          </div>

          {/* Step 3: Track */}
          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-lg hover:border-[#e33412]/40 transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#e33412] text-white flex items-center justify-center font-sans font-extrabold text-base mb-3.5 shadow-inner">
                03
              </div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-gray-900">
                Live satellite tracking
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Watch your rider glide across town in real time with
                high-precision GPS and ETA down to the second.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[#e33412] text-xs font-bold pt-3 border-t border-gray-100">
              <span className="material-symbols-outlined text-[15px]">
                near_me
              </span>
              <span>Live GPS Radar</span>
            </div>
          </div>

          {/* Step 4: Enjoy */}
          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-lg hover:border-[#e33412]/40 transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-sans font-extrabold text-base mb-3.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                04
              </div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-gray-900">
                Fresh &amp; Fast Delivery
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Packaged in double-insulated thermal liners so every bite tastes
                straight from the flaming wok.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-emerald-700 text-xs font-bold pt-3 border-t border-gray-100">
              <span className="material-symbols-outlined text-[15px]">
                verified
              </span>
              <span>Thermal Guard</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
