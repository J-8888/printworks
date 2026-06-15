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
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-[#2e333d] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2228] shrink-0">
              <div>
                <p className="text-xs text-[#4a4f5a] font-mono">{order.orderNumber}</p>
                <h2 id="detail-title" className="text-base font-bold text-[#e8e8e8] mt-0.5">{order.customer}</h2>
                {order.email && <p className="text-xs text-[#4a4f5a] mt-0.5">✉️ {order.email}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[#4a4f5a] hover:text-[#e8e8e8] hover:bg-[#1e2228] transition-colors" aria-label="Close">
                <IconX size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Order info */}
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

              {/* Email info */}
              {order.email && (
                <div className="bg-[#0e1014] rounded-2xl p-4">
                  <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-1">Automated Emails</p>
                  <p className="text-xs text-[#8a8f9a] leading-relaxed">
                    A confirmation email was sent when this order was placed. A "Ready to Collect" email will be sent automatically when you mark this order as <span className="text-blue-400 font-semibold">Collected</span>.
                  </p>
                </div>
              )}

              {/* Price editor */}
              <div>
                <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-2">Price (GBP)</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8f9a] text-sm font-semibold">£</span>
                    <input
                      type="number" min="0" step="0.01" value={price}
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

              {/* Notes */}
              <div>
                <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-2">Notes</p>
                <textarea
                  value={notes}
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

              {/* Status */}
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

              {/* Delete */}
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
