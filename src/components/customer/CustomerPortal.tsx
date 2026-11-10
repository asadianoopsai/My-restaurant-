import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  UtensilsCrossed, 
  Clock, 
  ShoppingBag, 
  Plus, 
  Minus, 
  AlertCircle,
  Receipt,
  QrCode,
  CalendarClock,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Restaurant, MenuItem, OrderType, DiningSession, Order } from '../../types';
import { store } from '../../lib/store';
import { CartItem } from '../CartDrawer';

interface CustomerPortalProps {
  selectedRestaurantId?: string;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: string;
  onSelectRestaurant: (restaurantId: string) => void;
  onAddToCart: (item: MenuItem) => void;
  cartItems: CartItem[];
  onOpenCart: () => void;
  onOpenQRScanner: () => void;
  onOpenAdvanceReservation: () => void;
  onOpenTakeaway: () => void;
  onViewInvoice: (orderId?: string, sessionId?: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  selectedRestaurantId,
  orderType,
  tableId,
  tableNumber,
  onSelectRestaurant,
  onAddToCart,
  cartItems,
  onOpenCart,
  onOpenQRScanner,
  onOpenAdvanceReservation,
  onOpenTakeaway,
  onViewInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState(false);

  const restaurants = store.getRestaurants().filter((r) => r.status === 'active');
  const currentRestaurant = selectedRestaurantId ? store.getRestaurantById(selectedRestaurantId) : undefined;

  // Active dining session if seated at a table
  let activeSession: DiningSession | undefined;
  let sessionOrders: Order[] = [];
  if (currentRestaurant && tableId) {
    activeSession = store.getActiveSession(currentRestaurant.id, tableId);
    if (activeSession) {
      sessionOrders = store.getOrders(currentRestaurant.id).filter((o) => activeSession?.orderIds.includes(o.id));
    }
  }

  // Categories & Menu Items
  const categories = currentRestaurant ? store.getMenuCategories(currentRestaurant.id) : [];
  const menuItems = currentRestaurant ? store.getMenuItems(currentRestaurant.id) : [];

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (vegOnly && !item.isVegetarian) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const allCuisines = Array.from(new Set(restaurants.flatMap((r) => r.cuisineType)));

  const handleFinishDining = () => {
    if (!activeSession) return;
    onViewInvoice(undefined, activeSession.id);
  };

  // 1. If NO restaurant selected, show restaurant discovery list
  if (!currentRestaurant) {
    const filteredRestaurants = restaurants.filter((r) => {
      if (selectedCuisine !== 'all' && !r.cuisineType.includes(selectedCuisine)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.cuisineType.some((c) => c.toLowerCase().includes(q));
      }
      return true;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Discovery Search & Cuisine Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by restaurant name or cuisine..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedCuisine === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              All Cuisines
            </button>
            {allCuisines.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  selectedCuisine === c
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((rest) => (
            <div
              key={rest.id}
              onClick={() => onSelectRestaurant(rest.id)}
              className="group bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                  <img
                    src={rest.heroImageUrl}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {rest.pauseOrders && (
                    <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-2xs flex items-center justify-center p-4 text-center">
                      <span className="text-xs font-bold text-amber-300 bg-stone-900/90 px-3 py-1.5 rounded-lg border border-amber-400/40">
                        Orders Paused Temporarily
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-bold text-stone-900 flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{rest.rating}</span>
                    <span className="text-stone-400 font-normal">({rest.reviewCount})</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                    {rest.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {rest.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{rest.address}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="text-stone-500">
                      Cuisine: <span className="font-medium text-stone-800">{rest.cuisineType.join(', ')}</span>
                    </div>
                    <div className="font-mono font-semibold text-stone-700">
                      ~${rest.averageCostForTwo} for 2
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
                <span>View Menu & Order</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>
    );
  }

  // 2. RESTAURANT MENU VIEW
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Restaurant Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-xs">
        <div className="relative h-48 sm:h-64 w-full bg-stone-900">
          <img
            src={currentRestaurant.heroImageUrl}
            alt={currentRestaurant.name}
            className="w-full h-full object-cover opacity-85"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span>{currentRestaurant.cuisineType.join(' · ')}</span>
                <span className="text-white/40">·</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {currentRestaurant.rating} ({currentRestaurant.reviewCount} reviews)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                {currentRestaurant.name}
              </h1>
              <p className="text-xs text-stone-200 mt-1 max-w-xl line-clamp-1">
                {currentRestaurant.address} · {currentRestaurant.phone}
              </p>
            </div>

            <button
              onClick={() => onSelectRestaurant('')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-colors shrink-0"
            >
              Change Restaurant
            </button>
          </div>
        </div>

        {/* Ordering Context Strip */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-stone-900 uppercase tracking-wider">Ordering Mode:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold bg-white border border-stone-200 text-amber-800">
              {orderType === 'dine_in' && <QrCode className="w-3.5 h-3.5 text-amber-600" />}
              {orderType === 'dine_later' && <CalendarClock className="w-3.5 h-3.5 text-amber-600" />}
              {orderType === 'takeaway' && <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />}
              <span className="capitalize">{orderType.replace('_', ' ')}</span>
              {tableNumber ? <span className="text-stone-900">({tableNumber})</span> : ''}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {orderType === 'dine_in' && !tableId && (
              <button
                onClick={onOpenQRScanner}
                className="text-amber-700 font-bold hover:underline flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" /> Scan Table QR
              </button>
            )}
            {orderType === 'takeaway' && (
              <span className="text-stone-500 italic">20-min advance prep policy active</span>
            )}
          </div>
        </div>
      </div>

      {/* "Pause New Orders" Notification Banner */}
      {currentRestaurant.pauseOrders && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold">New Orders Temporarily Paused by Restaurant</div>
            <div className="text-amber-800 mt-0.5">
              {currentRestaurant.pauseReason || 'The kitchen is at peak capacity. Existing orders are being fulfilled.'}
            </div>
          </div>
        </div>
      )}

      {/* Active Dine-In Session Banner (Multi-Round Orders Flow) */}
      {orderType === 'dine_in' && activeSession && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Live Dining Session: {activeSession.tableNumber}
              </span>
              <span className="text-amber-700 font-semibold text-xs">· Tab Active</span>
            </div>
            <p className="text-xs text-amber-900/80 mt-1">
              You have placed {sessionOrders.length} round(s) in this session. Add more food anytime, or request your final consolidated bill when done.
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs font-mono">
              <span className="text-stone-700">Total Food: <strong>${activeSession.totalFoodAmount.toFixed(2)}</strong></span>
              <span className="text-stone-500">·</span>
              <span className="text-emerald-700">Advance Paid: <strong>${activeSession.totalPaidAmount.toFixed(2)}</strong></span>
              <span className="text-stone-500">·</span>
              <span className="text-amber-900 font-bold">Outstanding: <strong>${activeSession.outstandingBalance.toFixed(2)}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleFinishDining}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>I'm Finished Dining</span>
            </button>
          </div>
        </div>
      )}

      {/* Menu Categories Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dietary toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-stone-300 focus:ring-emerald-500"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vegetarian Only
            </span>
          </label>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const cartItem = cartItems.find((ci) => ci.item.id === item.id);
          const quantityInCart = cartItem?.quantity || 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                !item.isAvailable
                  ? 'border-stone-200 opacity-60'
                  : 'border-stone-200 hover:border-amber-400 hover:shadow-md'
              }`}
            >
              <div>
                {/* Photo if available */}
                {item.imageUrl && (
                  <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-red-600 px-3 py-1 rounded-md shadow-xs">
                          Sold Out / Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.isVegetarian ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                      />
                      <h3 className="text-sm font-bold text-stone-900">{item.name}</h3>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-stone-900 shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> ~{item.prepTimeMinutes} mins
                    </span>
                    {item.calories && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.calories} kcal</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                {!item.isAvailable ? (
                  <span className="text-xs font-semibold text-red-600">Currently Sold Out</span>
                ) : quantityInCart === 0 ? (
                  <button
                    onClick={() => onAddToCart(item)}
                    disabled={currentRestaurant.pauseOrders}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800">
                      {quantityInCart} in cart (${(item.price * quantityInCart).toFixed(2)})
                    </span>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add More
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Strip if items present */}
      {cartItems.length > 0 && (
        <div className="sticky bottom-4 z-30 max-w-xl mx-auto">
          <div className="bg-stone-900 text-white rounded-2xl p-3.5 shadow-xl border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {cartItems.reduce((acc, c) => acc + c.quantity, 0)}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Review Your Cart</div>
                <div className="text-[11px] text-stone-300">
                  Subtotal: ${cartItems.reduce((s, i) => s + i.item.price * i.quantity, 0).toFixed(2)}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenCart}
              className="px-4 py-2 text-xs font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>View Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
