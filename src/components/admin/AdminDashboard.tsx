import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  QrCode, 
  CalendarClock, 
  Settings, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  PauseCircle, 
  PlayCircle, 
  ShieldCheck, 
  DollarSign, 
  Receipt,
  UserCheck,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { store } from '../../lib/store';
import { 
  Order, 
  OrderStatus, 
  MenuItem, 
  RestaurantTable, 
  TableStatus, 
  PaymentMethod,
  Profile
} from '../../types';

interface AdminDashboardProps {
  currentUser: Profile;
  onViewInvoice: (orderId?: string, sessionId?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onViewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'pickup' | 'menu' | 'tables' | 'sessions' | 'reservations' | 'settings'>('overview');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [pickupVerifyResult, setPickupVerifyResult] = useState<{
    success: boolean;
    order?: Order;
    message: string;
    remainingPaid?: number;
  } | null>(null);

  // Table QR modal state
  const [qrModalTable, setQrModalTable] = useState<RestaurantTable | null>(null);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');

  // Menu item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 15.0,
    categoryId: '',
    isVegetarian: true,
    prepTimeMinutes: 15,
    isAvailable: true,
  });

  // New Table modal state
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    seatingCapacity: 4,
    section: 'Main Dining Hall',
  });

  // Ensure restaurant isolation
  const restaurantId = currentUser.restaurantId || 'rest-bella-vista';
  const restaurant = store.getRestaurantById(restaurantId);
  const settings = store.getRestaurantSettings(restaurantId);
  const analytics = store.getRestaurantAnalytics(restaurantId);
  const orders = store.getOrders(restaurantId);
  const menuItems = store.getMenuItems(restaurantId);
  const categories = store.getMenuCategories(restaurantId);
  const tables = store.getTables(restaurantId);
  const sessions = store.getActiveSession ? tables.map((t) => store.getActiveSession(restaurantId, t.id)).filter(Boolean) : [];
  const reservations = store.getReservations(restaurantId);

  if (!restaurant) {
    return (
      <div className="p-8 text-center text-stone-500">
        Restaurant not found or unauthorized access.
      </div>
    );
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  // Handle Order Status transitions
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    store.updateOrderStatus(orderId, status);
  };

  // Handle Pickup Verification
  const handleVerifyPickup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCodeInput.trim()) return;
    const res = store.verifyPickupCode(restaurantId, pickupCodeInput.trim());
    setPickupVerifyResult(res);
  };

  // Generate Table QR
  const handleOpenTableQr = async (table: RestaurantTable) => {
    setQrModalTable(table);
    // Secure token and simulated table URL
    const payloadUrl = `https://restoflow.app/table?r=${restaurantId}&t=${table.id}`;
    try {
      const url = await QRCode.toDataURL(payloadUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#1c1917', light: '#ffffff' },
      });
      setGeneratedQrDataUrl(url);
    } catch {
      // Fallback
    }
  };

  // Toggle Item Availability
  const handleToggleItemAvail = (itemId: string) => {
    store.toggleItemAvailability(itemId);
  };

  // Save Item (Add or Edit)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      store.updateMenuItem(editingItem.id, itemForm);
    } else {
      store.addMenuItem({
        restaurantId,
        categoryId: itemForm.categoryId || categories[0]?.id || 'cat-general',
        name: itemForm.name,
        description: itemForm.description,
        price: Number(itemForm.price),
        isVegetarian: itemForm.isVegetarian,
        prepTimeMinutes: Number(itemForm.prepTimeMinutes),
        isAvailable: itemForm.isAvailable,
      });
    }
    setShowItemModal(false);
    setEditingItem(null);
  };

  // Save New Table
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    store.addTable({
      restaurantId,
      tableNumber: tableForm.tableNumber || `Table ${tables.length + 1}`,
      seatingCapacity: Number(tableForm.seatingCapacity),
      section: tableForm.section,
    });
    setShowTableModal(false);
    setTableForm({ tableNumber: '', seatingCapacity: 4, section: 'Main Dining Hall' });
  };

  // Toggle "Pause New Orders"
  const handleTogglePauseOrders = () => {
    const nextState = !restaurant.pauseOrders;
    const reason = nextState ? 'Kitchen is currently operating at maximum capacity.' : '';
    store.setRestaurantPauseOrders(restaurantId, nextState, reason);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col justify-between shrink-0">
        <div>
          {/* Restaurant identity header */}
          <div className="p-5 border-b border-stone-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
              Restaurant Console
            </span>
            <h2 className="text-sm font-extrabold text-stone-900 truncate mt-0.5">{restaurant.name}</h2>
            <div className="text-[11px] text-stone-500 truncate">{restaurant.city}</div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & Revenue</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Order Board</span>
              </div>
              {analytics.pendingOrders > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {analytics.pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pickup')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'pickup'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Pickup Verification</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'menu'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu Management</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'tables'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Tables & QR Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'reservations'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              <span>Advance Reservations</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Policies & Settings</span>
            </button>
          </nav>
        </div>

        {/* Master Availability Toggle (Prompt Requirement §12) */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/70">
          <div className="text-[11px] font-semibold text-stone-600 mb-2">Incoming Order Availability</div>
          <button
            onClick={handleTogglePauseOrders}
            className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs ${
              restaurant.pauseOrders
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {restaurant.pauseOrders ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Resume Orders</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Pause New Orders</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-stone-400 text-center mt-1.5">
            {restaurant.pauseOrders ? 'Orders are currently stopped.' : 'Accepting dine-in and takeaways.'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <span>{restaurant.name}</span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500 capitalize">{activeTab}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight capitalize mt-0.5">
              {activeTab === 'overview' && 'Operations & Financial Intelligence'}
              {activeTab === 'orders' && 'Real-Time Kitchen & Order Board'}
              {activeTab === 'pickup' && 'Takeaway Parcel Verification'}
              {activeTab === 'menu' && 'Menu Catalog & Availability Control'}
              {activeTab === 'tables' && 'Table Fleet & QR Generation'}
              {activeTab === 'reservations' && 'Advance Dine-Later Schedule'}
              {activeTab === 'settings' && 'Payment Rules & Cancellation Thresholds'}
            </h1>
          </div>

          {/* Quick tab switcher for mobile */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-1 text-xs">
            {(['overview', 'orders', 'pickup', 'menu', 'tables', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap ${
                  activeTab === tab ? 'bg-amber-600 text-white' : 'bg-white text-stone-600 border border-stone-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 1. OVERVIEW & ANALYTICS TAB (Required §9 and §16: 10 KPI Cards) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 10 Required KPI Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Total Orders Today</span>
                <div className="text-2xl font-extrabold text-stone-900 tabular-nums mt-1">{analytics.totalOrdersToday}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">All dining types</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Completed Orders</span>
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">{analytics.completedOrders}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Served & Collected</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-700 uppercase">Pending Orders</span>
                <div className="text-2xl font-extrabold text-amber-700 tabular-nums mt-1">{analytics.pendingOrders}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Awaiting kitchen accept</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-blue-700 uppercase">Preparing Orders</span>
                <div className="text-2xl font-extrabold text-blue-700 tabular-nums mt-1">{analytics.preparingOrders}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Active on pass</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-purple-700 uppercase">Ready Orders</span>
                <div className="text-2xl font-extrabold text-purple-700 tabular-nums mt-1">{analytics.readyOrders}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Ready for pickup/serve</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-500 uppercase">Cancelled Orders</span>
                <div className="text-2xl font-extrabold text-stone-600 tabular-nums mt-1">{analytics.cancelledOrders}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Refunded per policy</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-stone-700 uppercase">Gross Order Value</span>
                <div className="text-2xl font-extrabold text-stone-900 tabular-nums mt-1 font-mono">${analytics.grossOrderValue.toFixed(2)}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Gross GMV today</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase">Payments Collected</span>
                <div className="text-2xl font-extrabold text-emerald-800 tabular-nums mt-1 font-mono">${analytics.paymentsCollected.toFixed(2)}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Deposits & settlements</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">Outstanding Balance</span>
                <div className="text-2xl font-extrabold text-amber-800 tabular-nums mt-1 font-mono">${analytics.outstandingPayments.toFixed(2)}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Due upon arrival</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-300 bg-amber-50/50 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-900 uppercase">Net Revenue</span>
                <div className="text-2xl font-extrabold text-amber-900 tabular-nums mt-1 font-mono">${analytics.netRevenue.toFixed(2)}</div>
                <div className="text-[10px] text-amber-700 mt-0.5">Collected minus refunds</div>
              </div>

            </div>

            {/* Ordering Methods & Top Food Items */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Channel Distribution */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-stone-200 space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Orders by Service Channel
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-stone-700 mb-1">
                      <span>Dine-In QR Orders</span>
                      <span className="font-mono">{analytics.breakdown.dineIn} orders</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${orders.length ? (analytics.breakdown.dineIn / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-stone-700 mb-1">
                      <span>Takeaway / Parcel</span>
                      <span className="font-mono">{analytics.breakdown.takeaway} orders</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${orders.length ? (analytics.breakdown.takeaway / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-stone-700 mb-1">
                      <span>Order Now, Dine Later</span>
                      <span className="font-mono">{analytics.breakdown.dineLater} orders</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${orders.length ? (analytics.breakdown.dineLater / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  Refunds issued to date: <strong className="text-stone-800 font-mono">${analytics.refundsIssued.toFixed(2)}</strong>
                </div>
              </div>

              {/* Popular Menu Items */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-stone-200 space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Top Performing Menu Items
                </h3>

                {analytics.popularItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    No order data recorded yet today.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {analytics.popularItems.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-stone-900">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-stone-500">{item.count} sold</span>
                          <span className="font-bold text-stone-900">${item.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 2. ORDER BOARD TAB (Required §9) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-stone-200 text-xs">
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  orderFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Orders ({orders.length})
              </button>
              {(['pending', 'accepted', 'preparing', 'ready', 'served', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                    orderFilter === st ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {st} ({orders.filter((o) => o.status === st).length})
                </button>
              ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-400 text-xs">
                No orders matching filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4 hover:border-amber-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-stone-900">{ord.orderNumber}</span>
                          <span className="text-stone-300">·</span>
                          <span className="text-xs font-bold text-stone-700 capitalize">{ord.customerName}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ord.customerPhone}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-stone-100 text-stone-800">
                          {ord.status.replace('_', ' ')}
                        </span>
                        <div className="text-[11px] font-bold text-amber-700 uppercase mt-1">
                          {ord.orderType.replace('_', ' ')} {ord.tableNumber ? `(${ord.tableNumber})` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Takeaway pickup code pill */}
                    {ord.orderType === 'takeaway' && ord.pickupCode && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                        <span>Pickup Verification Code:</span>
                        <span className="font-mono font-extrabold text-sm text-amber-700">{ord.pickupCode}</span>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-1 text-xs">
                      {ord.items.map((it) => (
                        <div key={it.id} className="flex justify-between text-stone-800">
                          <span>{it.quantity}x {it.itemName}</span>
                          <span className="font-mono font-medium">${it.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                      {ord.notes && (
                        <p className="text-[11px] text-stone-500 italic pt-1">Note: "{ord.notes}"</p>
                      )}
                    </div>

                    {/* Financials */}
                    <div className="p-2.5 rounded-lg bg-stone-50 text-xs flex items-center justify-between font-mono">
                      <span className="text-stone-500">Total: <strong className="text-stone-900">${ord.totalAmount.toFixed(2)}</strong></span>
                      <span className="text-stone-500">Advance: <strong className="text-emerald-700">${ord.advanceAmount.toFixed(2)}</strong></span>
                      {ord.remainingBalance > 0 ? (
                        <span className="text-amber-800 font-bold">Due: ${ord.remainingBalance.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Paid</span>
                      )}
                    </div>

                    {/* Operational Action Buttons (Required §9) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                      <button
                        onClick={() => onViewInvoice(ord.id)}
                        className="text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'accepted')}
                            className="px-3 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                          >
                            Accept Order
                          </button>
                        )}

                        {ord.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                            className="px-3 py-1.5 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs"
                          >
                            Start Preparing
                          </button>
                        )}

                        {ord.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                            className="px-3 py-1.5 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs"
                          >
                            Mark Ready
                          </button>
                        )}

                        {ord.status === 'ready' && ord.orderType !== 'takeaway' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'served')}
                            className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                          >
                            Mark Served
                          </button>
                        )}

                        {ord.status === 'ready' && ord.orderType === 'takeaway' && (
                          <button
                            onClick={() => {
                              setActiveTab('pickup');
                              setPickupCodeInput(ord.pickupCode || '');
                            }}
                            className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                          >
                            Verify & Collect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. PICKUP VERIFICATION TAB (Required §8: Takeaway pickup code validation) */}
        {activeTab === 'pickup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Staff Takeaway Code Terminal
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                When a customer arrives at the counter, enter their 6-character code below to validate order authenticity, collect any remaining 20% balance, and confirm parcel handover.
              </p>

              <form onSubmit={handleVerifyPickup} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char code (e.g. TA892X)"
                  className="flex-1 px-4 py-2.5 text-base font-mono font-bold uppercase tracking-wider border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
                >
                  Verify Code
                </button>
              </form>
            </div>

            {/* Verification Result Preview */}
            {pickupVerifyResult && (
              <div
                className={`p-6 rounded-2xl border ${
                  pickupVerifyResult.success
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-red-50 border-red-300 text-red-900'
                } space-y-4`}
              >
                <div className="flex items-center gap-2">
                  {pickupVerifyResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <h4 className="text-sm font-bold">{pickupVerifyResult.message}</h4>
                </div>

                {pickupVerifyResult.order && (
                  <div className="p-4 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 space-y-2">
                    <div className="flex justify-between font-bold border-b border-stone-100 pb-2">
                      <span>Customer: {pickupVerifyResult.order.customerName}</span>
                      <span className="font-mono">{pickupVerifyResult.order.orderNumber}</span>
                    </div>

                    <div className="space-y-1">
                      {pickupVerifyResult.order.items.map((it) => (
                        <div key={it.id} className="flex justify-between">
                          <span>{it.quantity}x {it.itemName}</span>
                          <span className="font-mono">${it.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex justify-between font-mono">
                      <span>Total: ${pickupVerifyResult.order.totalAmount.toFixed(2)}</span>
                      <span className="text-emerald-700 font-bold">Status: Collected & Handed Over</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. MENU MANAGEMENT TAB (Required §10) */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Update prices, descriptions, and toggle item availability. Sold out items instantly vanish or display as disabled to ordering customers.
              </p>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({
                    name: '',
                    description: '',
                    price: 18.0,
                    categoryId: categories[0]?.id || '',
                    isVegetarian: true,
                    prepTimeMinutes: 15,
                    isAvailable: true,
                  });
                  setShowItemModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                    !item.isAvailable ? 'border-red-200 bg-red-50/20' : 'border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.isVegetarian ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <h4 className="text-xs font-bold text-stone-900">{item.name}</h4>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-stone-900">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                    <div className="text-[10px] text-stone-400 mt-2">Prep time: ~{item.prepTimeMinutes} mins</div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    {/* Availability toggle switch */}
                    <button
                      onClick={() => handleToggleItemAvail(item.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Sold Out / Disabled'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm({
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            categoryId: item.categoryId,
                            isVegetarian: item.isVegetarian,
                            prepTimeMinutes: item.prepTimeMinutes,
                            isAvailable: item.isAvailable,
                          });
                          setShowItemModal(true);
                        }}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${item.name}?`)) store.deleteMenuItem(item.id);
                        }}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TABLES & QR GENERATION TAB (Required §11) */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Every table possesses an auto-generated unique cryptographic QR code containing the restaurant and table ID.
              </p>
              <button
                onClick={() => setShowTableModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Table</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((tbl) => (
                <div
                  key={tbl.id}
                  className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-900">{tbl.tableNumber}</h4>
                      <p className="text-xs text-stone-500">{tbl.seatingCapacity} Seats · {tbl.section}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      tbl.status === 'occupied'
                        ? 'bg-amber-100 text-amber-800'
                        : tbl.status === 'reserved'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tbl.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenTableQr(tbl)}
                      className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View & Print QR</span>
                    </button>

                    <select
                      value={tbl.status}
                      onChange={(e) => store.setTableStatus(tbl.id, e.target.value as TableStatus)}
                      className="text-xs border border-stone-200 rounded-md px-2 py-1 bg-white text-stone-700"
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="occupied">Occupied</option>
                      <option value="cleaning">Cleaning</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ADVANCE RESERVATIONS TAB (Required §7) */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <p className="text-xs text-stone-500">
              Advance dine-later bookings pre-loaded with customer food orders for rapid 1-minute seated serving.
            </p>

            {reservations.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 text-stone-400 text-xs">
                No advance bookings scheduled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservations.map((res) => (
                  <div key={res.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-amber-800">{res.reservationCode}</span>
                        <h4 className="text-sm font-bold text-stone-900 mt-0.5">{res.customerName}</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {res.status}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <div>Date & Arrival: <strong>{res.reservationDate} at {new Date(res.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                      <div>Table: <strong>{res.tableNumber || 'Auto-assign on arrival'}</strong> ({res.guestCount} guests)</div>
                      <div>Contact: {res.customerPhone}</div>
                      {res.specialNotes && <div className="italic text-stone-500">Note: "{res.specialNotes}"</div>}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                      <span>Deposit Paid: <strong>${res.advanceAmount.toFixed(2)}</strong></span>
                      {res.orderId && (
                        <button
                          onClick={() => onViewInvoice(res.orderId)}
                          className="text-amber-700 font-bold hover:underline"
                        >
                          View Pre-Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. SETTINGS & PAYMENT POLICIES TAB (Required §13 and §14) */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Configurable Advance Payment Policies
              </h3>
              <p className="text-xs text-stone-500">
                Specify what percentage of total food orders must be collected as advance deposit before kitchen preparation begins.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Dine-In Advance %</label>
                  <input
                    type="number"
                    value={settings.dineInAdvancePercent}
                    onChange={(e) => store.updateRestaurantSettings(restaurantId, { dineInAdvancePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">Default 30%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Dine-Later Advance %</label>
                  <input
                    type="number"
                    value={settings.dineLaterAdvancePercent}
                    onChange={(e) => store.updateRestaurantSettings(restaurantId, { dineLaterAdvancePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">Default 30%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Takeaway Advance %</label>
                  <input
                    type="number"
                    value={settings.takeawayAdvancePercent}
                    onChange={(e) => store.updateRestaurantSettings(restaurantId, { takeawayAdvancePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">Default 80%</span>
                </div>
              </div>
            </div>

            {/* Cancellation and Refund Rules */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Configurable Cancellation & Refund Tiers
              </h3>
              <div className="divide-y divide-stone-100 text-xs text-stone-700">
                <div className="py-2.5 flex justify-between">
                  <span>Cancellation $\ge$ 2.0 hours before schedule</span>
                  <span className="font-mono font-bold text-emerald-700">90% Refund</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>Cancellation between 1.5 and 2.0 hours</span>
                  <span className="font-mono font-bold text-amber-700">60% Refund</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>Cancellation between 30 and 90 minutes</span>
                  <span className="font-mono font-bold text-orange-700">25% Refund</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>Cancellation under 30 minutes</span>
                  <span className="font-mono font-bold text-red-700">No Refund (0%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* QR Code Printable Card Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-stone-200 shadow-2xl p-6 text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">{restaurant.name}</span>
              <button onClick={() => setQrModalTable(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-dashed border-stone-300 inline-block mx-auto">
              {generatedQrDataUrl ? (
                <img src={generatedQrDataUrl} alt="Table QR" className="w-56 h-56 mx-auto" />
              ) : (
                <div className="w-56 h-56 bg-stone-100 animate-pulse" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-stone-900">{qrModalTable.tableNumber}</h3>
              <p className="text-xs text-stone-500 mt-0.5">Scan to view live menu & order directly at table</p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Standee Card</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-900">
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={itemForm.prepTimeMinutes}
                    onChange={(e) => setItemForm({ ...itemForm, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isVegetarian}
                    onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <span>Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded-sm"
                  />
                  <span>Available Now</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-900">Add New Dining Table</h3>
              <button onClick={() => setShowTableModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Table Label / Number</label>
                <input
                  type="text"
                  required
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  placeholder="e.g. Table 07"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={tableForm.seatingCapacity}
                  onChange={(e) => setTableForm({ ...tableForm, seatingCapacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Section</label>
                <input
                  type="text"
                  value={tableForm.section}
                  onChange={(e) => setTableForm({ ...tableForm, section: e.target.value })}
                  placeholder="Main Dining, Patio, Garden, Cellar"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Add Table & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
