import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Smartphone, 
  Coins, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { store } from '../lib/store';
import { MenuItem, OrderType, PaymentMethod, Restaurant } from '../types';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  restaurant?: Restaurant;
  orderType: OrderType;
  tableNumber?: string;
  tableId?: string;
  sessionId?: string;
  reservationId?: string;
  pickupTime?: string;
  onOrderSuccess: (orderId: string, orderNumber: string, pickupCode?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  restaurant,
  orderType,
  tableNumber,
  tableId,
  sessionId,
  reservationId,
  pickupTime: initialPickupTime,
  onOrderSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [customerName, setCustomerName] = useState(store.getCurrentUser().fullName || 'Alex Morgan');
  const [customerPhone, setCustomerPhone] = useState(store.getCurrentUser().phone || '+1 555-019-2834');
  const [orderNotes, setOrderNotes] = useState('');
  const [pickupTime, setPickupTime] = useState(initialPickupTime || 'In 25 minutes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const settings = restaurant ? store.getRestaurantSettings(restaurant.id) : null;

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const taxRate = settings?.taxRate || 8.5;
  const serviceRate = settings?.serviceChargeRate || 5.0;
  const tax = Number(((subtotal * taxRate) / 100).toFixed(2));
  const serviceCharge = Number(((subtotal * serviceRate) / 100).toFixed(2));
  const total = Number((subtotal + tax + serviceCharge).toFixed(2));

  let advancePercent = 100;
  if (orderType === 'dine_in') {
    advancePercent = settings?.dineInAdvancePercent || 30;
  } else if (orderType === 'dine_later') {
    advancePercent = settings?.dineLaterAdvancePercent || 30;
  } else if (orderType === 'takeaway') {
    advancePercent = settings?.takeawayAdvancePercent || 80;
  }

  const advanceAmount = Number(((total * advancePercent) / 100).toFixed(2));
  const remainingBalance = Number((total - advanceAmount).toFixed(2));

  const handleCheckout = async () => {
    if (!restaurant) return;
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const itemsPayload = cartItems.map((ci) => ({
        menuItemId: ci.item.id,
        quantity: ci.quantity,
        specialInstructions: ci.specialInstructions,
      }));

      const res = store.createOrder({
        restaurantId: restaurant.id,
        orderType,
        items: itemsPayload,
        tableId,
        tableNumber,
        sessionId,
        reservationId,
        pickupTime: orderType === 'takeaway' ? pickupTime : undefined,
        notes: orderNotes,
        customerName,
        customerPhone,
        paymentMethod,
      });

      onClearCart();
      onClose();
      onOrderSuccess(res.order.id, res.order.orderNumber, res.pickupCode?.pickupCode);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-stone-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div>
            <h2 className="text-base font-bold text-stone-900">Your Order Review</h2>
            <p className="text-xs text-stone-500">
              {restaurant?.name || 'Select items to begin'} · {orderType.replace('_', ' ').toUpperCase()}
              {tableNumber ? ` (${tableNumber})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Takeaway Notice if applicable */}
          {orderType === 'takeaway' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                <Clock className="w-4 h-4" /> Recommended Notice:
              </div>
              "Save your time! We recommend placing your order at least 20 minutes before reaching the restaurant so our team can prepare it for collection."
            </div>
          )}

          {/* Items List */}
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p className="text-sm font-medium">Your cart is empty.</p>
              <p className="text-xs text-stone-400 mt-1">Browse the menu to add delicious dishes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Selected Dishes ({cartItems.reduce((s, i) => s + i.quantity, 0)})
              </div>
              {cartItems.map((ci) => (
                <div
                  key={ci.item.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${ci.item.isVegetarian ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <h4 className="text-xs font-bold text-stone-900 truncate">{ci.item.name}</h4>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 tabular-nums">
                      ${ci.item.price.toFixed(2)} each
                    </div>
                  </div>

                  {/* Quantity control */}
                  <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-2xs">
                    <button
                      onClick={() => onUpdateQuantity(ci.item.id, -1)}
                      className="text-stone-500 hover:text-stone-900"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold tabular-nums w-4 text-center">{ci.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(ci.item.id, 1)}
                      className="text-stone-500 hover:text-stone-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs font-bold text-stone-900 tabular-nums w-14 text-right">
                    ${(ci.item.price * ci.quantity).toFixed(2)}
                  </div>

                  <button
                    onClick={() => onRemoveItem(ci.item.id)}
                    className="text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Customer Details Form */}
          {cartItems.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Guest Contact
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {orderType === 'takeaway' && (
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">Expected Pickup Time</label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="In 20 minutes (Fastest)">In 20 minutes (Fastest)</option>
                    <option value="In 30 minutes">In 30 minutes</option>
                    <option value="In 45 minutes">In 45 minutes</option>
                    <option value="In 1 hour">In 1 hour</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">Special Cooking Notes (Optional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Extra spicy, dressing on side"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          {cartItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Select Payment Method
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>UPI Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash_counter')}
                  className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'cash_counter'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Cash</span>
                </button>
              </div>

              {/* Prototype simulated payment transparency badge */}
              <div className="text-[11px] text-stone-500 bg-stone-100 p-2 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span>Simulated Sandbox Payment: Verified server-side transaction token generated automatically.</span>
              </div>
            </div>
          )}

          {/* Pricing Calculation Summary */}
          {cartItems.length > 0 && (
            <div className="pt-2 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Food Subtotal</span>
                <span className="tabular-nums font-medium text-stone-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums font-medium text-stone-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee ({serviceRate}%)</span>
                <span className="tabular-nums font-medium text-stone-900">${serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-bold pt-1 border-t border-stone-100">
                <span>Total Order Value</span>
                <span className="tabular-nums text-sm">${total.toFixed(2)}</span>
              </div>

              {/* Advance policy breakdown */}
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-1">
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Advance Payable Now ({advancePercent}%)</span>
                  <span className="tabular-nums">${advanceAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-800/80">
                  <span>Remaining Balance Due Later</span>
                  <span className="tabular-nums">${remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/90">
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-between"
            >
              <span>Confirm & Pay Deposit (${advanceAmount.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
