import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  ShoppingBag, 
  UtensilsCrossed, 
  AlertTriangle, 
  QrCode, 
  Receipt,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Order, Refund } from '../types';
import { store } from '../lib/store';

interface LiveOrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onOpenInvoice: (orderId: string) => void;
}

export const LiveOrderTrackerModal: React.FC<LiveOrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onOpenInvoice,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  if (!isOpen || !orderId) return null;

  const order = store.getOrderById(orderId);
  if (!order) return null;

  const restaurant = store.getRestaurantById(order.restaurantId);
  const refundCheck = store.calculateEstimatedRefund(order.id);

  // Stepper definition
  const steps = [
    { key: 'pending', label: 'Order Pending', desc: 'Received by kitchen pass' },
    { key: 'accepted', label: 'Order Accepted', desc: 'Confirmed by restaurant team' },
    { key: 'preparing', label: 'Preparing Food', desc: 'Chef cooking fresh in kitchen' },
    { 
      key: 'ready', 
      label: order.orderType === 'takeaway' ? 'Ready for Collection' : 'Ready to Serve', 
      desc: order.orderType === 'takeaway' ? 'Parcel ready at takeaway counter' : 'Plated and heading to table' 
    },
    { 
      key: 'served', 
      label: order.orderType === 'takeaway' ? 'Collected' : 'Served at Table', 
      desc: 'Enjoy your meal!' 
    },
  ];

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'served':
      case 'collected': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  const handleConfirmCancel = () => {
    const res = store.cancelOrderWithRefund(order.id, cancelReason);
    if (res.success) {
      setCancelMessage(res.message);
      setShowCancelConfirm(false);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Live Order Tracking
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs font-mono font-medium text-stone-600">{order.orderNumber}</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">{restaurant?.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {cancelMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium leading-relaxed">
              {cancelMessage}
            </div>
          )}

          {/* Takeaway Pickup Code Card (Major Requirement) */}
          {order.orderType === 'takeaway' && order.pickupCode && (
            <div className="p-5 rounded-2xl bg-amber-500 text-white text-center shadow-md relative overflow-hidden">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-100">
                Takeaway Pickup Verification Code
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-wider font-mono my-2 text-white">
                {order.pickupCode}
              </div>
              <p className="text-xs text-amber-100 max-w-md mx-auto">
                Show this 6-character code to restaurant staff upon arrival. Staff will verify it on their terminal and hand over your freshly packed parcel.
              </p>
              {order.remainingBalance > 0 && (
                <div className="mt-3 inline-block px-3 py-1 bg-amber-600/60 rounded-full text-[11px] font-semibold text-white">
                  Balance due upon collection: ${order.remainingBalance.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Dine-In Table Banner */}
          {order.orderType === 'dine_in' && order.tableNumber && (
            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-800 font-bold">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>Seated at {order.tableNumber}</span>
              </div>
              <span className="text-stone-500 font-medium">Multi-round tab active</span>
            </div>
          )}

          {/* Order Status Stepper */}
          {order.status !== 'cancelled' ? (
            <div className="space-y-4">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Preparation Progress
              </div>
              <div className="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {steps.map((st, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={st.key} className="relative flex items-start gap-3">
                      <div
                        className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                            : 'bg-white border-stone-300 text-transparent'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <h4 className={`text-xs font-bold ${isCurrent ? 'text-amber-700' : isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                          {st.label}
                        </h4>
                        <p className="text-[11px] text-stone-500">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center text-red-800">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-1" />
              <div className="text-sm font-bold">Order Cancelled</div>
              <p className="text-xs text-red-600 mt-1">This order was cancelled and eligible refunds were credited.</p>
            </div>
          )}

          {/* Ordered Food Items */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Itemized Order Summary
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {order.items.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-800">{it.quantity}x {it.itemName}</span>
                    {it.specialInstructions && (
                      <p className="text-[11px] text-stone-500 italic">"{it.specialInstructions}"</p>
                    )}
                  </div>
                  <span className="font-mono font-medium text-stone-900">${it.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Deposit Summary */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Total Bill (incl. tax & service)</span>
              <span className="font-bold text-stone-900 font-mono">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-800 font-medium">
              <span>Advance Deposit Paid</span>
              <span className="font-mono">${order.advanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-700 font-bold border-t border-stone-200 pt-1">
              <span>Outstanding Balance Due</span>
              <span className="font-mono">${order.remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Cancellation / Refund Policy Accordion */}
          {order.status !== 'served' && order.status !== 'collected' && order.status !== 'cancelled' && (
            <div className="pt-2 border-t border-stone-200">
              {!showCancelConfirm ? (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-stone-500">
                    Need to modify or cancel?
                  </div>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs font-semibold text-stone-600 hover:text-red-600 underline"
                  >
                    View Cancellation Policy & Refund
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Estimated Refund Calculation
                    </span>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">
                    {refundCheck.reasonMsg}
                  </p>

                  <div className="p-2.5 rounded-lg bg-white border border-red-200 text-xs space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Deposit Paid</span>
                      <span className="font-mono font-medium">${refundCheck.originalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Eligible Refund Rate</span>
                      <span className="font-mono font-bold text-red-700">{refundCheck.refundPercent}%</span>
                    </div>
                    <div className="flex justify-between text-red-900 font-bold border-t border-stone-100 pt-1">
                      <span>Net Refund Amount</span>
                      <span className="font-mono">${refundCheck.refundAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">Reason for cancellation:</label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
                    >
                      Keep Order
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Confirm Cancel & Refund (${refundCheck.refundAmount.toFixed(2)})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={() => onOpenInvoice(order.id)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <Receipt className="w-4 h-4" />
            <span>Digital Invoice / Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
