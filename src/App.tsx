import ReviewPage from './sections/ReviewPage';
import AnalyticsPage from './sections/AnalyticsPage';
import React, { useState, useCallback, useEffect } from 'react';
import { BottomNav } from '@/sections/BottomNav';
import { OrdersPage } from '@/sections/OrdersPage';
import { CustomersPage } from '@/sections/CustomersPage';
import { ArchivePage } from '@/sections/ArchivePage';
import { FilamentPage } from '@/sections/FilamentPage';
import { AddOrderModal } from '@/components/AddOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import ReviewPage from '@/sections/ReviewPage';
import AnalyticsPage from '@/sections/AnalyticsPage';
import type { Order, OrderStatus } from '@/types/order';
import * as api from '@/api/orders';
import * as filamentApi from '@/api/filaments';

export type Page = 'orders' | 'customers' | 'archive' | 'filament';

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        api.setToken(data.token);
        filamentApi.setFilamentToken(data.token);
        onLogin();
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Something went wrong, please try again');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0e1014] flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-[#22c55e]/12 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 2V18M2 6.5L18 6.5" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-[#e8e8e8] tracking-tight leading-none">PRINTWORKS</p>
          <p className="text-[10px] text-[#4a4f5a] tracking-widest uppercase mt-0.5">3D Print Lab</p>
        </div>
      </div>
      <div className="w-full max-w-sm bg-[#141720] border border-[#1e2228] rounded-3xl p-7">
        <h1 className="text-lg font-bold text-[#e8e8e8] mb-1">Welcome back</h1>
        <p className="text-sm text-[#4a4f5a] mb-6">Sign in to your dashboard</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="username"
              className="w-full bg-[#0e1014] border border-[#1e2228] rounded-2xl px-4 py-3.5 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password"
              className="w-full bg-[#0e1014] border border-[#1e2228] rounded-2xl px-4 py-3.5 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors" />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#1e2228] disabled:text-[#4a4f5a] text-black font-bold text-sm rounded-2xl py-4 transition-colors active:scale-[0.98]">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState<Page>('orders');
  const [refreshKey, setRefreshKey] = useState(0);
  const handleReviewed = () => setRefreshKey(prev => prev + 1);
  
  useEffect(() => {
    if (!loggedIn) return;
    api.fetchOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [loggedIn]);

  const handleAdd = useCallback(async (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const order = await api.createOrder(data);
    setOrders((prev) => [order, ...prev]);
  }, []);

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

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const activeOrders = orders.filter((o) => o.status !== 'Collected');
  const archivedOrders = orders.filter((o) => o.status === 'Collected');

  return (
    <div className="min-h-screen bg-[#0e1014] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#0e1014]/95 backdrop-blur-md border-b border-[#1e2228] px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#22c55e]/15 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 2V18M2 6.5L18 6.5" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[#e8e8e8] tracking-tight">PRINTWORKS</span>
        </div>
        <div className="flex items-center gap-2">
          {page !== 'filament' && (
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22c55e] hover:bg-[#16a34a] active:scale-95 text-black text-sm font-bold rounded-xl transition-all">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Order
            </button>
          )}
          <button onClick={() => { api.logout(); setLoggedIn(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#4a4f5a] hover:text-[#e8e8e8] hover:bg-[#1e2228] transition-colors" aria-label="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {loading && page !== 'filament' ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-[#8a8f9a]">Loading...</span>
          </div>
        ) : (
          <>
            {page === 'orders' && <OrdersPage orders={activeOrders} onSelectOrder={setSelectedOrder} />}
            {page === 'customers' && <CustomersPage orders={orders} onSelectOrder={setSelectedOrder} />}
            {page === 'archive' && <ArchivePage orders={archivedOrders} onSelectOrder={setSelectedOrder} />}
            {page === 'filament' && <FilamentPage />}
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
