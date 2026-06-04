import type { Order, OrderStatus } from '@/types/order';

const API_BASE = '/api';

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.map((o: any) => ({
    ...o,
    createdAt: new Date(o.createdAt),
  }));
}

export async function createOrder(data: {
  customer: string;
  item: string;
  totalGbp: number;
  status: OrderStatus;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create order');
  const o = await res.json();
  return { ...o, createdAt: new Date(o.createdAt) };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order');
  const o = await res.json();
  return { ...o, createdAt: new Date(o.createdAt) };
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete order');
}
