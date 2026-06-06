import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/types/order';
import { formatGbp, formatDate, getInitials } from '@/utils/format';

interface ArchivePageProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export function ArchivePage({ orders, onSelectOrder }: ArchivePageProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) => o.customer.toLowerCase().includes(q) || o.item.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search]);

  const totalRevenue = orders.reduce((s, o) => s + o.totalGbp, 0);

  return (
    <div className="px-4 pt-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
          <p className="text-2xl font-bold font-mono text-[#3b82f6]">{orders.length}</p>
          <p className="text-xs text-[#4a4f5a] font-medium mt-0.5">Collected</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
          <p className="text-2xl font-bold font-mono text-[#3b82f6]">{formatGbp(totalRevenue)}</p>
          <p className="text-xs text-[#4a4f5a] font-medium mt-0.5">Revenue</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4f5a]" width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search archive..."
          className="w-full bg-[#141720] border border-[#1e2228] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#e8e8e8] placeholder-[#3a3f4a] outline-none focus:border-[#3b82f6]/50 transition-colors"
        />
      </div>

      {/* Archived order cards */}
      <div className="space-y-2.5 pb-4">
        <AnimatePresence initial={false}>
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#141720] border border-[#1e2228] flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#3a3f4a]">
                  <rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[#4a4f5a] text-sm">No collected orders yet</p>
              <p className="text-[#3a3f4a] text-xs mt-1">Orders marked as Collected appear here</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#4a4f5a] text-sm">No results found</p>
            </div>
          ) : (
            filtered.map((order, i) => (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, delay: i * 0.03 }}
                onClick={() => onSelectOrder(order)}
                className="w-full bg-[#141720] border border-[#1e2228] rounded-2xl p-4 text-left active:scale-[0.98] active:bg-[#1a1f2a] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e2228] flex items-center justify-center text-xs font-bold text-[#e8e8e8] shrink-0">
                    {getInitials(order.customer)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#e8e8e8] truncate">{order.customer}</p>
                      <p className="text-sm font-bold font-mono text-[#3b82f6] shrink-0">{formatGbp(order.totalGbp)}</p>
                    </div>
                    <p className="text-xs text-[#8a8f9a] truncate mt-0.5">{order.item}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-[#4a4f5a] font-mono">{order.orderNumber}</p>
                      <p className="text-[11px] text-[#4a4f5a]">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
