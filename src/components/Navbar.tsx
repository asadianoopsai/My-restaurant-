import React from 'react';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  QrCode, 
  User, 
  ShieldCheck, 
  Store, 
  ChefHat
} from 'lucide-react';
import { Profile } from '../types';

interface NavbarProps {
  currentUser: Profile;
  cartCount: number;
  onOpenCart: () => void;
  onOpenQRScanner: () => void;
  onOpenRoleSwitcher: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  cartCount,
  onOpenCart,
  onOpenQRScanner,
  onOpenRoleSwitcher,
  currentView,
  onNavigate,
}) => {
  const getRoleBadge = (role: Profile['role']) => {
    switch (role) {
      case 'restaurant_owner':
        return { label: 'Owner Portal', icon: Store, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'restaurant_staff':
        return { label: 'Kitchen & Staff', icon: ChefHat, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'super_admin':
        return { label: 'Super Admin', icon: ShieldCheck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      default:
        return { label: 'Customer', icon: User, color: 'text-stone-700 bg-stone-100 border-stone-200' };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap shrink-0">
            Resto<span className="text-amber-600">Flow</span>
          </span>
        </button>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              currentView === 'home' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Explore Restaurants
          </button>
          <button
            onClick={() => onNavigate('dine_in')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              currentView === 'dine_in' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Dine-In QR
          </button>
          <button
            onClick={() => onNavigate('dine_later')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              currentView === 'dine_later' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Reserve Table
          </button>
          <button
            onClick={() => onNavigate('takeaway')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              currentView === 'takeaway' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            Takeaway Parcel
          </button>
          <button
            onClick={() => onNavigate('my_orders')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-stone-900 ${
              currentView === 'my_orders' ? 'text-amber-600 font-semibold' : ''
            }`}
          >
            My Orders
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick QR Scanner Icon button */}
          <button
            onClick={onOpenQRScanner}
            title="Scan Table QR Code"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Scan Table</span>
          </button>

          {/* Cart button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Role Persona Switcher Pill */}
          <button
            onClick={onOpenRoleSwitcher}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:shadow-xs whitespace-nowrap shrink-0 ${badge.color}`}
          >
            <BadgeIcon className="w-3.5 h-3.5" />
            <span className="font-semibold">{badge.label}</span>
            <span className="text-stone-400 hidden lg:inline">|</span>
            <span className="hidden lg:inline text-stone-600 truncate max-w-[120px]">{currentUser.fullName}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
