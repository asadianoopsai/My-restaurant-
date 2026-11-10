import React from 'react';
import { 
  QrCode, 
  CalendarClock, 
  ShoppingBag, 
  ArrowRight, 
  Utensils, 
  Clock, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface LandingHeroProps {
  onSelectFlow: (flow: 'dine_in' | 'dine_later' | 'takeaway') => void;
  onOpenRegisterRestaurant: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSelectFlow,
  onOpenRegisterRestaurant,
}) => {
  return (
    <div className="relative overflow-hidden bg-white border-b border-stone-200">
      
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and Brand Proposition */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Clean kicker without pill badge */}
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
              <span>Next-Generation Restaurant SaaS</span>
              <span aria-hidden="true">·</span>
              <span>Zero-Wait Hospitality</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15] text-balance">
              Dine without waiting. <br />
              <span className="text-amber-600">Scan at table, pre-order, or pickup.</span>
            </h1>

            <p className="text-base text-stone-600 max-w-2xl leading-relaxed">
              RestoFlow powers seamless dining experiences. Scan your table QR code to order in multiple rounds, schedule advance table reservations with fresh food ready upon arrival, or order takeaway parcels on the go with verified pickup codes.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Multi-round table tabs</span>
              </div>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>20-min takeaway prep</span>
              </div>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Independent restaurant tenant isolation</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={onOpenRegisterRestaurant}
                className="px-4 py-2.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Register Your Restaurant
              </button>
            </div>

          </div>

          {/* Right Column: Hero Visual Photo */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-lg bg-stone-100 aspect-4/3 lg:aspect-auto lg:h-[360px]">
              <img
                src="/src/assets/images/restaurant_hero_banner_1794317958146.jpg"
                alt="Contemporary Restaurant Dining Atmosphere"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs font-medium text-amber-300 uppercase tracking-wider">Live Dining Ecosystem</span>
                <p className="text-base font-bold mt-1">Smart Table QR & Kitchen Realtime Sync</p>
                <p className="text-xs text-stone-200 mt-1">Orders sync instantly between customer phones and the kitchen pass.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Section: "How would you like to order today?" - 3 Interactive Cards */}
        <div className="mt-14 pt-10 border-t border-stone-200">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              How would you like to order today?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Select an ordering journey to get started immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Dine In */}
            <div
              onClick={() => onSelectFlow('dine_in')}
              className="group p-6 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-4">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                  1. Dine In
                </h3>
                <p className="text-xs font-medium text-stone-500 mt-1">
                  Scan QR and order directly at your table.
                </p>
                <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                  Already seated? Scan your table's dedicated QR code to browse the menu, add rounds of food, and settle one consolidated final invoice when finished.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
                <span>Start Table Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Order Now, Dine Later */}
            <div
              onClick={() => onSelectFlow('dine_later')}
              className="group p-6 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-4">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                  2. Order Now, Dine Later
                </h3>
                <p className="text-xs font-medium text-stone-500 mt-1">
                  Order food and reserve a table before arrival.
                </p>
                <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                  Book your favorite table with verified live availability. Pre-select your dishes so our culinary team can prep and serve freshly within minutes of your arrival.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
                <span>Reserve & Pre-Order</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Takeaway / Parcel */}
            <div
              onClick={() => onSelectFlow('takeaway')}
              className="group p-6 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-4">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                  3. Takeaway / Parcel
                </h3>
                <p className="text-xs font-medium text-stone-500 mt-1">
                  Order in advance and collect your food without waiting.
                </p>
                <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                  Travelling or on a schedule? Place your order 20 minutes before arriving. Receive a secure pickup code and grab your hot meal with zero wait time.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
                <span>Express Takeaway</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
