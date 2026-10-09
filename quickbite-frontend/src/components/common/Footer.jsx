import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-12 md:px-12">
      <div className="mx-auto max-w-[1360px]">
        {/* Top Section with 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-200">
          {/* Column 1: Logo & Info */}
          <div className="flex flex-col gap-4">
            <Logo withTagline={false} />
            <p className="text-xs text-slate-600 leading-relaxed">
              Fresh food. Fast delivery. Delivering delightful culinary
              experiences from top artisanal restaurants right to your doorstep
              with concierge precision.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Discover
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-600 font-medium">
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Popular Restaurants
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Local Cuisines &amp; Biryani
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Vouchers &amp; Deals
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Chef Specials
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: QuickBite Hub */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              QuickBite Hub
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-600 font-medium">
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Partner as a Kitchen
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Deliver with Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  Help Center &amp; FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Bite Alerts */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Bite Alerts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secret voucher drops &amp; flash deals sent directly to your inbox
              weekly.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500 w-full"
              />
              <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shrink-0">
                Join
              </button>
            </div>
            <span className="text-[10px] text-slate-400">
              Zero spam. Unsubscribe anytime.
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500">
          <p className="font-medium">
            © {new Date().getFullYear()} QuickBite Culinary Technologies Ltd.
            All rights reserved.
          </p>
          <div className="flex items-center gap-6 font-medium">
            <a href="#" className="hover:text-slate-800 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-800 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-800 transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
