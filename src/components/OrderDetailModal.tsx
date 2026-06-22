import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { IconX, IconTrash } from '@/icons';
import { formatGbp, formatDate, STATUS_CONFIG } from '@/utils/format';
import * as api from '@/api/orders';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}

const STATUSES: OrderStatus[] = ['Pending', 'Printing', 'Payment Required', 'Collected'];

function formatPhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^0/, '44');
}

export function OrderDetailModal({ order, onClose, onStatusChange, onDelete }: OrderDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [notesChanged, setNotesChanged] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  useEffect(() => {
    if (order) {
      setNotes(order.notes || '');
      setPrice(order.totalGbp > 0 ? order.totalGbp.toFixed(2) : '');
      setNotesChanged(false);
      setPriceChanged(false);
    }
  }, [order]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (order) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, onClose]);

  const saveNotes = useCallback(async () => {
    if (!order || !notesChanged) return;
    setSavingNotes(true);
    await api.updateOrder(order.id, { notes });
    setSavingNotes(false);
    setNotesChanged(false);
  }, [order, notes, notesChanged]);

  const savePrice = useCallback(async () => {
    if (!order || !priceChanged) return;
    const num = parseFloat(price);
    if (isNaN(num) || num < 0) return;
    setSavingPrice(true);
    await api.updateOrder(order.id, { totalGbp: parseFloat(num.toFixed(2)) });
    setSavingPrice(false);
    setPriceChanged(false);
  }, [order, price, priceChanged]);

  function openWhatsApp(message: string) {
    if (!order?.phone) return;
    const phone = formatPhone(order.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function sendOrderConfirmation() {
    if (!order) return;
    const msg = `Hi ${order.customer}! Your Printworks order has been received. Order number: ${order.orderNumber}. Item: ${order.item}. We will message you when it is ready to collect!`;
    openWhatsApp(msg);
  }

  function sendReadyToCollect() {
    if (!order) return;
    const priceText = order.totalGbp > 0 ? ` Total: ${formatGbp(order.totalGbp)}.` : '';
    const msg = `Hi ${order.customer}! Great news - your 3D print is ready to collect! Order: ${order.item} (${order.orderNumber}).${priceText} Pop in whenever suits you!`;
    openWhatsApp(msg);
  }

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose} aria-hidden="true"
          />
          <motion.div
            key="detail" role="dialog" aria-modal="true" aria-labelledby="detail-title"
            initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#141720] border-t border-[#1e2228] rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-[#2e333d] rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2228] shrink-0">
              <div>
                <p className="text-xs text-[#4a4f5a] font-mono">{order.orderNumber}</p>
                <h2 id="detail-title" className="text-base font-bold text-[#e8e8e8] mt-0.5">{order.customer}</h2>
                {order.phone && <p className="text-xs text-[#4a4f5a] mt-0.5">{order.phone}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[#4a4f5a] hover:text-[#e8e8e8] hover:bg-[#1e2228] transition-colors" aria-label="Close">
                <IconX size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              <div className="bg-[#0e1014] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold">Item</span>
                  <span className="text-sm text-[#e8e8e8] font-medium text-right max-w-[60%]">{order.item}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold">Created</span>
                  <span className="text-sm text-[#8a8f9a]">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold">Status</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {order.phone && (
                <div className="space-y-2">
                  <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold">WhatsApp</p>
                  <button onClick={sendOrderConfirmation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-[#1e2228] text-[#8a8f9a] hover:border-[#25d366]/40 hover:text-[#25d366] text-sm font-semibold transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Send Order Confirmation
                  </button>
                  <button onClick={sendReadyToCollect}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#25d366]/10 border border-[#25d366]/30 text-[#25d366] hover:bg-[#25d366]/20 text-sm font-bold transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Send Ready to Collect
                  </button>
                </div>
              )}

              <div>
                <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-2">Price (GBP)</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8f9a] text-sm font-semibold">£</span>
                    <input type="number" min="0" step="0.01" value={price}
                      onChange={e => { setPrice(e.target.value); setPriceChanged(true); }}
                      onBlur={savePrice} placeholder="0.00"
                      className="w-full bg-[#0e1014] border border-[#1e2228] rounded-2xl pl-7 pr-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors"
                    />
                  </div>
                  {priceChanged && (
                    <button onClick={savePrice} disabled={savingPrice}
                      className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-bold rounded-2xl transition-colors shrink-0">
                      {savingPrice ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-2">Notes</p>
                <textarea value={notes}
                  onChange={e => { setNotes(e.target.value); setNotesChanged(true); }}
                  onBlur={saveNotes}
                  placeholder="Filament colour, infill %, print settings..."
                  rows={3}
                  className="w-full bg-[#0e1014] border border-[#1e2228] rounded-2xl px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors resize-none"
                />
                {notesChanged && (
                  <button onClick={saveNotes} disabled={savingNotes}
                    className="mt-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-bold rounded-2xl transition-colors">
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-3">Update Status</p>
                <div className="space-y-2">
                  {STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const active = order.status === s;
                    return (
                      <button key={s} onClick={() => onStatusChange(order.id, s)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-colors ${
                          active ? `border-current ${cfg.text} bg-[#0e1014]` : 'border-[#1e2228] text-[#4a4f5a] hover:border-[#2e333d] hover:text-[#e8e8e8]'
                        }`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${active ? cfg.dot : 'bg-[#2e333d]'}`} />
                        {s}
                        {active && <span className="ml-auto text-xs opacity-60">Current</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => { onDelete(order.id); onClose(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors mb-4"
              >
                <IconTrash size={14} />
                Delete Order
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
