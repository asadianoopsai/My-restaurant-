import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  UtensilsCrossed, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Restaurant, RestaurantTable, MenuItem, PaymentMethod } from '../../types';
import { store } from '../../lib/store';

interface AdvanceReservationViewProps {
  onSuccess: (reservationId: string, orderId?: string) => void;
  onCancel: () => void;
}

export const AdvanceReservationView: React.FC<AdvanceReservationViewProps> = ({
  onSuccess,
  onCancel,
}) => {
  const restaurants = store.getRestaurants().filter((r) => r.status === 'active');
  const [selectedRestId, setSelectedRestId] = useState(restaurants[0]?.id || '');
  const [guestCount, setGuestCount] = useState(2);
  const [reservationDate, setReservationDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [reservationTime, setReservationTime] = useState('19:00');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [customerName, setCustomerName] = useState(store.getCurrentUser().fullName || 'Alex Morgan');
  const [customerPhone, setCustomerPhone] = useState(store.getCurrentUser().phone || '+1 555-019-2834');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedRest = store.getRestaurantById(selectedRestId);
  const availableTables = selectedRestId ? store.checkTableAvailability(selectedRestId, reservationDate, reservationTime) : [];
  const menuItems = selectedRestId ? store.getMenuItems(selectedRestId).filter((m) => m.isAvailable) : [];

  // Calculate pre-order totals
  let foodSubtotal = 0;
  for (const [itemId, qty] of Object.entries(selectedDishes)) {
    const item = menuItems.find((m) => m.id === itemId);
    if (item && qty > 0) {
      foodSubtotal += item.price * qty;
    }
  }

  const settings = selectedRestId ? store.getRestaurantSettings(selectedRestId) : null;
  const tax = Number(((foodSubtotal * (settings?.taxRate || 8.5)) / 100).toFixed(2));
  const service = Number(((foodSubtotal * (settings?.serviceChargeRate || 5.0)) / 100).toFixed(2));
  const foodTotal = Number((foodSubtotal + tax + service).toFixed(2));

  // Advance deposit: 30% of food order, or $15 minimum table reservation fee
  const advancePercent = settings?.dineLaterAdvancePercent || 30;
  const advanceDeposit = foodTotal > 0 ? Number(((foodTotal * advancePercent) / 100).toFixed(2)) : 15.00;

  const handleDishQtyChange = (itemId: string, delta: number) => {
    setSelectedDishes((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRest) return;
    if (selectedRest.pauseOrders) {
      setErrorMsg('This restaurant is currently not accepting new bookings.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const foodItemsPayload = Object.entries(selectedDishes)
        .filter(([_, qty]) => qty > 0)
        .map(([menuItemId, quantity]) => ({
          menuItemId,
          quantity,
        }));

      const res = store.createReservationWithOrder({
        restaurantId: selectedRest.id,
        tableId: selectedTableId || undefined,
        guestCount,
        reservationDate,
        expectedArrivalTime: new Date(`${reservationDate}T${reservationTime}`).toISOString(),
        specialNotes,
        customerName,
        customerPhone,
        foodItems: foodItemsPayload,
        paymentMethod,
      });

      onSuccess(res.reservation.id, res.order?.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to create reservation.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
          <span>Order Now, Dine Later</span>
          <span aria-hidden="true">·</span>
          <span>Advance Reservation</span>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 mt-1">Book Table & Pre-Order Dishes</h1>
        <p className="text-xs text-stone-600 mt-1">
          Reserve an available table without double-booking risk and pre-select your food for rapid table service upon arrival.
        </p>
      </div>

      {/* 1-Minute Target Serving Operational Banner (Prompt Requirement) */}
      <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950">
          <span className="font-bold">Operational Speed Target: </span>
          Our kitchens aim to seat you at your reserved table and serve your pre-selected dishes within 1 minute of customer arrival. <span className="text-stone-500 text-[11px]">(Operational service goal, subject to dining room safety and fresh plating preparation.)</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Restaurant & Timing */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">1</span>
            Select Restaurant & Arrival Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Restaurant</label>
              <select
                value={selectedRestId}
                onChange={(e) => {
                  setSelectedRestId(e.target.value);
                  setSelectedTableId('');
                }}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Number of Guests</label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Reservation Date</label>
              <input
                type="date"
                required
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Expected Arrival Time</label>
              <select
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="12:00">12:00 PM (Lunch)</option>
                <option value="12:30">12:30 PM (Lunch)</option>
                <option value="13:00">01:00 PM (Lunch)</option>
                <option value="18:00">06:00 PM (Dinner)</option>
                <option value="18:30">06:30 PM (Dinner)</option>
                <option value="19:00">07:00 PM (Dinner)</option>
                <option value="19:30">07:30 PM (Dinner)</option>
                <option value="20:00">08:00 PM (Dinner)</option>
                <option value="20:30">08:30 PM (Dinner)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Table Selection with Anti-Double-Booking Protection */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">2</span>
              Choose Available Table (Verified Real-Time)
            </h2>
            <span className="text-[11px] text-stone-500">
              {availableTables.length} tables free for this slot
            </span>
          </div>

          {availableTables.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-800 text-center">
              All tables for this time are booked. Please select a different time slot or date.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableTables.map((tbl) => {
                const isSelected = selectedTableId === tbl.id;
                return (
                  <div
                    key={tbl.id}
                    onClick={() => setSelectedTableId(tbl.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500'
                        : 'border-stone-200 hover:border-stone-400 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{tbl.tableNumber}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {tbl.seatingCapacity} seats · {tbl.section}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Advance Food Selection */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">3</span>
              Pre-Select Dishes for 1-Minute Service Target
            </h2>
            <span className="text-[11px] text-stone-500">Optional or pre-order full meal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const qty = selectedDishes[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/40 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <h4 className="text-xs font-bold text-stone-900 truncate">{item.name}</h4>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 tabular-nums">${item.price.toFixed(2)}</div>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleDishQtyChange(item.id, -1)}
                      className="text-stone-500 hover:text-stone-900"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold font-mono w-4 text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleDishQtyChange(item.id, 1)}
                      className="text-stone-500 hover:text-stone-900"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {foodTotal > 0 && (
            <div className="p-3 bg-stone-100 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-stone-700">
                <span>Food & Beverage Total (with tax)</span>
                <span className="font-mono font-bold">${foodTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-semibold">
                <span>30% Food Advance Deposit</span>
                <span className="font-mono">${advanceDeposit.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Contact & Payment Confirmation */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">4</span>
            Guest Contact & Deposit Settle
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Phone</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Special Occasion / Table Request</label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Birthday celebration, quiet corner preferred"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Payment method selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Payment Method for Deposit</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'card' ? 'bg-amber-50 border-amber-600 text-amber-900' : 'border-stone-200'
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'upi' ? 'bg-amber-50 border-amber-600 text-amber-900' : 'border-stone-200'
                }`}
              >
                <span>UPI Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash_counter')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'cash_counter' ? 'bg-amber-50 border-amber-600 text-amber-900' : 'border-stone-200'
                }`}
              >
                <span>Cash at Door</span>
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-stone-200">
            <div>
              <div className="text-xs text-stone-500">Configured Advance Deposit</div>
              <div className="text-lg font-extrabold text-stone-900 font-mono">${advanceDeposit.toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Confirm Reservation (${advanceDeposit.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
};
