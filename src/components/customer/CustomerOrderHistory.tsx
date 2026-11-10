import React from 'react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Receipt,
  QrCode,
  CalendarClock
} from 'lucide-react';
import { store } from '../../lib/store';
import { Order } from '../../types';

interface CustomerOrderHistoryProps {
  onTrackOrder: (orderId: string) => void;
  onViewInvoice: (orderId: string) => void;
  onExplore: () => void;
}

export const CustomerOrderHistory: React.FC<CustomerOrderHistoryProps> = ({
  onTrackOrder,
  onViewInvoice,
  onExplore,
}) => {
  const currentUser = store.getCurrentUser();
  const orders = store.getCustomerOrders(currentUser.id);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-stone-100 text-stone-700 border-stone-300';
      case 'accepted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'ready': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'served':
      case 'collected': return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Your Orders & Tabs</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Track active dining rounds, takeaway collection codes, and digital tax receipts.
          </p>
        </div>

        <button
          onClick={onExplore}
          className="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
        >
          Explore Restaurants
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 space-y-3">
          <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-800">No Orders Placed Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Scan a table QR code or order ahead for takeaway pickup to see live tracking here.
          </p>
          <button
            onClick={onExplore}
            className="mt-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
          >
            Start Ordering
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const rest = store.getRestaurantById(order.restaurantId);
            return (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:border-amber-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900">{rest?.name || 'Restaurant'}</h3>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs font-mono text-stone-500">{order.orderNumber}</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-stone-800 uppercase px-2 py-0.5 bg-stone-100 rounded-md">
                      {order.orderType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Specific order tags */}
                {order.orderType === 'takeaway' && order.pickupCode && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <span className="font-medium">Takeaway Pickup Code:</span>
                    <span className="font-mono font-extrabold text-sm text-amber-700">{order.pickupCode}</span>
                  </div>
                )}

                {order.orderType === 'dine_in' && order.tableNumber && (
                  <div className="text-xs text-stone-600 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dine-In Session at <strong>{order.tableNumber}</strong></span>
                  </div>
                )}

                {/* Items summary */}
                <div className="text-xs text-stone-600">
                  {order.items.map((it) => `${it.quantity}x ${it.itemName}`).join(' · ')}
                </div>

                {/* Financials & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-stone-500">Total: <strong className="text-stone-900">${order.totalAmount.toFixed(2)}</strong></span>
                    <span className="text-stone-500">Paid: <strong className="text-emerald-700">${order.advanceAmount.toFixed(2)}</strong></span>
                    {order.remainingBalance > 0 && (
                      <span className="text-amber-800 font-bold">Due: ${order.remainingBalance.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewInvoice(order.id)}
                      className="px-3 py-1.5 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                    <button
                      onClick={() => onTrackOrder(order.id)}
                      className="px-3 py-1.5 text-white bg-amber-600 hover:bg-amber-700 rounded-lg font-bold flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>Track Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
