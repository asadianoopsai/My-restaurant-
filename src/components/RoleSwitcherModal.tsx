import React, { useState } from 'react';
import { 
  X, 
  User, 
  Store, 
  ChefHat, 
  ShieldCheck, 
  RotateCcw, 
  QrCode, 
  Check, 
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Profile } from '../types';
import { store } from '../lib/store';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onSelectTable05: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectTable05,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'auth' | 'backend'>('switch');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  if (!isOpen) return null;

  const roles = [
    {
      role: 'customer' as const,
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      title: 'Customer (Dine-in / Takeaway / Booking)',
      description: 'Browses restaurants, scans table QR, places multi-round orders, tracks preparation, and receives invoices.',
      icon: User,
      color: 'border-stone-200 bg-stone-50 hover:border-stone-400',
    },
    {
      role: 'restaurant_owner' as const,
      name: 'Marco Rossi',
      email: 'marco@bellavistatrattoria.com',
      restaurantId: 'rest-bella-vista',
      title: 'Restaurant Owner (Bella Vista)',
      description: 'Full management dashboard, live order processing, menu management, table QR generator, payment policies, and analytics.',
      icon: Store,
      color: 'border-amber-200 bg-amber-50/50 hover:border-amber-400',
    },
    {
      role: 'restaurant_staff' as const,
      name: 'Sarah Jenkins',
      email: 'sarah.kitchen@bellavistatrattoria.com',
      restaurantId: 'rest-bella-vista',
      title: 'Kitchen & Service Staff (Bella Vista)',
      description: 'Live order board, preparation status updates, and 1-click takeaway parcel pickup code verification.',
      icon: ChefHat,
      color: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400',
    },
    {
      role: 'super_admin' as const,
      name: 'Victoria Sterling',
      email: 'admin@restoflow.io',
      title: 'Platform Super Administrator',
      description: 'Multi-tenant oversight, restaurant approval, platform-wide gross order metrics, and tenant suspension.',
      icon: ShieldCheck,
      color: 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-400',
    },
  ];

  const handleSwitch = (r: typeof roles[0]) => {
    store.loginAsRole(r.role, r.restaurantId);
    onClose();
  };

  const handleCustomRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customEmail) return;
    store.registerUser({
      fullName: customName,
      email: customEmail,
      phone: customPhone || '+1 555-0100',
      role: 'customer',
    });
    setAuthSuccessMsg(`Logged in as ${customName}!`);
    setTimeout(() => {
      setAuthSuccessMsg('');
      onClose();
    }, 900);
  };

  const handleReset = () => {
    if (confirm('Reset prototype to original seed data? This clears any newly placed orders and restores demonstration tables.')) {
      store.resetAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Role & Simulation Switcher
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Switch personas instantly to verify multi-tenant access control and end-to-end workflows.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab('switch')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'switch' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Switch Active Persona
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'auth' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Demo Authentication & OTP
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'backend' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            PostgreSQL & RLS Architecture
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isCurrent = currentUser.role === r.role && (!r.restaurantId || currentUser.restaurantId === r.restaurantId);

                  return (
                    <div
                      key={r.role + (r.restaurantId || '')}
                      onClick={() => handleSwitch(r)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${r.color} ${
                        isCurrent ? 'ring-2 ring-amber-500 shadow-xs' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-xs border border-stone-200 flex items-center justify-center text-stone-800">
                          <Icon className="w-4 h-4 text-amber-600" />
                        </div>
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-400 group-hover:text-stone-600 flex items-center gap-0.5">
                            Switch <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-stone-900">{r.title}</h3>
                      <div className="text-xs font-medium text-stone-600 mt-0.5">{r.name}</div>
                      <p className="text-xs text-stone-500 mt-2 leading-relaxed">{r.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Fast Scenario Shortcut */}
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-700" />
                    Acceptance Criteria Test: Bella Vista Table 05
                  </div>
                  <div className="text-xs text-amber-800/80 mt-0.5">
                    Instantly load customer menu for Table 05 without asking for table number.
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onSelectTable05();
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  Test Table 05
                </button>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                <span className="font-semibold text-stone-900">Demo Authentication Notice:</span> In this preview prototype, Supabase OTP credentials can be simulated or tested directly. Real Supabase Auth endpoints connect seamlessly when <code className="font-mono text-stone-800">VITE_SUPABASE_URL</code> is injected.
              </div>

              <form onSubmit={handleCustomRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="jordan@example.com"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Phone Number (Optional for SMS OTP)</label>
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {authSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    {authSuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors"
                >
                  Create & Sign In as Custom Customer
                </button>
              </form>
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Database className="w-4 h-4 text-amber-600" />
                Normalized PostgreSQL Architecture (18 Tables)
              </div>
              <p>
                The platform includes a complete PostgreSQL schema in <code className="font-mono text-stone-800">/supabase_schema.sql</code> with:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-700">
                <li>Strict Row Level Security (RLS) preventing restaurants from querying other restaurants' data.</li>
                <li>Tables for Profiles, Restaurants, Members, Settings, Menu Items, Tables, QR Codes, Sessions, Reservations, Orders, Payments, Refunds, Invoices, and Pickup Codes.</li>
                <li>One-time pickup code expiration and verification constraints.</li>
                <li>Multi-round dine-in dining sessions with consolidated balance calculation.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-red-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sample Data
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
