import {
  Profile,
  Restaurant,
  RestaurantSettings,
  MenuCategory,
  MenuItem,
  RestaurantTable,
  DiningSession,
  Reservation,
  Order,
  OrderItem,
  PickupCode,
  Payment,
  Refund,
  Invoice,
  Notification,
  OrderStatus,
  TableStatus,
  OrderType,
  PaymentMethod,
} from '../types';

import {
  SEED_PROFILES,
  SEED_RESTAURANTS,
  SEED_SETTINGS,
  SEED_CATEGORIES,
  SEED_MENU_ITEMS,
  SEED_TABLES,
  SEED_ORDERS,
  SEED_SESSIONS,
  SEED_PICKUP_CODES,
  SEED_RESERVATIONS,
  SEED_PAYMENTS,
  SEED_NOTIFICATIONS,
} from './seedData';

const STORAGE_KEYS = {
  CURRENT_USER: 'restoflow_current_user',
  PROFILES: 'restoflow_profiles',
  RESTAURANTS: 'restoflow_restaurants',
  SETTINGS: 'restoflow_settings',
  CATEGORIES: 'restoflow_categories',
  MENU_ITEMS: 'restoflow_menu_items',
  TABLES: 'restoflow_tables',
  ORDERS: 'restoflow_orders',
  SESSIONS: 'restoflow_sessions',
  PICKUP_CODES: 'restoflow_pickup_codes',
  RESERVATIONS: 'restoflow_reservations',
  PAYMENTS: 'restoflow_payments',
  REFUNDS: 'restoflow_refunds',
  INVOICES: 'restoflow_invoices',
  NOTIFICATIONS: 'restoflow_notifications',
};

class RestaurantStore extends EventTarget {
  private currentUser: Profile;
  private profiles: Profile[] = [];
  private restaurants: Restaurant[] = [];
  private settings: Record<string, RestaurantSettings> = {};
  private categories: MenuCategory[] = [];
  private menuItems: MenuItem[] = [];
  private tables: RestaurantTable[] = [];
  private orders: Order[] = [];
  private sessions: DiningSession[] = [];
  private pickupCodes: PickupCode[] = [];
  private reservations: Reservation[] = [];
  private payments: Payment[] = [];
  private refunds: Refund[] = [];
  private invoices: Invoice[] = [];
  private notifications: Notification[] = [];

  constructor() {
    super();
    this.currentUser = SEED_PROFILES[0]; // Alex Morgan by default
    this.init();
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return fallback;
  }

