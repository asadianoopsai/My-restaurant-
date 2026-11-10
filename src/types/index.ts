export type UserRole = 'customer' | 'restaurant_owner' | 'restaurant_staff' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  restaurantId?: string; // For restaurant_owner and restaurant_staff
}

export type RestaurantStatus = 'pending' | 'active' | 'paused' | 'suspended';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  cuisineType: string[];
  address: string;
  city: string;
  phone: string;
  email: string;
  gstNumber?: string;
  logoUrl?: string;
  heroImageUrl: string;
  status: RestaurantStatus;
  pauseOrders: boolean;
  pauseReason?: string;
  ownerId: string;
  rating: number;
  reviewCount: number;
  averageCostForTwo: number;
}

export interface CancellationRule {
  hoursBefore: number;
  refundPercent: number;
}

export interface RestaurantSettings {
  id: string;
  restaurantId: string;
  currency: string;
  currencySymbol: string;
  taxRate: number; // percentage, e.g. 8.25
  serviceChargeRate: number; // percentage, e.g. 5.0
  dineInAdvancePercent: number; // e.g. 30
  dineLaterAdvancePercent: number; // e.g. 30
  takeawayAdvancePercent: number; // e.g. 80
  targetPrepTimeMinutes: number; // e.g. 20
  dineLaterTargetServingMinutes: number; // e.g. 1
  enableUpi: boolean;
  enableCards: boolean;
  enableCash: boolean;
  cancellationRules: CancellationRule[];
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  calories?: number;
  prepTimeMinutes: number;
  isAvailable: boolean;
  imageUrl?: string;
  sortOrder: number;
}

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'unavailable';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  tableNumber: string;
  seatingCapacity: number;
  section: string;
  status: TableStatus;
  activeSessionId?: string;
}

export interface TableQRCode {
  id: string;
  restaurantId: string;
  tableId: string;
  secureToken: string;
  qrPayloadUrl: string;
  scanCount: number;
}

export type SessionStatus = 'active' | 'bill_requested' | 'settled' | 'cancelled';

export interface DiningSession {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerId?: string;
  customerName: string;
  status: SessionStatus;
  orderIds: string[];
  totalFoodAmount: number;
  totalPaidAmount: number;
  outstandingBalance: number;
  openedAt: string;
  closedAt?: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  reservationCode: string;
  restaurantId: string;
  tableId?: string;
  tableNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: string; // YYYY-MM-DD
  expectedArrivalTime: string; // ISO string
  status: ReservationStatus;
  specialNotes?: string;
  orderId?: string;
  advanceAmount: number;
  createdAt: string;
}

export type OrderType = 'dine_in' | 'dine_later' | 'takeaway';
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'collected' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  specialInstructions?: string;
  isVegetarian?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  status: OrderStatus;
  tableId?: string;
  tableNumber?: string;
  sessionId?: string;
  reservationId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  totalAmount: number;
  advanceAmount: number;
  remainingBalance: number;
  pickupCode?: string;
  pickupTime?: string;
  targetReadyTime?: string;
  actualReadyTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PickupCodeStatus = 'valid' | 'verified_collected' | 'expired' | 'cancelled';

export interface PickupCode {
  id: string;
  restaurantId: string;
  orderId: string;
  pickupCode: string;
  status: PickupCodeStatus;
  expiresAt: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
  customerName: string;
  totalAmount: number;
  remainingBalance: number;
}

export type PaymentMethod = 'upi' | 'card' | 'cash_counter';
export type PaymentType = 'advance_deposit' | 'final_settlement' | 'full_payment';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  restaurantId: string;
  orderId?: string;
  sessionId?: string;
  customerId?: string;
  customerName: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  restaurantId: string;
  orderId: string;
  paymentId?: string;
  customerId?: string;
  customerName: string;
  originalPaidAmount: number;
  refundPercentage: number;
  refundAmount: number;
  reason: string;
  status: 'processed' | 'pending' | 'failed';
  processedAt: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantGst?: string;
  orderId?: string;
  sessionId?: string;
  customerName: string;
  customerPhone?: string;
  serviceType: OrderType;
  tableNumber?: string;
  pickupCode?: string;
  itemizedSummary: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export interface Notification {
  id: string;
  restaurantId?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'new_order' | 'order_status' | 'reservation_request' | 'session_bill' | 'refund_processed';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}
