import React, { useEffect, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Receipt,
  CreditCard,
  Building2,
  Calendar
} from 'lucide-react';
import QRCode from 'qrcode';
import { Invoice, PaymentMethod } from '../types';
import { store } from '../lib/store';

interface DigitalInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
  sessionId?: string | null;
}

export const DigitalInvoiceModal: React.FC<DigitalInvoiceModalProps> = ({
  isOpen,
  onClose,
  orderId,
  sessionId,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSettling, setIsSettling] = useState(false);
  const [settledSuccess, setSettledSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let targetInvoice: Invoice | undefined;

    if (sessionId) {
      // Find or generate invoice for this dining session
      const existing = store.getInvoices().find((i) => i.sessionId === sessionId);
      if (existing) {
        targetInvoice = existing;
      } else {
        try {
          targetInvoice = store.requestSessionBill(sessionId);
        } catch {
          // Fallback
        }
      }
    } else if (orderId) {
      const order = store.getOrderById(orderId);
      if (order) {
        const rest = store.getRestaurantById(order.restaurantId);
        targetInvoice = {
          id: `inv-ord-${order.id}`,
          invoiceNumber: `INV-${order.orderNumber}`,
          restaurantId: order.restaurantId,
          restaurantName: rest?.name || 'Restaurant Partner',
          restaurantAddress: rest?.address || 'Waterfront District, San Francisco',
          restaurantGst: rest?.gstNumber || 'CA-94107-BISTRO',
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          serviceType: order.orderType,
          tableNumber: order.tableNumber,
          pickupCode: order.pickupCode,
          itemizedSummary: order.items.map((it) => ({
            name: it.itemName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          })),
          subtotal: order.subtotal,
          taxAmount: order.tax,
          serviceCharge: order.serviceCharge,
          totalAmount: order.totalAmount,
          paidAmount: order.advanceAmount,
          balanceDue: order.remainingBalance,
          paymentStatus: order.remainingBalance === 0 ? 'paid' : 'partial',
          createdAt: order.createdAt,
        };
      }
    }

    if (targetInvoice) {
      setInvoice(targetInvoice);
      // Generate QR payment code payload
      const qrPayload = `RESTOFLOW-PAY:${targetInvoice.invoiceNumber}:AMOUNT=${targetInvoice.balanceDue}:REST=${targetInvoice.restaurantId}`;
      QRCode.toDataURL(qrPayload, { width: 160, margin: 1, color: { dark: '#1c1917', light: '#ffffff' } })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, orderId, sessionId]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSettleBalance = (method: PaymentMethod = 'card') => {
    if (!invoice) return;
    setIsSettling(true);
    setTimeout(() => {
      if (sessionId) {
        store.settleDiningSession(sessionId, method);
      }
      setInvoice((prev) => prev ? {
        ...prev,
        paidAmount: prev.totalAmount,
        balanceDue: 0,
        paymentStatus: 'paid',
      } : null);
      setIsSettling(false);
      setSettledSuccess(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header - Not printed */}
        <div className="no-print px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900">Official Tax Invoice</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Print or Save PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-invoice" className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-900 bg-white">
          
          {/* Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">{invoice.restaurantName}</h3>
              <p className="text-xs text-stone-600 mt-0.5">{invoice.restaurantAddress}</p>
              {invoice.restaurantGst && (
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">GST Reg: {invoice.restaurantGst}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Tax Invoice</span>
              <div className="text-sm font-extrabold font-mono text-stone-900 mt-0.5">{invoice.invoiceNumber}</div>
              <div className="text-xs text-stone-500 mt-0.5">
                {new Date(invoice.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Customer & Dining Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div>
              <span className="text-stone-400 font-semibold uppercase text-[10px] tracking-wider">Billed To</span>
              <div className="font-bold text-stone-900 mt-0.5">{invoice.customerName}</div>
              {invoice.customerPhone && <div className="text-stone-500">{invoice.customerPhone}</div>}
            </div>

            <div>
              <span className="text-stone-400 font-semibold uppercase text-[10px] tracking-wider">Service Mode</span>
              <div className="font-bold text-stone-900 mt-0.5 capitalize">
                {invoice.serviceType.replace('_', ' ')}
                {invoice.tableNumber ? ` (${invoice.tableNumber})` : ''}
              </div>
              {invoice.pickupCode && (
                <div className="text-amber-700 font-bold font-mono">Pickup Code: {invoice.pickupCode}</div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Consolidated Items
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2 font-semibold">Item</th>
                  <th className="py-2 text-center font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Unit</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoice.itemizedSummary.map((item, idx) => (
                  <tr key={idx} className="text-stone-800">
                    <td className="py-2.5 font-medium">{item.name}</td>
                    <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono font-bold">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-stone-200 pt-4 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-stone-900">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax & VAT</span>
              <span className="font-mono font-medium text-stone-900">${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge & Hospitality Fee</span>
              <span className="font-mono font-medium text-stone-900">${invoice.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-stone-900 border-t border-stone-200 pt-2">
              <span>Grand Total</span>
              <span className="font-mono">${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-semibold pt-1">
              <span>Advance Paid Amount</span>
              <span className="font-mono">-${invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold border-t-2 border-stone-900 pt-2 text-stone-900">
              <span>Outstanding Balance Due</span>
              <span className="font-mono text-amber-600">${invoice.balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Settlement / QR Payment section */}
          {invoice.balanceDue > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-center gap-4">
              {qrDataUrl && (
                <div className="p-2 bg-white rounded-lg shadow-xs border border-amber-200 shrink-0">
                  <img src={qrDataUrl} alt="Settlement QR Code" className="w-24 h-24" />
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-amber-700" />
                  Scan to Settle Balance (${invoice.balanceDue.toFixed(2)})
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  Scan with any camera or UPI / card wallet to close table tab, or click below for instant settlement.
                </p>
                
                <div className="no-print pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    onClick={() => handleSettleBalance('card')}
                    disabled={isSettling}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Card (${invoice.balanceDue.toFixed(2)})</span>
                  </button>
                  <button
                    onClick={() => handleSettleBalance('upi')}
                    disabled={isSettling}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors"
                  >
                    <span>UPI Pay</span>
                  </button>
                  <button
                    onClick={() => handleSettleBalance('cash_counter')}
                    disabled={isSettling}
                    className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors"
                  >
                    <span>Cash at Counter</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Bill fully paid and settled! Thank you for dining with {invoice.restaurantName}.</span>
            </div>
          )}

        </div>

        {/* Footer Modal Action */}
        <div className="no-print px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
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
