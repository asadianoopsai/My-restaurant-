import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Store, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Power, 
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { store } from '../../lib/store';
import { Restaurant, RestaurantStatus } from '../../types';

interface SuperAdminDashboardProps {
  onSwitchTenant: (restaurantId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onSwitchTenant,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const stats = store.getSuperAdminStats();
  const restaurants = store.getRestaurants();

  const handleUpdateStatus = (restId: string, status: RestaurantStatus) => {
    store.updateRestaurantStatus(restId, status);
  };

  const filtered = restaurants.filter((r) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Super Administrator</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1">
            Multi-Tenant Platform Control Plane
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Oversight of registered restaurant tenants, onboarding approvals, and cross-platform GMV volume.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Total Tenant Partners</span>
          <div className="text-2xl font-extrabold text-stone-900 tabular-nums mt-1">{stats.totalTenants}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Registered businesses</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Active Operational</span>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">{stats.activeTenants}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Live on customer app</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-700 uppercase">Platform Gross GMV</span>
          <div className="text-2xl font-extrabold text-stone-900 tabular-nums mt-1 font-mono">${stats.totalGmv.toFixed(2)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">All customer orders</div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-900 uppercase">Est. Platform Fee (2.5%)</span>
          <div className="text-2xl font-extrabold text-indigo-950 tabular-nums mt-1 font-mono">${stats.platformFeeEstimate.toFixed(2)}</div>
          <div className="text-[10px] text-indigo-700 mt-0.5">SaaS revenue accrual</div>
        </div>
      </div>

      {/* Restaurant Tenants Table */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Restaurant Accounts ({restaurants.length})
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by restaurant name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 font-semibold">Restaurant</th>
                <th className="py-2.5 font-semibold">City & Contact</th>
                <th className="py-2.5 font-semibold">Status</th>
                <th className="py-2.5 font-semibold">Orders Accepted</th>
                <th className="py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((rest) => (
                <tr key={rest.id} className="text-stone-800">
                  <td className="py-3 font-medium">
                    <div className="font-bold text-stone-900">{rest.name}</div>
                    <div className="text-[11px] text-stone-400">{rest.cuisineType.join(', ')}</div>
                  </td>
                  <td className="py-3">
                    <div>{rest.city}</div>
                    <div className="text-[11px] text-stone-400">{rest.phone}</div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rest.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rest.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {rest.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-[11px] font-semibold ${rest.pauseOrders ? 'text-red-600' : 'text-emerald-700'}`}>
                      {rest.pauseOrders ? 'Paused' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {rest.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(rest.id, 'active')}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs"
                        >
                          Approve Tenant
                        </button>
                      )}

                      {rest.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(rest.id, 'suspended')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          Suspend
                        </button>
                      )}

                      {rest.status === 'suspended' && (
                        <button
                          onClick={() => handleUpdateStatus(rest.id, 'active')}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        onClick={() => onSwitchTenant(rest.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center gap-1"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
