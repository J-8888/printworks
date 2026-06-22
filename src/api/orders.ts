import type { Order, OrderStatus } from '@/types/order';

const API_BASE = '/api';
let _token = '';

export function setToken(token: string) { _token = token; }
export function getToken() { return _token; }
function authHeaders() { return { 'Content-Type': 'application/json', 'x-auth-token': _token }; }

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`, { headers: { 'x-auth-token': _token } });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) }));
}

export async function createOrder(data: {
  customer: string; item: string; totalGbp: number; status: OrderStatus; phone?: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create order');
  const o = await res.json();
  return { ...o, createdAt: new Date(o.createdAt) };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error('Failed to update order');
  const o = await res.json();
  return { ...o, createdAt: new Date(o.createdAt) };
}

export async function updateOrder(id: string, data: { notes?: string; totalGbp?: number; status?: string; phone?: string }): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update order');
  const o = await res.json();
  return { ...o, createdAt: new Date(o.createdAt) };
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE', headers: { 'x-auth-token': _token } });
  if (!res.ok) throw new Error('Failed to delete order');
}

export function logout() {
  const token = _token;
  _token = '';
  fetch(`${API_BASE}/logout`, { method: 'POST', headers: { 'x-auth-token': token } })
    .finally(() => { window.location.href = '/login.html'; });
}
