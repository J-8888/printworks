import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/types/order';
import { StatusBadge } from '@/components/StatusBadge';
import { IconSearch, IconChevronRight, IconBox } from '@/icons';
import { formatGbp, formatDate, getInitials } from '@/utils/format';

interface ArchivePageProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

type SortKey = 'createdAt' | 'customer' | 'totalGbp';
type SortDir = 'asc' | 'desc';

export function ArchivePage({ orders, onSelectOrder }: ArchivePageProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else if (sortKey === 'customer') cmp = a.customer.localeCompare(b.customer);
      else if (sortKey === 'totalGbp') cmp = a.totalGbp - b.totalGbp;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [orders, search, sortKey, sortDir]);

  const totalRevenue = orders.reduce((s, o) => s + o.totalGbp, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8e8]">Archive</h1>
          <p className="text-sm text-[#8a8f9a] mt-0.5">All collected orders</p>
        </div>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f9a]" size={14} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive..."
            className="w-full sm:w-52 bg-[#1a1d23] border border-[#2e333d] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e8e8e8] placeholder-[#4a4f5a] outline-none focus:border-[#22c55e] transition-colors"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1a1d23] border border-[#2e333d] rounded-xl p-4">
          <p className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">Collected Orders</p>
          <p className="text-2xl font-bold font-mono text-[#e8e8e8] mt-1">{orders.length}</p>
        </div>
        <div className="bg-[#1a1d23] border border-[#2e333d] rounded-xl p-4">
          <p className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">Revenue Collected</p>
          <p className="text-2xl font-bold font-mono text-[#3b82f6] mt-1">{formatGbp(totalRevenue)}</p>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="bg-[#1a1d23] border border-[#2e333d] rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#22262e] border border-[#2e333d] flex items-center justify-center">
            <IconBox className="text-[#8a8f9a]" size={24} />
          </div>
          <p className="text-sm text-[#8a8f9a]">No collected orders yet</p>
          <p className="text-xs text-[#4a4f5a]">Orders marked as Collected will appear here</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#1a1d23] border border-[#2e333d] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2e333d]">
                  {[
                    { label: 'CUSTOMER', key: 'customer' as SortKey },
                    { label: 'ITEM', key: null },
                    { label: 'TOTAL (GBP)', key: 'totalGbp' as SortKey },
                    { label: 'COLLECTED', key: 'createdAt' as SortKey },
                    { label: '', key: null },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`px-5 py-3.5 text-left text-[11px] font-bold text-[#8a8f9a] uppercase tracking-widest ${col.key ? 'cursor-pointer hover:text-[#e8e8e8] select-none' : ''}`}
                      onClick={col.key ? () => {
                        if (sortKey === col.key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
                        else { setSortKey(col.key!); setSortDir('desc'); }
                      } : undefined}
                    >
                      {col.label}
                      {col.key && sortKey === col.key && (
                        <span className="ml-1 text-[#3b82f6]">{sortDir === 'asc' ? '↑' : '↓'}</span>
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
                        No results found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.02 }}
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
                          <span className="text-sm text-[#8a8f9a]">{formatDate(order.createdAt)}</span>
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
                <p className="text-center text-sm text-[#8a8f9a] py-10">No results found</p>
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
                        <p className="text-xs text-[#8a8f9a] mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
