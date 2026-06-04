import React, { useState, useCallback, useEffect } from 'react';
import { Nav } from '@/sections/Nav';
import { Stats } from '@/sections/Stats';
import { OrdersTable } from '@/sections/OrdersTable';
import { AddOrderModal } from '@/components/AddOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import type { Order, OrderStatus } from '@/types/order';
import * as api from '@/api/orders';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.fetchOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(
    async (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
      const order = await api.createOrder(data);
      setOrders((prev) => [order, ...prev]);
    },
    []
  );

  const handleStatusChange = useCallback(async (id: string, status: OrderStatus) => {
    const updated = await api.updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    setSelectedOrder((prev) => (prev?.id === id ? updated : prev));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await api.deleteOrder(id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  if (loading) {
    return (
      <>
        <Nav onNewOrder={() => setAddOpen(true)} />
        <main className="max-w-[1340px] mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-[#8a8f9a]">Loading orders...</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav onNewOrder={() => setAddOpen(true)} />
      <main className="max-w-[1340px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <Stats orders={orders} />
        <OrdersTable orders={orders} onSelectOrder={setSelectedOrder} />
      </main>

      <AddOrderModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </>
  );
}
