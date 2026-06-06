import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '@/types/order';
import { formatGbp, formatDate, getInitials } from '@/utils/format';
import { IconSearch, IconChevronRight } from '@/icons';
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
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();
    for (const order of orders) {
      const existing = map.get(order.customer);
      if (existing) {
        existing.totalSpent += order.totalGbp;
        existing.orderCount += 1;
        existing.orders.push(order);
        if (order.createdAt > existing.lastOrder) existing.lastOrder = order.createdAt;
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8e8]">Customers</h1>
          <p className="text-sm text-[#8a8f9a] mt-0.5">{customers.length} total customers</p>
        </div>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f9a]" size={14} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full sm:w-52 bg-[#1a1d23] border border-[#2e333d] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e8e8e8] placeholder-[#4a4f5a] outline-none focus:border-[#22c55e] transition-colors"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Customers', value: customers.length.toString() },
          { label: 'Total Revenue', value: formatGbp(customers.reduce((s, c) => s + c.totalSpent, 0)) },
          { label: 'Avg. Order Value', value: orders.length ? formatGbp(orders.reduce((s, o) => s + o.totalGbp, 0) / orders.length) : '£0.00' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1d23] border border-[#2e333d] rounded-xl p-4">
            <p className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold">{stat.label}</p>
            <p className="text-2xl font-bold font-mono text-[#e8e8e8] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[#8a8f9a] py-10">No customers found</p>
          ) : (
            filtered.map((customer, i) => (
              <motion.div
                key={customer.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                className="bg-[#1a1d23] border border-[#2e333d] rounded-xl overflow-hidden"
              >
                {/* Customer row */}
                <button
                  onClick={() => setExpandedCustomer(expandedCustomer === customer.name ? null : customer.name)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#22262e] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#22262e] border border-[#2e333d] flex items-center justify-center text-sm font-bold text-[#e8e8e8] shrink-0">
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#e8e8e8]">{customer.name}</p>
                    <p className="text-xs text-[#8a8f9a] mt-0.5">Last order {formatDate(customer.lastOrder)}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[#8a8f9a] uppercase tracking-wider">Orders</p>
                      <p className="text-sm font-bold font-mono text-[#e8e8e8]">{customer.orderCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8a8f9a] uppercase tracking-wider">Total Spent</p>
                      <p className="text-sm font-bold font-mono text-[#22c55e]">{formatGbp(customer.totalSpent)}</p>
                    </div>
                  </div>
                  {/* Mobile totals */}
                  <div className="sm:hidden text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-[#22c55e]">{formatGbp(customer.totalSpent)}</p>
                    <p className="text-xs text-[#8a8f9a]">{customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}</p>
                  </div>
                  <IconChevronRight
                    className={`text-[#8a8f9a] shrink-0 transition-transform duration-200 ${expandedCustomer === customer.name ? 'rotate-90' : ''}`}
                    size={16}
                  />
                </button>

                {/* Expanded orders */}
                <AnimatePresence>
                  {expandedCustomer === customer.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#2e333d] px-5 py-3 space-y-2">
                        <p className="text-xs text-[#8a8f9a] uppercase tracking-wider font-semibold mb-3">Order History</p>
                        {customer.orders
                          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                          .map((order) => (
                            <button
                              key={order.id}
                              onClick={() => onSelectOrder(order)}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#22262e] hover:bg-[#2a2f38] transition-colors text-left"
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-[#e8e8e8] font-medium truncate">{order.item}</p>
                                <p className="text-xs text-[#8a8f9a] font-mono">{order.orderNumber} · {formatDate(order.createdAt)}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
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
