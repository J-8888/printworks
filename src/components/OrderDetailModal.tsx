import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { IconX, IconTrash } from '@/icons';
import { formatGbp, formatDate, STATUS_CONFIG } from '@/utils/format';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}

const STATUSES: OrderStatus[] = ['Pending', 'Printing', 'Payment Required', 'Collected'];

export function OrderDetailModal({ order, onClose, onStatusChange, onDelete }: OrderDetailModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (order) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, onClose]);

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-[#1a1d23] border-l border-[#2e333d] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#2e333d]">
              <div>
                <p className="text-xs text-[#8a8f9a] font-mono">{order.orderNumber}</p>
                <h2 id="detail-title" className="text-base font-semibold text-[#e8e8e8] mt-0.5">
                  {order.customer}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e] transition-colors"
                aria-label="Close"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Order info */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">Item</span>
                  <span className="text-sm text-[#e8e8e8] font-medium text-right max-w-[60%]">{order.item}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">Total</span>
                  <span className="text-lg font-bold text-[#e8e8e8] font-mono">{formatGbp(order.totalGbp)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">Created</span>
                  <span className="text-sm text-[#8a8f9a]">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">Status</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Status change */}
              <div>
                <p className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold mb-3">Update Status</p>
                <div className="space-y-2">
                  {STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const active = order.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => onStatusChange(order.id, s)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                          active
                            ? `border-current ${cfg.text} bg-[#22262e]`
                            : 'border-[#2e333d] text-[#8a8f9a] hover:border-[#3e434d] hover:text-[#e8e8e8]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${active ? cfg.dot : 'bg-[#3e434d]'}`} />
                        {s}
                        {active && <span className="ml-auto text-xs opacity-60">Current</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2e333d]">
              <button
                onClick={() => { onDelete(order.id); onClose(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
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
