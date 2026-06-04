import React from 'react';
import { motion } from 'framer-motion';
import type { Order } from '@/types/order';
import { IconClipboard, IconPound, IconPrinter, IconBox, IconTrendUp } from '@/icons';
import { formatGbp } from '@/utils/format';

interface StatsProps {
  orders: Order[];
}

export function Stats({ orders }: StatsProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalGbp, 0);
  const printingNow = orders.filter((o) => o.status === 'Printing').length;
  const awaitingCollection = orders.filter((o) => o.status === 'Payment Required' || o.status === 'Collected').length;

  const cards = [
    {
      icon: <IconClipboard className="text-[#22c55e]" size={20} />,
      label: 'TOTAL ORDERS',
      value: orders.length.toString(),
      sub: 'All time',
      trend: '+16%',
    },
    {
      icon: <IconPound className="text-[#22c55e]" size={20} />,
      label: 'TOTAL REVENUE (GBP)',
      value: formatGbp(totalRevenue),
      sub: 'All time',
      trend: '+12%',
    },
    {
      icon: <IconPrinter className="text-[#22c55e]" size={20} />,
      label: 'PRINTING NOW',
      value: printingNow.toString(),
      sub: 'Active jobs',
      trend: null,
    },
    {
      icon: <IconBox className="text-[#22c55e]" size={20} />,
      label: 'AWAITING COLLECTION',
      value: awaitingCollection.toString(),
      sub: 'Ready to collect',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#1a1d23] border border-[#2e333d] rounded-xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#22262e] border border-[#2e333d] flex items-center justify-center shrink-0">
              {card.icon}
            </div>
            <span className="text-[10px] font-bold text-[#8a8f9a] uppercase tracking-widest text-right leading-tight max-w-[120px]">
              {card.label}
            </span>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold font-mono text-[#e8e8e8] leading-none">{card.value}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-[#8a8f9a]">{card.sub}</span>
              {card.trend && (
                <span className="flex items-center gap-0.5 text-xs font-semibold text-[#22c55e]">
                  <IconTrendUp size={12} />
                  {card.trend}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
