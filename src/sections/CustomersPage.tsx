import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/types/order';
import { formatGbp, formatDate, getInitials } from '@/utils/format';
import { StatusBadge } from '@/components/StatusBadge';

interface CustomersPageProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

interface CustomerSummary {
  name: string;
  totalSpent: number;
  orderCount: number;
  lastOrder: Date;
  orders: Order[];
}

export function CustomersPage({ orders, onSelectOrder }: CustomersPageProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();
    for (const order of orders) {
      const ex = map.get(order.customer);
      if (ex) {
        ex.totalSpent += order.totalGbp;
        ex.orderCount += 1;
        ex.orders.push(order);
        if (order.createdAt > ex.lastOrder) ex.lastOrder = order.createdAt;
      } else {
        map.set(order.customer, {
          name: order.customer,
          totalSpent: order.totalGbp,
          orderCount: 1,
          lastOrder: order.createdAt,
          orders: [order],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, search]);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="px-4 pt-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
          <p className="text-2xl font-bold font-mono text-[#e8e8e8]">{customers.length}</p>
          <p className="text-xs text-[#4a4f5a] font-medium mt-0.5">Customers</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
          <p className="text-2xl font-bold font-mono text-[#22c55e]">{formatGbp(totalRevenue)}</p>
          <p className="text-xs text-[#4a4f5a] font-medium mt-0.5">Total Revenue</p>
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
          placeholder="Search customers..."
          className="w-full bg-[#141720] border border-[#1e2228] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#e8e8e8] placeholder-[#3a3f4a] outline-none focus:border-[#22c55e]/50 transition-colors"
        />
      </div>

      {/* Customer list */}
      <div className="space-y-2.5 pb-4">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#4a4f5a] text-sm">No customers found</p>
            </div>
          ) : (
            filtered.map((customer, i) => (
              <motion.div
                key={customer.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
                className="bg-[#141720] border border-[#1e2228] rounded-2xl overflow-hidden"
              >
                {/* Customer row */}
                <button
                  onClick={() => setExpanded(expanded === customer.name ? null : customer.name)}
                  className="w-full flex items-center gap-3 p-4 text-left active:bg-[#1a1f2a] transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-[#1e2228] flex items-center justify-center text-sm font-bold text-[#e8e8e8] shrink-0">
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#e8e8e8]">{customer.name}</p>
                    <p className="text-xs text-[#4a4f5a] mt-0.5">{customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-[#22c55e]">{formatGbp(customer.totalSpent)}</p>
                    <p className="text-[10px] text-[#4a4f5a] mt-0.5">total spent</p>
                  </div>
                  <svg
                    className={`text-[#4a4f5a] shrink-0 transition-transform duration-200 ml-1 ${expanded === customer.name ? 'rotate-180' : ''}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Expanded orders */}
                <AnimatePresence>
                  {expanded === customer.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#1e2228] px-4 py-3 space-y-2">
                        {customer.orders
                          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                          .map((order) => (
                            <button
                              key={order.id}
                              onClick={() => onSelectOrder(order)}
                              className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-[#1a1f2a] active:bg-[#1e2430] transition-colors text-left"
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-[#e8e8e8] font-medium truncate">{order.item}</p>
                                <p className="text-[11px] text-[#4a4f5a] font-mono mt-0.5">{order.orderNumber} · {formatDate(order.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold font-mono text-[#e8e8e8]">{formatGbp(order.totalGbp)}</span>
                                <StatusBadge status={order.status} />
                              </div>
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
