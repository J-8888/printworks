import { Order } from '@/api/orders';

interface Props {
  orders: Order[];
}

export default function AnalyticsPage({ orders }: Props) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalGbp, 0);
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => {
    const name = o.item.toLowerCase();
    itemCounts[name] = (itemCounts[name] || 0) + 1;
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">📊 Order Analytics</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{totalOrders}</div>
          <div className="text-gray-500">Total Orders</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">£{totalRevenue.toFixed(2)}</div>
          <div className="text-gray-500">Total Revenue</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">{orders.filter(o => o.status === 'Collected').length}</div>
          <div className="text-gray-500">Completed</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold text-lg mb-3">🔥 Most Ordered Items</h3>
        {topItems.length === 0 ? <p className="text-gray-400">No data yet</p> : (
          <div className="space-y-2">
            {topItems.map(([name, count], i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2">
                <span className="capitalize">{name}</span>
                <span className="font-bold text-blue-600">{count} order{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
