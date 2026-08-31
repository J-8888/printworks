import React from 'react';
import type { Order } from '@/types/order';
import { formatGbp } from '@/utils/format';

interface AnalyticsPageProps {
  orders: Order[];
}

export function AnalyticsPage({ orders }: AnalyticsPageProps) {
  const reviewed = orders.filter(o => o.reviewed);
  const totalRevenue = reviewed.reduce((sum, o) => sum + o.totalGbp, 0);
  const completed = reviewed.filter(o => o.status === 'Collected').length;
  const printing = reviewed.filter(o => o.status === 'Printing').length;

  // Orders per day (last 7 days)
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const ordersPerDay = days.map(d => ({
    label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    count: reviewed.filter(o => {
      const od = new Date(o.createdAt);
      return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    }).length,
  }));
  const maxDay = Math.max(...ordersPerDay.map(d => d.count), 1);

  // Top items
  const itemCounts: Record<string, number> = {};
  reviewed.forEach(o => {
    const key = o.item.toLowerCase().trim();
    itemCounts[key] = (itemCounts[key] || 0) + 1;
  });
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4 space-y-5">
      <h2 className="text-sm font-bold text-[#e8e8e8] uppercase tracking-wider">Analytics</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Total Orders', value: String(reviewed.length), color: 'text-[#e8e8e8]' },
          { label: 'Revenue', value: formatGbp(totalRevenue), color: 'text-[#22c55e]' },
          { label: 'Completed', value: String(completed), color: 'text-blue-400' },
          { label: 'Printing', value: String(printing), color: 'text-[#22c55e]' },
        ].map(s => (
          <div key={s.label} className="bg-[#0e1014] rounded-xl p-3">
            <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#4a4f5a] font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Orders per day bar chart */}
      <div>
        <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-3">Orders — Last 7 Days</p>
        <div className="flex items-end gap-1 h-20">
          {ordersPerDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-[#22c55e]/20 relative flex items-end justify-center"
                style={{ height: '60px' }}>
                <div className="w-full rounded-t-lg bg-[#22c55e] transition-all duration-500"
                  style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
              </div>
              <p className="text-[9px] text-[#4a4f5a]">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top items */}
      <div>
        <p className="text-xs text-[#4a4f5a] uppercase tracking-wider font-semibold mb-3">Most Ordered</p>
        {topItems.length === 0 ? (
          <p className="text-xs text-[#4a4f5a]">No data yet</p>
        ) : (
          <div className="space-y-2">
            {topItems.map(([name, count], i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-[#e8e8e8] truncate capitalize">{name}</p>
                    <p className="text-xs text-[#22c55e] font-bold ml-2 shrink-0">{count}</p>
                  </div>
                  <div className="h-1.5 bg-[#0e1014] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22c55e] rounded-full"
                      style={{ width: `${(count / (topItems[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
