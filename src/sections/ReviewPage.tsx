import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/api/orders';
import type { Order } from '@/types/order';
import { formatDate } from '@/utils/format';

interface ReviewPageProps {
  orders: Order[];
  onReviewed: () => void;
}

export function ReviewPage({ orders, onReviewed }: ReviewPageProps) {
  const [denyReason, setDenyReason] = useState('');
  const [showDenyFor, setShowDenyFor] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAccept(order: Order) {
    setProcessing(order.id);
    await api.reviewOrder(order.id, 'accept');
    const msg = encodeURIComponent(`Hi ${order.customer}! Your Printworks Order has been accepted. We'll let you know when it's ready!`);
    if (order.phone) window.open(`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    await onReviewed();
    setProcessing(null);
  }

  async function handleDeny(order: Order) {
    if (!denyReason.trim()) return;
    setProcessing(order.id);
    await api.reviewOrder(order.id, 'deny', denyReason);
    const msg = encodeURIComponent(`Hi ${order.customer}. Your PrintWorks Order has been declined because ${denyReason}. You might get a follow up message with more info.`);
    if (order.phone) window.open(`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    setShowDenyFor(null);
    setDenyReason('');
    await onReviewed();
    setProcessing(null);
  }

  return (
    <div className="px-4 pt-4">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#e8e8e8]">Review Queue</h1>
        <p className="text-sm text-[#4a4f5a] mt-0.5">
          {orders.length === 0 ? 'No orders waiting' : `${orders.length} order${orders.length !== 1 ? 's' : ''} waiting for review`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#141720] border border-[#1e2228] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#3a3f4a]">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
          </div>
          <p className="text-[#4a4f5a] text-sm">All caught up — no orders to review</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          <AnimatePresence initial={false}>
            {orders.map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
                className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">

                {/* Order info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1e2228] flex items-center justify-center text-xs font-bold text-[#e8e8e8] shrink-0">
                    {order.customer.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#e8e8e8]">{order.customer}</p>
                    <p className="text-xs text-[#8a8f9a] mt-0.5 leading-relaxed">{order.item}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[11px] text-[#4a4f5a] font-mono">{order.orderNumber}</p>
                      <p className="text-[11px] text-[#4a4f5a]">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.phone && (
                      <p className="text-xs text-[#4a4f5a] mt-0.5">📱 {order.phone}</p>
                    )}
                    {order.totalGbp > 0 && (
                      <p className="text-xs text-[#4a4f5a] mt-0.5">Budget: £{order.totalGbp.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* Deny reason input */}
                <AnimatePresence>
                  {showDenyFor === order.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden mb-3">
                      <textarea
                        value={denyReason}
                        onChange={e => setDenyReason(e.target.value)}
                        placeholder="Reason for declining..."
                        rows={2}
                        className="w-full bg-[#0e1014] border border-[#1e2228] rounded-2xl px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-red-500/50 transition-colors resize-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                {showDenyFor === order.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => { setShowDenyFor(null); setDenyReason(''); }}
                      className="flex-1 py-3 rounded-2xl border border-[#1e2228] text-[#4a4f5a] text-sm font-semibold hover:text-[#e8e8e8] transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleDeny(order)} disabled={!denyReason.trim() || processing === order.id}
                      className="flex-1 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-bold disabled:opacity-50 transition-colors hover:bg-red-500/25">
                      {processing === order.id ? 'Sending...' : 'Confirm & WhatsApp'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(order)} disabled={processing === order.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-sm font-bold disabled:opacity-50 transition-colors hover:bg-[#22c55e]/20">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Accept
                    </button>
                    <button onClick={() => { setShowDenyFor(order.id); setDenyReason(''); }}
                      className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold transition-colors hover:bg-red-500/20">
                      Deny
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
