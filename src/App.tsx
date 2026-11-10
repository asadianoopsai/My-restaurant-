import React, { useState, useEffect } from 'react';
import { useStoreState } from './lib/useStore';
import { store } from './lib/store';
import { OrderType, MenuItem } from './types';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { AdvanceReservationView } from './components/customer/AdvanceReservationView';
import { CustomerOrderHistory } from './components/customer/CustomerOrderHistory';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { DineInQRScannerModal } from './components/DineInQRScannerModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { LiveOrderTrackerModal } from './components/LiveOrderTrackerModal';
import { DigitalInvoiceModal } from './components/DigitalInvoiceModal';
import { RegisterRestaurantModal } from './components/RegisterRestaurantModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { 
  Bell, 
  CheckCircle2, 
  QrCode, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  Store,
  ChefHat
} from 'lucide-react';

export default function App() {
  const { currentUser } = useStoreState();

  // Navigation & Flows
  const [currentView, setCurrentView] = useState<string>('home');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [tableId, setTableId] = useState<string | undefined>();
  const [tableNumber, setTableNumber] = useState<string | undefined>();

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Tracking & Invoice Modals
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [activeInvoiceOrderId, setActiveInvoiceOrderId] = useState<string | null>(null);
  const [activeInvoiceSessionId, setActiveInvoiceSessionId] = useState<string | null>(null);

  // Live Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string } | null>(null);

  // Cart handlers
  const handleAddToCart = (item: MenuItem) => {
    // If no restaurant selected, default to item's restaurant
    if (!selectedRestaurantId) {
      setSelectedRestaurantId(item.restaurantId);
    }
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) => ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // QR Table Selection (Handles Table 05 Scenario)
  const handleTableSelected = (restId: string, tblId: string) => {
    const table = store.getTableById(tblId);
    setSelectedRestaurantId(restId);
    setTableId(tblId);
    setTableNumber(table?.tableNumber || 'Table');
    setOrderType('dine_in');

    // Create or resume dining session
    store.createOrResumeSession(restId, tblId, table?.tableNumber || 'Table', currentUser.fullName);

    setCurrentView('menu');
    setToastMessage({
      title: 'Table Connected',
      message: `Opened session for ${table?.tableNumber} at ${store.getRestaurantById(restId)?.name}.`,
    });
  };

  // Flow cards from Landing Page
  const handleSelectLandingFlow = (flow: 'dine_in' | 'dine_later' | 'takeaway') => {
    setOrderType(flow);
    if (flow === 'dine_in') {
      setIsQRScannerOpen(true);
    } else if (flow === 'dine_later') {
      setCurrentView('dine_later');
    } else if (flow === 'takeaway') {
      setCurrentView('takeaway');
    }
  };

  // Order Placement Success
  const handleOrderSuccess = (orderId: string, orderNumber: string, pickupCode?: string) => {
    setActiveTrackingOrderId(orderId);
    setToastMessage({
      title: 'Order Confirmed!',
      message: pickupCode 
        ? `Order #${orderNumber} placed! Your takeaway pickup code is ${pickupCode}.`
        : `Order #${orderNumber} placed and sent to kitchen pass!`,
    });
  };

  // Reservation Success
  const handleReservationSuccess = (reservationId: string, orderId?: string) => {
    if (orderId) {
      setActiveTrackingOrderId(orderId);
    }
    setToastMessage({
      title: 'Table Reserved!',
      message: 'Advance booking confirmed with 1-minute target serving preparation.',
    });
    setCurrentView('my_orders');
  };

  // Notification Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const activeRestaurant = selectedRestaurantId ? store.getRestaurantById(selectedRestaurantId) : undefined;
  const activeSession = selectedRestaurantId && tableId ? store.getActiveSession(selectedRestaurantId, tableId) : undefined;

  // Determine top-level view depending on User Role
  const isStaffOrOwner = currentUser.role === 'restaurant_owner' || currentUser.role === 'restaurant_staff';
  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 max-w-sm bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white">{toastMessage.title}</h4>
            <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">{toastMessage.message}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        cartCount={cartItems.reduce((acc, c) => acc + c.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'dine_in') {
            setIsQRScannerOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
      />

      {/* Quick View Role Banner for Testing */}
      <div className="bg-stone-900 text-stone-300 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Active Portal Mode:</span>
          <span className="text-amber-400 font-bold capitalize">
            {currentUser.role.replace('_', ' ')} ({currentUser.fullName})
          </span>
          {currentUser.restaurantId && (
            <span className="text-stone-400 hidden sm:inline">
              · {store.getRestaurantById(currentUser.restaurantId)?.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTableSelected('rest-bella-vista', 'tab-bv-05')}
            className="text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Simulate Table 05 Scan</span>
          </button>

          <button
            onClick={() => setIsRoleSwitcherOpen(true)}
            className="text-[11px] font-semibold text-stone-300 hover:text-white underline"
          >
            Switch Role / Persona
          </button>
        </div>
      </div>

      {/* View Routing */}
      <div className="flex-1">
        {/* If Super Admin, show Super Admin Dashboard */}
        {isSuperAdmin ? (
          <SuperAdminDashboard
            onSwitchTenant={(restId) => {
              store.loginAsRole('restaurant_owner', restId);
            }}
          />
        ) : isStaffOrOwner ? (
          /* If Owner or Staff, show Admin Dashboard */
          <AdminDashboard
            currentUser={currentUser}
            onViewInvoice={(ordId, sessId) => {
              setActiveInvoiceOrderId(ordId || null);
              setActiveInvoiceSessionId(sessId || null);
            }}
          />
        ) : (
          /* Customer Views */
          <>
            {currentView === 'home' && (
              <>
                <LandingHero
                  onSelectFlow={handleSelectLandingFlow}
                  onOpenRegisterRestaurant={() => setIsRegisterModalOpen(true)}
                />
                <CustomerPortal
                  selectedRestaurantId={selectedRestaurantId}
                  orderType={orderType}
                  tableId={tableId}
                  tableNumber={tableNumber}
                  onSelectRestaurant={(id) => {
                    setSelectedRestaurantId(id);
                    if (id) setCurrentView('menu');
                  }}
                  onAddToCart={handleAddToCart}
                  cartItems={cartItems}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenQRScanner={() => setIsQRScannerOpen(true)}
                  onOpenAdvanceReservation={() => setCurrentView('dine_later')}
                  onOpenTakeaway={() => {
                    setOrderType('takeaway');
                    setCurrentView('takeaway');
                  }}
                  onViewInvoice={(ordId, sessId) => {
                    setActiveInvoiceOrderId(ordId || null);
                    setActiveInvoiceSessionId(sessId || null);
                  }}
                />
              </>
            )}

            {currentView === 'menu' && (
              <CustomerPortal
                selectedRestaurantId={selectedRestaurantId || 'rest-bella-vista'}
                orderType={orderType}
                tableId={tableId}
                tableNumber={tableNumber}
                onSelectRestaurant={(id) => setSelectedRestaurantId(id)}
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
                onOpenAdvanceReservation={() => setCurrentView('dine_later')}
                onOpenTakeaway={() => {
                  setOrderType('takeaway');
                  setCurrentView('takeaway');
                }}
                onViewInvoice={(ordId, sessId) => {
                  setActiveInvoiceOrderId(ordId || null);
                  setActiveInvoiceSessionId(sessId || null);
                }}
              />
            )}

            {currentView === 'dine_later' && (
              <AdvanceReservationView
                onSuccess={handleReservationSuccess}
                onCancel={() => setCurrentView('home')}
              />
            )}

            {currentView === 'takeaway' && (
              <CustomerPortal
                selectedRestaurantId={selectedRestaurantId || 'rest-bella-vista'}
                orderType="takeaway"
                tableId={undefined}
                tableNumber={undefined}
                onSelectRestaurant={(id) => setSelectedRestaurantId(id)}
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
                onOpenAdvanceReservation={() => setCurrentView('dine_later')}
                onOpenTakeaway={() => {}}
                onViewInvoice={(ordId, sessId) => {
                  setActiveInvoiceOrderId(ordId || null);
                  setActiveInvoiceSessionId(sessId || null);
                }}
              />
            )}

            {currentView === 'my_orders' && (
              <CustomerOrderHistory
                onTrackOrder={(orderId) => setActiveTrackingOrderId(orderId)}
                onViewInvoice={(orderId) => setActiveInvoiceOrderId(orderId)}
                onExplore={() => setCurrentView('home')}
              />
            )}
          </>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        restaurant={activeRestaurant || store.getRestaurantById('rest-bella-vista')}
        orderType={orderType}
        tableNumber={tableNumber}
        tableId={tableId}
        sessionId={activeSession?.id}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Table QR Scanner Modal */}
      <DineInQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onTableSelected={handleTableSelected}
      />

      {/* Role Switcher & Persona Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectTable05={() => handleTableSelected('rest-bella-vista', 'tab-bv-05')}
      />

      {/* Live Order Tracker Modal */}
      <LiveOrderTrackerModal
        isOpen={Boolean(activeTrackingOrderId)}
        onClose={() => setActiveTrackingOrderId(null)}
        orderId={activeTrackingOrderId}
        onOpenInvoice={(ordId) => {
          setActiveTrackingOrderId(null);
          setActiveInvoiceOrderId(ordId);
        }}
      />

      {/* Digital Tax Invoice Modal */}
      <DigitalInvoiceModal
        isOpen={Boolean(activeInvoiceOrderId || activeInvoiceSessionId)}
        onClose={() => {
          setActiveInvoiceOrderId(null);
          setActiveInvoiceSessionId(null);
        }}
        orderId={activeInvoiceOrderId}
        sessionId={activeInvoiceSessionId}
      />

      {/* Register Restaurant Modal */}
      <RegisterRestaurantModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(restId) => {
          store.loginAsRole('restaurant_owner', restId);
          setToastMessage({
            title: 'Welcome to RestoFlow!',
            message: 'Switched to your new restaurant management console.',
          });
        }}
      />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-stone-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">RestoFlow SaaS</span>
            <span aria-hidden="true">·</span>
            <span>Smart Restaurant Ordering, Reservation & Kitchen Management</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRoleSwitcherOpen(true)}
              className="hover:text-stone-900 transition-colors"
            >
              Demo Personas
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="hover:text-stone-900 transition-colors"
            >
              Partner Registration
            </button>
            <span aria-hidden="true">·</span>
            <span>&copy; {new Date().getFullYear()} RestoFlow Inc.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
