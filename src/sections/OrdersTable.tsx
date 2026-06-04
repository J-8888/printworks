import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/StatusBadge';
import { IconSearch, IconChevronDown, IconChevronRight } from '@/icons';
import { formatGbp, formatDate, getInitials } from '@/utils/format';

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

type SortKey = 'createdAt' | 'customer' | 'totalGbp';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES = 'All Statuses';
const STATUS_OPTIONS: (OrderStatus | typeof ALL_STATUSES)[] = [
  ALL_STATUSES,
  'Pending',
  'Printing',
  'Payment Required',
  'Collected',
];

export function OrdersTable({ orders, onSelectOrder }: OrdersTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | typeof ALL_STATUSES>(ALL_STATUSES);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.item.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== ALL_STATUSES) {
      result = result.filter((o) => o.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else if (sortKey === 'customer') cmp = a.customer.localeCompare(b.customer);
      else if (sortKey === 'totalGbp') cmp = a.totalGbp - b.totalGbp;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [orders, search, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setSortOpen(false);
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'createdAt', label: 'Newest First' },
    { key: 'totalGbp', label: 'Highest Value' },
    { key: 'customer', label: 'Customer A–Z' },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-[#e8e8e8]">Customer Orders</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f9a]" size={14} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full sm:w-52 bg-[#1a1d23] border border-[#2e333d] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e8e8e8] placeholder-[#4a4f5a] outline-none focus:border-[#22c55e] transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => { setStatusOpen((v) => !v); setSortOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1d23] border border-[#2e333d] rounded-lg text-sm text-[#8a8f9a] hover:text-[#e8e8e8] hover:border-[#3e434d] transition-colors whitespace-nowrap"
            >
              {statusFilter}
              <IconChevronDown size={14} />
            </button>
            <AnimatePresence>
              {statusOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-[#1a1d23] border border-[#2e333d] rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        statusFilter === s
                          ? 'text-[#22c55e] bg-[#22c55e]/10'
                          : 'text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => { setSortOpen((v) => !v); setStatusOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1d23] border border-[#2e333d] rounded-lg text-sm text-[#8a8f9a] hover:text-[#e8e8e8] hover:border-[#3e434d] transition-colors whitespace-nowrap"
            >
              {SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Sort'}
              <IconChevronDown size={14} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-[#1a1d23] border border-[#2e333d] rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => toggleSort(opt.key)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        sortKey === opt.key
                          ? 'text-[#22c55e] bg-[#22c55e]/10'
                          : 'text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-[#1a1d23] border border-[#2e333d] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2e333d]">
              {[
                { label: 'CUSTOMER', key: 'customer' as SortKey },
                { label: 'ITEM', key: null },
                { label: 'TOTAL (GBP)', key: 'totalGbp' as SortKey },
                { label: 'STATUS', key: null },
                { label: '', key: null },
              ].map((col) => (
                <th
                  key={col.label}
                  className={`px-5 py-3.5 text-left text-[11px] font-bold text-[#8a8f9a] uppercase tracking-widest ${col.key ? 'cursor-pointer hover:text-[#e8e8e8] select-none' : ''}`}
                  onClick={col.key ? () => toggleSort(col.key!) : undefined}
                >
                  {col.label}
                  {col.key && sortKey === col.key && (
                    <span className="ml-1 text-[#22c55e]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#8a8f9a]">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    onClick={() => onSelectOrder(order)}
                    className="border-b border-[#2e333d] last:border-0 hover:bg-[#22262e] cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#22262e] border border-[#2e333d] flex items-center justify-center text-xs font-bold text-[#e8e8e8] shrink-0 group-hover:border-[#3e434d] transition-colors">
                          {getInitials(order.customer)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#e8e8e8]">{order.customer}</p>
                          <p className="text-xs text-[#8a8f9a] font-mono">{order.orderNumber}</p>
                          <p className="text-xs text-[#8a8f9a]">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-[#e8e8e8] font-medium">{order.item}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold font-mono text-[#e8e8e8]">{formatGbp(order.totalGbp)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <IconChevronRight className="text-[#8a8f9a] group-hover:text-[#e8e8e8] transition-colors ml-auto" size={16} />
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[#8a8f9a] py-10">No orders found</p>
          ) : (
            filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                onClick={() => onSelectOrder(order)}
                className="bg-[#1a1d23] border border-[#2e333d] rounded-xl p-4 cursor-pointer hover:border-[#3e434d] transition-colors active:bg-[#22262e]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#22262e] border border-[#2e333d] flex items-center justify-center text-xs font-bold text-[#e8e8e8] shrink-0">
                      {getInitials(order.customer)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#e8e8e8] truncate">{order.customer}</p>
                      <p className="text-xs text-[#8a8f9a] truncate">{order.item}</p>
                      <p className="text-xs text-[#8a8f9a] font-mono">{order.orderNumber}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-[#e8e8e8]">{formatGbp(order.totalGbp)}</p>
                    <div className="mt-1.5">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
