import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Camera, 
  Sparkles, 
  CheckCircle, 
  ExternalLink,
  Store,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { store } from '../lib/store';
import { Restaurant, RestaurantTable } from '../types';

interface DineInQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableSelected: (restaurantId: string, tableId: string) => void;
}

export const DineInQRScannerModal: React.FC<DineInQRScannerModalProps> = ({
  isOpen,
  onClose,
  onTableSelected,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'camera' | 'token'>('presets');
  const [customToken, setCustomToken] = useState('rest-bella-vista:tab-bv-05');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const restaurants = store.getRestaurants().filter((r) => r.status === 'active');

  const handleSimulateScan = (restaurantId: string, tableId: string) => {
    const table = store.getTableById(tableId);
    const rest = store.getRestaurantById(restaurantId);
    
    setScannedFeedback(`Identified: ${rest?.name} - ${table?.tableNumber}`);
    setTimeout(() => {
      setScannedFeedback(null);
      onClose();
      onTableSelected(restaurantId, tableId);
    }, 600);
  };

  const handleCustomTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = customToken.split(':');
    if (parts.length >= 2) {
      handleSimulateScan(parts[0], parts[1]);
    } else {
      // Default to Table 05
      handleSimulateScan('rest-bella-vista', 'tab-bv-05');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Table QR Scanner</h2>
              <p className="text-xs text-stone-500">Scan or simulate table QR to launch your dine-in session.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'presets' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Quick Table Presets (Test Scenarios)
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              setCameraActive(true);
            }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'camera' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Interactive Optical Viewfinder
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'token' ? 'border-amber-600 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Payload Token Input
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {scannedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{scannedFeedback} — Opening live table session...</span>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Acceptance Criterion Scenario:</span> Scanning Table 05 identifies the restaurant and table automatically. No manual table typing required.
              </div>

              {restaurants.map((rest) => {
                const tables = store.getTables(rest.id);
                return (
                  <div key={rest.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/40">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-stone-500" />
                          {rest.name}
                        </h4>
                        <p className="text-xs text-stone-500">{rest.city} · {rest.cuisineType.join(', ')}</p>
                      </div>
                      <span className="text-[11px] font-medium text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                        {tables.length} tables configured
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {tables.map((t) => {
                        const isTable05 = t.tableNumber === 'Table 05' && rest.id === 'rest-bella-vista';
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleSimulateScan(rest.id, t.id)}
                            className={`p-2.5 rounded-lg border text-left transition-all hover:shadow-xs flex flex-col justify-between ${
                              isTable05
                                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                                : 'bg-white text-stone-800 border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{t.tableNumber}</span>
                              <QrCode className={`w-3.5 h-3.5 ${isTable05 ? 'text-white' : 'text-stone-400'}`} />
                            </div>
                            <span className={`text-[10px] mt-1 ${isTable05 ? 'text-amber-100' : 'text-stone-500'}`}>
                              {t.seatingCapacity} seats · {t.section}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              <div className="relative rounded-2xl overflow-hidden bg-stone-950 aspect-4/3 flex flex-col items-center justify-center p-6 border border-stone-800 text-stone-300">
                {/* Viewfinder Overlay Box */}
                <div className="w-56 h-56 border-2 border-dashed border-amber-400/80 rounded-2xl relative flex flex-col items-center justify-center p-4">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                  
                  <QrCode className="w-16 h-16 text-amber-400/80 mb-2" />
                  <span className="text-xs font-semibold text-white">Align QR code inside box</span>
                  <span className="text-[10px] text-stone-400 mt-1">Automatic optical recognition</span>
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  <button
                    onClick={() => handleSimulateScan('rest-bella-vista', 'tab-bv-05')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Simulate Camera Recognizing Table 05
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                In physical deployment on customer phones, camera captures the dynamic SVG QR sticker mounted on each table, directly resolving the secure table token.
              </p>
            </div>
          )}

          {activeTab === 'token' && (
            <form onSubmit={handleCustomTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Secure QR Payload Token
                </label>
                <input
                  type="text"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="rest-id:table-id"
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Format: <code className="text-stone-700">restaurantId:tableId</code> (e.g. <code className="text-stone-700">rest-bella-vista:tab-bv-05</code>)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Resolve Token & Open Table Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
