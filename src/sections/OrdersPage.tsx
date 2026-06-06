import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/StatusBadge';
import { formatGbp, formatDate, getInitials } from '@/utils/format';

interface OrdersPageProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

const STATUS_FILTERS: (OrderStatus | 'All')[] = ['All', 'Pending', 'Printing', 'Payment Required'];

export function OrdersPage({ orders, onSelectOrder }: OrdersPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');

  const filtered = useMemo(() => {
    let result = [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (statusFilter !== 'All') result = result.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) => o.customer.toLowerCase().includes(q) || o.item.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'Pending').length,
    printing: orders.filter((o) => o.status === 'Printing').length,
    payment: orders.filter((o) => o.status === 'Payment Required').length,
  };

  return (
    <div className="px-4 pt-4">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#e8e8e8]' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Printing', value: stats.printing, color: 'text-[#22c55e]' },
          { label: 'Payment', value: stats.payment, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#141720] border border-[#1e2228] rounded-2xl p-3 text-center">
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#4a4f5a] font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4f5a]" width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="w-full bg-[#141720] border border-[#1e2228] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#e8e8e8] placeholder-[#3a3f4a] outline-none focus:border-[#22c55e]/50 transition-colors"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-[#22c55e] text-black'
                : 'bg-[#141720] border border-[#1e2228] text-[#8a8f9a]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className="space-y-2.5 pb-4">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#4a4f5a] text-sm">No orders found</p>
            </div>
          ) : (
            filtered.map((order, i) => (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
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
                      <p className="text-sm font-bold font-mono text-[#e8e8e8] shrink-0">{formatGbp(order.totalGbp)}</p>
                    </div>
                    <p className="text-xs text-[#8a8f9a] truncate mt-0.5">{order.item}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <p className="text-[11px] text-[#4a4f5a] font-mono">{order.orderNumber}</p>
                      <StatusBadge status={order.status} />
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
