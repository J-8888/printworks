import React, { useState, useCallback, useEffect } from 'react';
import { BottomNav } from '@/sections/BottomNav';
import { OrdersPage } from '@/sections/OrdersPage';
import { CustomersPage } from '@/sections/CustomersPage';
import { ArchivePage } from '@/sections/ArchivePage';
import { AddOrderModal } from '@/components/AddOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import type { Order, OrderStatus } from '@/types/order';
import * as api from '@/api/orders';

export type Page = 'orders' | 'customers' | 'archive';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState<Page>('orders');

  // Redirect to login if no token
  useEffect(() => {
    if (!localStorage.getItem('pw_token')) {
      window.location.href = '/login.html';
    }
  }, []);

 useEffect(() => {
    if (!sessionStorage.getItem('pw_token')) {
      sessionStorage.removeItem('pw_token');
      window.location.href = '/login.html';
    }
    // Clear token on page unload so refresh forces re-login
    const clear = () => sessionStorage.removeItem('pw_token');
    window.addEventListener('beforeunload', clear);
    return () => window.removeEventListener('beforeunload', clear);
  }, []);
  
  const handleAdd = useCallback(
    async (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
      const order = await api.createOrder(data);
      setOrders((prev) => [order, ...prev]);
    }, []
  );

  const handleStatusChange = useCallback(async (id: string, status: OrderStatus) => {
    const updated = await api.updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    setSelectedOrder((prev) => (prev?.id === id ? updated : prev));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await api.deleteOrder(id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setSelectedOrder(null);
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'Collected');
  const archivedOrders = orders.filter((o) => o.status === 'Collected');

  return (
    <div className="min-h-screen bg-[#0e1014] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0e1014]/95 backdrop-blur-md border-b border-[#1e2228] px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#22c55e]/15 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 2V18M2 6.5L18 6.5" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[#e8e8e8] tracking-tight">PRINTWORKS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22c55e] hover:bg-[#16a34a] active:scale-95 text-black text-sm font-bold rounded-xl transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Order
          </button>
          <button
            onClick={() => api.logout()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#4a4f5a] hover:text-[#e8e8e8] hover:bg-[#1e2228] transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-[#8a8f9a]">Loading...</span>
          </div>
        ) : (
          <>
            {page === 'orders' && <OrdersPage orders={activeOrders} onSelectOrder={setSelectedOrder} />}
            {page === 'customers' && <CustomersPage orders={orders} onSelectOrder={setSelectedOrder} />}
            {page === 'archive' && <ArchivePage orders={archivedOrders} onSelectOrder={setSelectedOrder} />}
          </>
        )}
      </main>

      <BottomNav page={page} onNavigate={setPage} activeCount={activeOrders.filter(o => o.status === 'Pending').length} />

      <AddOrderModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
