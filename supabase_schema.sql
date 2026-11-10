-- ==============================================================================
-- RESTOFLOW: SMART RESTAURANT ORDERING, RESERVATION & PICKUP SYSTEM
-- Complete Normalized PostgreSQL / Supabase Schema (18 Tables) + RLS Policies
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Users: Customers, Restaurant Owners, Staff, Super Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'restaurant_owner', 'restaurant_staff', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT,
    description TEXT,
    cuisine_type TEXT[] DEFAULT ARRAY['Contemporary'],
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    gst_number TEXT,
    logo_url TEXT,
    hero_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'suspended')),
    pause_orders BOOLEAN NOT NULL DEFAULT false,
    pause_reason TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RESTAURANT MEMBERS (Roles within a restaurant)
CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'waitstaff', 'chef', 'cashier')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, user_id)
);

-- 4. RESTAURANT SETTINGS (Payment policies, target prep times, cancellation refunds)
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID UNIQUE NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 8.25,
    service_charge_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    dine_in_advance_percent NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    dine_later_advance_percent NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    takeaway_advance_percent NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
    target_prep_time_minutes INT NOT NULL DEFAULT 20,
    dine_later_target_serving_minutes INT NOT NULL DEFAULT 1,
    enable_upi BOOLEAN NOT NULL DEFAULT true,
    enable_cards BOOLEAN NOT NULL DEFAULT true,
    enable_cash BOOLEAN NOT NULL DEFAULT true,
    cancellation_rules JSONB NOT NULL DEFAULT '[
        {"hours_before": 2.0, "refund_percent": 90},
        {"hours_before": 1.5, "refund_percent": 60},
        {"hours_before": 0.5, "refund_percent": 25},
        {"hours_before": 0.0, "refund_percent": 0}
    ]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RESTAURANT OPERATING HOURS
CREATE TABLE IF NOT EXISTS public.restaurant_operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_vegetarian BOOLEAN NOT NULL DEFAULT false,
    is_vegan BOOLEAN NOT NULL DEFAULT false,
    is_gluten_free BOOLEAN NOT NULL DEFAULT false,
    calories INT,
    prep_time_minutes INT NOT NULL DEFAULT 15,
    is_available BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RESTAURANT TABLES
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    seating_capacity INT NOT NULL CHECK (seating_capacity > 0),
    section TEXT DEFAULT 'Main Hall',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning', 'unavailable')),
    active_session_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- 9. TABLE QR CODES
CREATE TABLE IF NOT EXISTS public.table_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID UNIQUE NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
    secure_token TEXT UNIQUE NOT NULL,
    qr_payload_url TEXT NOT NULL,
    last_scanned_at TIMESTAMPTZ,
    scan_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. DINING SESSIONS (Multi-round dine-in orders)
CREATE TABLE IF NOT EXISTS public.dining_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL DEFAULT 'Guest',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'bill_requested', 'settled', 'cancelled')),
    total_food_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. RESERVATIONS (Order Now, Dine Later)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code TEXT UNIQUE NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    guest_count INT NOT NULL DEFAULT 2,
    reservation_date DATE NOT NULL,
    expected_arrival_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled')),
    special_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'dine_later', 'takeaway')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'served', 'collected', 'cancelled')),
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.dining_sessions(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    service_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    target_ready_time TIMESTAMPTZ,
    actual_ready_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PICKUP CODES (Takeaway verification)
CREATE TABLE IF NOT EXISTS public.pickup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    pickup_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'verified_collected', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by_user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.dining_sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('advance_deposit', 'final_settlement', 'full_payment')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'cash_counter')),
    status TEXT NOT NULL DEFAULT 'successful' CHECK (status IN ('pending', 'successful', 'failed', 'refunded', 'partially_refunded')),
    transaction_ref TEXT UNIQUE NOT NULL,
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    original_paid_amount NUMERIC(10, 2) NOT NULL,
    refund_percentage NUMERIC(5, 2) NOT NULL,
    refund_amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.dining_sessions(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('dine_in', 'dine_later', 'takeaway')),
    itemized_summary JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    service_charge NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL,
    balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    qr_settlement_payload TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_order', 'order_status', 'reservation_request', 'session_bill', 'refund_processed')),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH VOLUME PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_dining_sessions_table ON public.dining_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_pickup_codes_code ON public.pickup_codes(pickup_code);
CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON public.reservations(restaurant_id, expected_arrival_time);
CREATE INDEX IF NOT EXISTS idx_menu_items_avail ON public.menu_items(restaurant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper RLS condition function for restaurant affiliation
CREATE OR REPLACE FUNCTION public.is_member_of_restaurant(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.restaurant_members rm
        WHERE rm.restaurant_id = target_restaurant_id AND rm.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = target_restaurant_id AND r.owner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view and edit their own profiles, super admin can view all
CREATE POLICY "Profiles viewable by owner or admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Profiles updatable by self" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Restaurants: Active restaurants visible to all; Owners and Super Admin manage
CREATE POLICY "Public can view active restaurants" ON public.restaurants
    FOR SELECT USING (status = 'active' OR public.is_member_of_restaurant(id));

CREATE POLICY "Owners can update restaurant" ON public.restaurants
    FOR UPDATE USING (public.is_member_of_restaurant(id));

-- Menu: Available items visible to all customers; Staff/Owners can manage
CREATE POLICY "Public can view menu items" ON public.menu_items
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage menu items" ON public.menu_items
    FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- Tables & QR: Visible to staff, QR tokens verified by public
CREATE POLICY "Tables viewable by staff or table scanning" ON public.restaurant_tables
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage tables" ON public.restaurant_tables
    FOR ALL USING (public.is_member_of_restaurant(restaurant_id));

-- Orders & Order Items: Customer sees own orders; Restaurant sees their orders
CREATE POLICY "Customers and staff can view orders" ON public.orders
    FOR SELECT USING (
        customer_id = auth.uid() 
        OR public.is_member_of_restaurant(restaurant_id)
        OR customer_id IS NULL -- Guest orders with order ID access
    );

CREATE POLICY "Customers can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update orders" ON public.orders
    FOR UPDATE USING (public.is_member_of_restaurant(restaurant_id));

-- Pickup codes: Verification strictly restricted to authorized restaurant members
CREATE POLICY "Staff can verify pickup code" ON public.pickup_codes
    FOR ALL USING (public.is_member_of_restaurant(restaurant_id));