  private save(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore
    }
  }

  private notify() {
    this.dispatchEvent(new Event('change'));
  }

  public init() {
    this.profiles = this.load(STORAGE_KEYS.PROFILES, SEED_PROFILES);
    this.restaurants = this.load(STORAGE_KEYS.RESTAURANTS, SEED_RESTAURANTS);
    this.settings = this.load(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
    this.categories = this.load(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    this.menuItems = this.load(STORAGE_KEYS.MENU_ITEMS, SEED_MENU_ITEMS);
    this.tables = this.load(STORAGE_KEYS.TABLES, SEED_TABLES);
    this.orders = this.load(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    this.sessions = this.load(STORAGE_KEYS.SESSIONS, SEED_SESSIONS);
    this.pickupCodes = this.load(STORAGE_KEYS.PICKUP_CODES, SEED_PICKUP_CODES);
    this.reservations = this.load(STORAGE_KEYS.RESERVATIONS, SEED_RESERVATIONS);
    this.payments = this.load(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    this.refunds = this.load(STORAGE_KEYS.REFUNDS, []);
    this.invoices = this.load(STORAGE_KEYS.INVOICES, []);
    this.notifications = this.load(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);

    const savedUser = this.load<Profile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (savedUser) {
      this.currentUser = savedUser;
    } else {
      this.currentUser = this.profiles[0];
    }
  }

  public resetAllData() {
    localStorage.clear();
    this.profiles = [...SEED_PROFILES];
    this.restaurants = [...SEED_RESTAURANTS];
    this.settings = { ...SEED_SETTINGS };
    this.categories = [...SEED_CATEGORIES];
    this.menuItems = [...SEED_MENU_ITEMS];
    this.tables = [...SEED_TABLES];
    this.orders = [...SEED_ORDERS];
    this.sessions = [...SEED_SESSIONS];
    this.pickupCodes = [...SEED_PICKUP_CODES];
    this.reservations = [...SEED_RESERVATIONS];
    this.payments = [...SEED_PAYMENTS];
    this.refunds = [];
    this.invoices = [];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.currentUser = this.profiles[0];
    this.persistAll();
    this.notify();
  }

  private persistAll() {
    this.save(STORAGE_KEYS.PROFILES, this.profiles);
    this.save(STORAGE_KEYS.RESTAURANTS, this.restaurants);
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.save(STORAGE_KEYS.CATEGORIES, this.categories);
    this.save(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
    this.save(STORAGE_KEYS.TABLES, this.tables);
    this.save(STORAGE_KEYS.ORDERS, this.orders);
    this.save(STORAGE_KEYS.SESSIONS, this.sessions);
    this.save(STORAGE_KEYS.PICKUP_CODES, this.pickupCodes);
    this.save(STORAGE_KEYS.RESERVATIONS, this.reservations);
    this.save(STORAGE_KEYS.PAYMENTS, this.payments);
    this.save(STORAGE_KEYS.REFUNDS, this.refunds);
    this.save(STORAGE_KEYS.INVOICES, this.invoices);
    this.save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.save(STORAGE_KEYS.CURRENT_USER, this.currentUser);
  }

  // --- Auth & User ---
  public getCurrentUser(): Profile {
    return this.currentUser;
  }

  public setCurrentUser(user: Profile) {
    this.currentUser = user;
    this.save(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.notify();
  }

  public loginAsRole(role: Profile['role'], restaurantId?: string) {
    const match = this.profiles.find((p) => p.role === role && (!restaurantId || p.restaurantId === restaurantId));
    if (match) {
      this.setCurrentUser(match);
    } else {
      // Find any profile with that role
      const anyMatch = this.profiles.find((p) => p.role === role);
      if (anyMatch) this.setCurrentUser(anyMatch);
    }
  }

  public registerUser(profile: Omit<Profile, 'id'>): Profile {
    const newProfile: Profile = {
      ...profile,
      id: `usr-${Date.now()}`,
    };
    this.profiles.push(newProfile);
    this.save(STORAGE_KEYS.PROFILES, this.profiles);
    this.setCurrentUser(newProfile);
    this.notify();
    return newProfile;
  }

  // --- Restaurants ---
  public getRestaurants(): Restaurant[] {
    return [...this.restaurants];
  }

  public getRestaurantById(id: string): Restaurant | undefined {
    return this.restaurants.find((r) => r.id === id);
  }

  public getRestaurantSettings(restaurantId: string): RestaurantSettings {
    if (this.settings[restaurantId]) return this.settings[restaurantId];
    // Return default settings
    const defaultSettings: RestaurantSettings = {
      id: `set-${restaurantId}`,
      restaurantId,
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 8.5,
      serviceChargeRate: 5.0,
      dineInAdvancePercent: 30,
      dineLaterAdvancePercent: 30,
      takeawayAdvancePercent: 80,
      targetPrepTimeMinutes: 20,
      dineLaterTargetServingMinutes: 1,
      enableUpi: true,
      enableCards: true,
      enableCash: true,
      cancellationRules: [
        { hoursBefore: 2.0, refundPercent: 90 },
        { hoursBefore: 1.5, refundPercent: 60 },
        { hoursBefore: 0.5, refundPercent: 25 },
        { hoursBefore: 0.0, refundPercent: 0 },
      ],
    };
    this.settings[restaurantId] = defaultSettings;
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    return defaultSettings;
  }

  public updateRestaurantSettings(restaurantId: string, updates: Partial<RestaurantSettings>) {
    const current = this.getRestaurantSettings(restaurantId);
    this.settings[restaurantId] = { ...current, ...updates };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();
  }

  public setRestaurantPauseOrders(restaurantId: string, pause: boolean, reason?: string) {
    const restaurant = this.restaurants.find((r) => r.id === restaurantId);
    if (restaurant) {
      restaurant.pauseOrders = pause;
      if (reason !== undefined) restaurant.pauseReason = reason;
      this.save(STORAGE_KEYS.RESTAURANTS, this.restaurants);
      this.notify();
    }
  }

  public updateRestaurantStatus(restaurantId: string, status: Restaurant['status']) {
    const restaurant = this.restaurants.find((r) => r.id === restaurantId);
    if (restaurant) {
      restaurant.status = status;
      this.save(STORAGE_KEYS.RESTAURANTS, this.restaurants);
      this.notify();
    }
  }

  public registerNewRestaurant(data: {
    name: string;
    cuisineType: string[];
    address: string;
    city: string;
    phone: string;
    email: string;
    ownerName: string;
    description: string;
  }): Restaurant {
    const restaurantId = `rest-${Date.now()}`;
    const ownerId = `usr-owner-${Date.now()}`;
    const ownerProfile: Profile = {
      id: ownerId,
      email: data.email,
      phone: data.phone,
      fullName: data.ownerName,
      role: 'restaurant_owner',
      restaurantId,
    };
    this.profiles.push(ownerProfile);
    this.save(STORAGE_KEYS.PROFILES, this.profiles);

    const newRestaurant: Restaurant = {
      id: restaurantId,
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tagline: 'Fresh Flavors & Exceptional Dining',
      description: data.description,
      cuisineType: data.cuisineType,
      address: data.address,
      city: data.city,
      phone: data.phone,
      email: data.email,
      heroImageUrl: '/src/assets/images/restaurant_fine_dining_1794317960976.jpg',
      status: 'pending', // Pending approval by Super Admin
      pauseOrders: false,
      ownerId,
      rating: 5.0,
      reviewCount: 0,
      averageCostForTwo: 45,
    };
    this.restaurants.push(newRestaurant);
    this.save(STORAGE_KEYS.RESTAURANTS, this.restaurants);

    // Initial tables
    const newTables: RestaurantTable[] = [
      { id: `tab-${restaurantId}-01`, restaurantId, tableNumber: 'Table 01', seatingCapacity: 2, section: 'Main Area', status: 'available' },
      { id: `tab-${restaurantId}-02`, restaurantId, tableNumber: 'Table 02', seatingCapacity: 4, section: 'Main Area', status: 'available' },
      { id: `tab-${restaurantId}-03`, restaurantId, tableNumber: 'Table 03', seatingCapacity: 4, section: 'Window View', status: 'available' },
    ];
    this.tables.push(...newTables);
    this.save(STORAGE_KEYS.TABLES, this.tables);

    this.notify();
    return newRestaurant;
  }

  // --- Menu Management ---
  public getMenuCategories(restaurantId: string): MenuCategory[] {
    return this.categories
      .filter((c) => c.restaurantId === restaurantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getMenuItems(restaurantId: string): MenuItem[] {
    return this.menuItems
      .filter((m) => m.restaurantId === restaurantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public addMenuItem(item: Omit<MenuItem, 'id' | 'sortOrder'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
      sortOrder: this.menuItems.length + 1,
    };
    this.menuItems.push(newItem);
    this.save(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
    this.notify();
    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const item = this.menuItems.find((m) => m.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
      this.notify();
    }
  }

  public deleteMenuItem(id: string) {
    this.menuItems = this.menuItems.filter((m) => m.id !== id);
    this.save(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
    this.notify();
  }

  public toggleItemAvailability(id: string): boolean {
    const item = this.menuItems.find((m) => m.id === id);
    if (item) {
      item.isAvailable = !item.isAvailable;
      this.save(STORAGE_KEYS.MENU_ITEMS, this.menuItems);
      this.notify();
      return item.isAvailable;
    }
    return false;
  }

  // --- Tables & QR ---
  public getTables(restaurantId: string): RestaurantTable[] {
    return this.tables.filter((t) => t.restaurantId === restaurantId);
  }

  public getTableById(tableId: string): RestaurantTable | undefined {
    return this.tables.find((t) => t.id === tableId);
  }

  public findTableByNumber(restaurantId: string, tableNumber: string): RestaurantTable | undefined {
    return this.tables.find(
      (t) => t.restaurantId === restaurantId && (t.tableNumber.toLowerCase() === tableNumber.toLowerCase() || t.tableNumber.toLowerCase().includes(tableNumber.toLowerCase()))
    );
  }

  public addTable(table: Omit<RestaurantTable, 'id' | 'status'>): RestaurantTable {
    const newTable: RestaurantTable = {
      ...table,
      id: `tab-${Date.now()}`,
      status: 'available',
    };
    this.tables.push(newTable);
    this.save(STORAGE_KEYS.TABLES, this.tables);
    this.notify();
    return newTable;
  }

  public updateTable(id: string, updates: Partial<RestaurantTable>) {
    const table = this.tables.find((t) => t.id === id);
    if (table) {
      Object.assign(table, updates);
      this.save(STORAGE_KEYS.TABLES, this.tables);
      this.notify();
    }
  }

  public deleteTable(id: string): boolean {
    const table = this.tables.find((t) => t.id === id);
    if (table && table.status !== 'occupied') {
      this.tables = this.tables.filter((t) => t.id !== id);
      this.save(STORAGE_KEYS.TABLES, this.tables);
      this.notify();
      return true;
    }
    return false;
  }

  public setTableStatus(id: string, status: TableStatus) {
    const table = this.tables.find((t) => t.id === id);
    if (table) {
      table.status = status;
      this.save(STORAGE_KEYS.TABLES, this.tables);
      this.notify();
    }
  }

  // --- Dining Sessions (Dine-In Multi-Order Flow) ---
  public getActiveSession(restaurantId: string, tableId: string): DiningSession | undefined {
    return this.sessions.find(
      (s) => s.restaurantId === restaurantId && s.tableId === tableId && (s.status === 'active' || s.status === 'bill_requested')
    );
  }

  public getSessionById(sessionId: string): DiningSession | undefined {
    return this.sessions.find((s) => s.id === sessionId);
  }

  public createOrResumeSession(restaurantId: string, tableId: string, tableNumber: string, customerName = 'Guest'): DiningSession {
    let session = this.getActiveSession(restaurantId, tableId);
    if (!session) {
      session = {
        id: `sess-${Date.now()}`,
        restaurantId,
        tableId,
        tableNumber,
        customerId: this.currentUser?.role === 'customer' ? this.currentUser.id : undefined,
        customerName: this.currentUser?.role === 'customer' ? this.currentUser.fullName : customerName,
        status: 'active',
        orderIds: [],
        totalFoodAmount: 0,
        totalPaidAmount: 0,
        outstandingBalance: 0,
        openedAt: new Date().toISOString(),
      };
      this.sessions.push(session);
      this.save(STORAGE_KEYS.SESSIONS, this.sessions);

      // Set table to occupied
      this.setTableStatus(tableId, 'occupied');
      this.notify();
    }
    return session;
  }

  // --- Orders ---
  public getOrders(restaurantId?: string): Order[] {
    if (restaurantId) {
      return this.orders
        .filter((o) => o.restaurantId === restaurantId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...this.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCustomerOrders(customerId: string): Order[] {
    return this.orders
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.orders.find((o) => o.id === orderId);
  }

  public createOrder(params: {
    restaurantId: string;
    orderType: OrderType;
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
    tableId?: string;
    tableNumber?: string;
    sessionId?: string;
    reservationId?: string;
    pickupTime?: string;
    notes?: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
  }): { order: Order; payment: Payment; pickupCode?: PickupCode } {
    const restaurant = this.getRestaurantById(params.restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');
    if (restaurant.pauseOrders) {
      throw new Error(restaurant.pauseReason || 'Restaurant is currently not accepting new orders.');
    }

    const settings = this.getRestaurantSettings(params.restaurantId);

    // Calculate items
    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    const orderId = `ord-${Date.now()}`;

    for (const reqItem of params.items) {
      const menuItem = this.menuItems.find((m) => m.id === reqItem.menuItemId);
      if (!menuItem) continue;
      if (!menuItem.isAvailable) {
        throw new Error(`Item "${menuItem.name}" is currently sold out and unavailable.`);
      }
      const itemTotal = Number((menuItem.price * reqItem.quantity).toFixed(2));
      subtotal += itemTotal;
      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        unitPrice: menuItem.price,
        quantity: reqItem.quantity,
        totalPrice: itemTotal,
        specialInstructions: reqItem.specialInstructions,
        isVegetarian: menuItem.isVegetarian,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const tax = Number(((subtotal * settings.taxRate) / 100).toFixed(2));
    const serviceCharge = Number(((subtotal * settings.serviceChargeRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + tax + serviceCharge).toFixed(2));

    // Calculate advance deposit
    let advancePercent = 100;
    if (params.orderType === 'dine_in') {
      advancePercent = settings.dineInAdvancePercent;
    } else if (params.orderType === 'dine_later') {
      advancePercent = settings.dineLaterAdvancePercent;
    } else if (params.orderType === 'takeaway') {
      advancePercent = settings.takeawayAdvancePercent;
    }

    const advanceAmount = Number(((totalAmount * advancePercent) / 100).toFixed(2));
    const remainingBalance = Number((totalAmount - advanceAmount).toFixed(2));

    const orderNumber = `${restaurant.name.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let generatedPickupCode: PickupCode | undefined;
    let pickupCodeStr: string | undefined;

    if (params.orderType === 'takeaway') {
      pickupCodeStr = `PK${Math.floor(1000 + Math.random() * 9000)}`;
      generatedPickupCode = {
        id: `pc-${Date.now()}`,
        restaurantId: params.restaurantId,
        orderId,
        pickupCode: pickupCodeStr,
        status: 'valid',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4h expiration
        customerName: params.customerName || this.currentUser.fullName,
        totalAmount,
        remainingBalance,
      };
      this.pickupCodes.push(generatedPickupCode);
      this.save(STORAGE_KEYS.PICKUP_CODES, this.pickupCodes);
    }

    const order: Order = {
      id: orderId,
      orderNumber,
      restaurantId: params.restaurantId,
      customerId: this.currentUser?.id,
      customerName: params.customerName || this.currentUser.fullName || 'Customer',
      customerPhone: params.customerPhone || this.currentUser.phone || '+1 555-0100',
      orderType: params.orderType,
      status: 'pending',
      tableId: params.tableId,
      tableNumber: params.tableNumber,
      sessionId: params.sessionId,
      reservationId: params.reservationId,
      items: orderItems,
      subtotal,
      tax,
      serviceCharge,
      totalAmount,
      advanceAmount,
      remainingBalance,
      pickupCode: pickupCodeStr,
      pickupTime: params.pickupTime,
      targetReadyTime: new Date(Date.now() + settings.targetPrepTimeMinutes * 60 * 1000).toISOString(),
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.push(order);
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    // Record the Advance Payment
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      restaurantId: params.restaurantId,
      orderId,
      sessionId: params.sessionId,
      customerId: this.currentUser?.id,
      customerName: order.customerName,
      amount: advanceAmount,
      paymentType: 'advance_deposit',
      paymentMethod: params.paymentMethod,
      status: 'successful',
      transactionRef: `TXN-ADV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.payments.push(payment);
    this.save(STORAGE_KEYS.PAYMENTS, this.payments);

    // If linked to a dining session, update session totals
    if (params.sessionId) {
      const session = this.sessions.find((s) => s.id === params.sessionId);
      if (session) {
        session.orderIds.push(orderId);
        session.totalFoodAmount = Number((session.totalFoodAmount + totalAmount).toFixed(2));
        session.totalPaidAmount = Number((session.totalPaidAmount + advanceAmount).toFixed(2));
        session.outstandingBalance = Number((session.totalFoodAmount - session.totalPaidAmount).toFixed(2));
        this.save(STORAGE_KEYS.SESSIONS, this.sessions);
      }
    }

    // Add notification for restaurant
    this.notifications.push({
      id: `notif-${Date.now()}`,
      restaurantId: params.restaurantId,
      title: `New ${params.orderType.replace('_', ' ').toUpperCase()} Order`,
      message: `${order.customerName} placed order #${order.orderNumber} ($${totalAmount})`,
      type: 'new_order',
      referenceId: order.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    this.save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    this.notify();
    return { order, payment, pickupCode: generatedPickupCode };
  }

  public updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      if (status === 'ready') {
        order.actualReadyTime = new Date().toISOString();
      }
      this.save(STORAGE_KEYS.ORDERS, this.orders);

      // Notification to customer
      this.notifications.push({
        id: `notif-${Date.now()}`,
        restaurantId: order.restaurantId,
        userId: order.customerId,
        title: `Order #${order.orderNumber} Status Updated`,
        message: `Your order is now: ${status.replace('_', ' ').toUpperCase()}`,
        type: 'order_status',
        referenceId: order.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      this.save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

      this.notify();
    }
  }

  // --- Takeaway Pickup Verification ---
  public verifyPickupCode(restaurantId: string, code: string, paymentMethodForRemaining: PaymentMethod = 'card'): {
    success: boolean;
    order?: Order;
    message: string;
    remainingPaid?: number;
  } {
    const cleanCode = code.trim().toUpperCase();
    const record = this.pickupCodes.find(
      (pc) => pc.restaurantId === restaurantId && pc.pickupCode === cleanCode
    );

    if (!record) {
      return { success: false, message: 'Invalid pickup code. Please check and re-enter.' };
    }

    if (record.status === 'verified_collected') {
      return { success: false, message: 'This pickup code has already been verified and collected!' };
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      record.status = 'expired';
      this.save(STORAGE_KEYS.PICKUP_CODES, this.pickupCodes);
      this.notify();
      return { success: false, message: 'This pickup code has expired. Please contact restaurant manager.' };
    }

    const order = this.orders.find((o) => o.id === record.orderId);
    if (!order) {
      return { success: false, message: 'Matching order not found.' };
    }

    // Collect remaining balance if any
    let remainingPaid = 0;
    if (order.remainingBalance > 0) {
      remainingPaid = order.remainingBalance;
      const finalPayment: Payment = {
        id: `pay-${Date.now()}`,
        restaurantId,
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        amount: remainingPaid,
        paymentType: 'final_settlement',
        paymentMethod: paymentMethodForRemaining,
        status: 'successful',
        transactionRef: `TXN-PICKUP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      this.payments.push(finalPayment);
      this.save(STORAGE_KEYS.PAYMENTS, this.payments);

      order.remainingBalance = 0;
    }

    // Invalidate pickup code & update order status
    record.status = 'verified_collected';
    record.verifiedAt = new Date().toISOString();
    record.verifiedByUserId = this.currentUser.id;
    this.save(STORAGE_KEYS.PICKUP_CODES, this.pickupCodes);

    order.status = 'collected';
    order.updatedAt = new Date().toISOString();
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    this.notify();
    return {
      success: true,
      order,
      message: `Pickup verified! Hand over parcel to ${order.customerName}.`,
      remainingPaid,
    };
  }

  // --- Dine-In Session Completion ("I'm Finished Dining") ---
  public requestSessionBill(sessionId: string): Invoice {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Dining session not found');

    const restaurant = this.getRestaurantById(session.restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const sessionOrders = this.orders.filter((o) => session.orderIds.includes(o.id));

    // Consolidate all items across rounds
    const consolidatedItemsMap: Record<string, { name: string; quantity: number; unitPrice: number; totalPrice: number }> = {};
    let subtotal = 0;
    let taxTotal = 0;
    let serviceTotal = 0;
    let grandTotal = 0;
    let totalAdvancePaid = 0;

    for (const order of sessionOrders) {
      subtotal += order.subtotal;
      taxTotal += order.tax;
      serviceTotal += order.serviceCharge;
      grandTotal += order.totalAmount;
      totalAdvancePaid += order.advanceAmount;

      for (const it of order.items) {
        if (!consolidatedItemsMap[it.itemName]) {
          consolidatedItemsMap[it.itemName] = {
            name: it.itemName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          };
        } else {
          consolidatedItemsMap[it.itemName].quantity += it.quantity;
          consolidatedItemsMap[it.itemName].totalPrice = Number(
            (consolidatedItemsMap[it.itemName].totalPrice + it.totalPrice).toFixed(2)
          );
        }
      }
    }

    const outstandingDue = Number(Math.max(0, grandTotal - totalAdvancePaid).toFixed(2));

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      restaurantGst: restaurant.gstNumber,
      sessionId: session.id,
      customerName: session.customerName,
      serviceType: 'dine_in',
      tableNumber: session.tableNumber,
      itemizedSummary: Object.values(consolidatedItemsMap),
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxTotal.toFixed(2)),
      serviceCharge: Number(serviceTotal.toFixed(2)),
      totalAmount: Number(grandTotal.toFixed(2)),
      paidAmount: Number(totalAdvancePaid.toFixed(2)),
      balanceDue: outstandingDue,
      paymentStatus: outstandingDue === 0 ? 'paid' : 'partial',
      createdAt: new Date().toISOString(),
    };

    session.status = 'bill_requested';
    this.invoices.push(invoice);
    this.save(STORAGE_KEYS.INVOICES, this.invoices);
    this.save(STORAGE_KEYS.SESSIONS, this.sessions);

    this.notify();
    return invoice;
  }

  public settleDiningSession(sessionId: string, paymentMethod: PaymentMethod = 'card'): {
    invoice: Invoice;
    payment?: Payment;
  } {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Dining session not found');

    const invoice = this.invoices.find((i) => i.sessionId === sessionId) || this.requestSessionBill(sessionId);

    if (invoice.balanceDue > 0) {
      const finalPayment: Payment = {
        id: `pay-${Date.now()}`,
        restaurantId: session.restaurantId,
        sessionId: session.id,
        customerId: session.customerId,
        customerName: session.customerName,
        amount: invoice.balanceDue,
        paymentType: 'final_settlement',
        paymentMethod,
        status: 'successful',
        transactionRef: `TXN-SETTLE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      this.payments.push(finalPayment);
      this.save(STORAGE_KEYS.PAYMENTS, this.payments);

      invoice.paidAmount = Number((invoice.paidAmount + invoice.balanceDue).toFixed(2));
      invoice.balanceDue = 0;
      invoice.paymentStatus = 'paid';
      this.save(STORAGE_KEYS.INVOICES, this.invoices);
    }

    // Close session and free table
    session.status = 'settled';
    session.closedAt = new Date().toISOString();
    session.totalPaidAmount = session.totalFoodAmount;
    session.outstandingBalance = 0;
    this.save(STORAGE_KEYS.SESSIONS, this.sessions);

    this.setTableStatus(session.tableId, 'available');

    // Mark all session orders as served
    for (const ord of this.orders) {
      if (session.orderIds.includes(ord.id) && ord.status !== 'cancelled') {
        ord.status = 'served';
        ord.remainingBalance = 0;
      }
    }
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    this.notify();
    return { invoice };
  }

  // --- Advance Reservations ("Order Now, Dine Later") ---
  public getReservations(restaurantId: string): Reservation[] {
    return this.reservations
      .filter((r) => r.restaurantId === restaurantId)
      .sort((a, b) => new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime());
  }

  public checkTableAvailability(restaurantId: string, dateStr: string, timeStr: string): RestaurantTable[] {
    // Check if table is already booked near this time
    const targetTime = new Date(`${dateStr}T${timeStr}`).getTime();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    const bookedTableIds = new Set<string>();
    for (const res of this.reservations) {
      if (res.restaurantId === restaurantId && res.status !== 'cancelled') {
        const resTime = new Date(res.expectedArrivalTime).getTime();
        if (Math.abs(resTime - targetTime) < twoHoursMs && res.tableId) {
          bookedTableIds.add(res.tableId);
        }
      }
    }

    return this.tables.filter((t) => t.restaurantId === restaurantId && !bookedTableIds.has(t.id));
  }

  public createReservationWithOrder(params: {
    restaurantId: string;
    tableId?: string;
    guestCount: number;
    reservationDate: string;
    expectedArrivalTime: string;
    specialNotes?: string;
    customerName: string;
    customerPhone: string;
    foodItems: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
    paymentMethod: PaymentMethod;
  }): { reservation: Reservation; order?: Order; payment?: Payment } {
    const table = params.tableId ? this.getTableById(params.tableId) : undefined;
    const reservationCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    let order: Order | undefined;
    let payment: Payment | undefined;
    let advanceAmount = 0;

    const resId = `res-${Date.now()}`;

    if (params.foodItems && params.foodItems.length > 0) {
      const orderResult = this.createOrder({
        restaurantId: params.restaurantId,
        orderType: 'dine_later',
        items: params.foodItems,
        tableId: params.tableId,
        tableNumber: table?.tableNumber,
        reservationId: resId,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        paymentMethod: params.paymentMethod,
        notes: `Advance Booking for ${params.reservationDate} at ${new Date(params.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
      order = orderResult.order;
      payment = orderResult.payment;
      advanceAmount = order.advanceAmount;
    } else {
      // Table booking deposit (e.g. flat $15 deposit)
      advanceAmount = 15.00;
      payment = {
        id: `pay-${Date.now()}`,
        restaurantId: params.restaurantId,
        customerId: this.currentUser?.id,
        customerName: params.customerName,
        amount: advanceAmount,
        paymentType: 'advance_deposit',
        paymentMethod: params.paymentMethod,
        status: 'successful',
        transactionRef: `TXN-RES-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      this.payments.push(payment);
      this.save(STORAGE_KEYS.PAYMENTS, this.payments);
    }

    const reservation: Reservation = {
      id: resId,
      reservationCode,
      restaurantId: params.restaurantId,
      tableId: params.tableId,
      tableNumber: table?.tableNumber,
      customerId: this.currentUser?.id,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      guestCount: params.guestCount,
      reservationDate: params.reservationDate,
      expectedArrivalTime: params.expectedArrivalTime,
      status: 'confirmed',
      specialNotes: params.specialNotes,
      orderId: order?.id,
      advanceAmount,
      createdAt: new Date().toISOString(),
    };

    this.reservations.push(reservation);
    this.save(STORAGE_KEYS.RESERVATIONS, this.reservations);

    if (table) {
      this.setTableStatus(table.id, 'reserved');
    }

    this.notify();
    return { reservation, order, payment };
  }

  // --- Cancellation & Refund Logic ---
  public calculateEstimatedRefund(orderId: string): {
    eligible: boolean;
    hoursRemaining: number;
    refundPercent: number;
    originalAmount: number;
    refundAmount: number;
    reasonMsg: string;
  } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) {
      return { eligible: false, hoursRemaining: 0, refundPercent: 0, originalAmount: 0, refundAmount: 0, reasonMsg: 'Order not found' };
    }

    if (order.status === 'served' || order.status === 'collected' || order.status === 'cancelled') {
      return { eligible: false, hoursRemaining: 0, refundPercent: 0, originalAmount: order.advanceAmount, refundAmount: 0, reasonMsg: `Cannot cancel order with status: ${order.status}` };
    }

    const settings = this.getRestaurantSettings(order.restaurantId);
    let targetTime = Date.now();

    if (order.orderType === 'dine_later' && order.reservationId) {
      const res = this.reservations.find((r) => r.id === order.reservationId);
      if (res) targetTime = new Date(res.expectedArrivalTime).getTime();
    } else if (order.targetReadyTime) {
      targetTime = new Date(order.targetReadyTime).getTime();
    } else {
      targetTime = new Date(order.createdAt).getTime() + settings.targetPrepTimeMinutes * 60 * 1000;
    }

    const diffHours = (targetTime - Date.now()) / (1000 * 60 * 60);

    let refundPercent = 0;
    if (diffHours >= 2.0) {
      refundPercent = 90;
    } else if (diffHours >= 1.5) {
      refundPercent = 60;
    } else if (diffHours >= 0.5) {
      refundPercent = 25;
    } else {
      refundPercent = 0;
    }

    const originalAmount = order.advanceAmount;
    const refundAmount = Number(((originalAmount * refundPercent) / 100).toFixed(2));

    const reasonMsg = refundPercent > 0
      ? `Eligible for ${refundPercent}% refund based on cancellation policy (${diffHours.toFixed(1)}h before schedule).`
      : `No refund applicable for cancellations under 30 minutes before preparation/arrival.`;

    return {
      eligible: true,
      hoursRemaining: Math.max(0, Number(diffHours.toFixed(1))),
      refundPercent,
      originalAmount,
      refundAmount,
      reasonMsg,
    };
  }

  public cancelOrderWithRefund(orderId: string, reason: string): { success: boolean; refund?: Refund; message: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    // Prevent duplicate cancellation
    if (order.status === 'cancelled') {
      return { success: false, message: 'Order is already cancelled' };
    }

    const check = this.calculateEstimatedRefund(orderId);
    if (!check.eligible) {
      return { success: false, message: check.reasonMsg };
    }

    // Process refund record if amount > 0
    let refund: Refund | undefined;
    if (check.refundAmount > 0) {
      refund = {
        id: `ref-${Date.now()}`,
        restaurantId: order.restaurantId,
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        originalPaidAmount: check.originalAmount,
        refundPercentage: check.refundPercent,
        refundAmount: check.refundAmount,
        reason,
        status: 'processed',
        processedAt: new Date().toISOString(),
      };
      this.refunds.push(refund);
      this.save(STORAGE_KEYS.REFUNDS, this.refunds);

      // Update payment record status
      const payment = this.payments.find((p) => p.orderId === order.id);
      if (payment) {
        payment.status = check.refundPercent === 100 ? 'refunded' : 'partially_refunded';
        this.save(STORAGE_KEYS.PAYMENTS, this.payments);
      }
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    this.save(STORAGE_KEYS.ORDERS, this.orders);

    // If reservation linked, mark cancelled
    if (order.reservationId) {
      const res = this.reservations.find((r) => r.id === order.reservationId);
      if (res) {
        res.status = 'cancelled';
        if (res.tableId) this.setTableStatus(res.tableId, 'available');
        this.save(STORAGE_KEYS.RESERVATIONS, this.reservations);
      }
    }

    // Invalidate pickup code if takeaway
    const pickup = this.pickupCodes.find((p) => p.orderId === order.id);
    if (pickup) {
      pickup.status = 'cancelled';
      this.save(STORAGE_KEYS.PICKUP_CODES, this.pickupCodes);
    }

    this.notify();
    return {
      success: true,
      refund,
      message: `Order #${order.orderNumber} cancelled. Refund of $${check.refundAmount} (${check.refundPercent}%) processed to customer original payment source.`,
    };
  }

  // --- Analytics & Reporting ---
  public getRestaurantAnalytics(restaurantId: string) {
    const restOrders = this.orders.filter((o) => o.restaurantId === restaurantId);
    const restPayments = this.payments.filter((p) => p.restaurantId === restaurantId && p.status === 'successful');
    const restRefunds = this.refunds.filter((r) => r.restaurantId === restaurantId && r.status === 'processed');

    const totalOrdersToday = restOrders.length;
    const completedOrders = restOrders.filter((o) => o.status === 'served' || o.status === 'collected').length;
    const pendingOrders = restOrders.filter((o) => o.status === 'pending').length;
    const preparingOrders = restOrders.filter((o) => o.status === 'preparing').length;
    const readyOrders = restOrders.filter((o) => o.status === 'ready').length;
    const cancelledOrders = restOrders.filter((o) => o.status === 'cancelled').length;

    // Gross order value (all non-cancelled orders total)
    const grossOrderValue = restOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const paymentsCollected = restPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const outstandingPayments = restOrders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'served' && o.status !== 'collected')
      .reduce((acc, curr) => acc + curr.remainingBalance, 0);

    const refundsIssued = restRefunds.reduce((acc, curr) => acc + curr.refundAmount, 0);

    const netRevenue = Number(Math.max(0, paymentsCollected - refundsIssued).toFixed(2));

    // Popular items
    const itemCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const o of restOrders) {
      if (o.status === 'cancelled') continue;
      for (const it of o.items) {
        if (!itemCountMap[it.itemName]) {
          itemCountMap[it.itemName] = { name: it.itemName, count: 0, revenue: 0 };
        }
        itemCountMap[it.itemName].count += it.quantity;
        itemCountMap[it.itemName].revenue += it.totalPrice;
      }
    }
    const popularItems = Object.values(itemCountMap).sort((a, b) => b.count - a.count).slice(0, 5);

    // Breakdown by order type
    const dineInCount = restOrders.filter((o) => o.orderType === 'dine_in').length;
    const dineLaterCount = restOrders.filter((o) => o.orderType === 'dine_later').length;
    const takeawayCount = restOrders.filter((o) => o.orderType === 'takeaway').length;

    return {
      totalOrdersToday,
      completedOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      cancelledOrders,
      grossOrderValue: Number(grossOrderValue.toFixed(2)),
      paymentsCollected: Number(paymentsCollected.toFixed(2)),
      outstandingPayments: Number(outstandingPayments.toFixed(2)),
      refundsIssued: Number(refundsIssued.toFixed(2)),
      netRevenue,
      popularItems,
      breakdown: {
        dineIn: dineInCount,
        dineLater: dineLaterCount,
        takeaway: takeawayCount,
      },
    };
  }

  // --- Super Admin Global Stats ---
  public getSuperAdminStats() {
    const totalTenants = this.restaurants.length;
    const activeTenants = this.restaurants.filter((r) => r.status === 'active').length;
    const pendingTenants = this.restaurants.filter((r) => r.status === 'pending').length;
    const totalOrders = this.orders.length;
    const totalGmv = this.orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalTenants,
      activeTenants,
      pendingTenants,
      totalOrders,
      totalGmv: Number(totalGmv.toFixed(2)),
      platformFeeEstimate: Number((totalGmv * 0.025).toFixed(2)), // 2.5% platform fee
    };
  }

  public getInvoices(restaurantId?: string): Invoice[] {
    if (restaurantId) return this.invoices.filter((i) => i.restaurantId === restaurantId);
    return [...this.invoices];
  }

  public getRefunds(restaurantId?: string): Refund[] {
    if (restaurantId) return this.refunds.filter((r) => r.restaurantId === restaurantId);
    return [...this.refunds];
  }

  public getPayments(restaurantId?: string): Payment[] {
    if (restaurantId) return this.payments.filter((p) => p.restaurantId === restaurantId);
    return [...this.payments];
  }

  public getNotifications(restaurantId?: string, userId?: string): Notification[] {
    return this.notifications
      .filter((n) => (!restaurantId || n.restaurantId === restaurantId) && (!userId || n.userId === userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
    }
  }
}

export const store = new RestaurantStore();
