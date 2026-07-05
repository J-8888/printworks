import type { Filament, OrderFilamentUsage } from '@/types/filament';

const API_BASE = '/api';
let _token = '';

export function setFilamentToken(token: string) { _token = token; }
function authHeaders() { return { 'Content-Type': 'application/json', 'x-auth-token': _token }; }

export async function fetchFilaments(): Promise<Filament[]> {
  const res = await fetch(`${API_BASE}/filaments`, { headers: { 'x-auth-token': _token } });
  if (!res.ok) throw new Error('Failed to fetch filaments');
  const data = await res.json();
  return data.map((f: any) => ({ ...f, createdAt: new Date(f.createdAt) }));
}

export async function createFilament(data: {
  brand: string; colour: string; colourHex: string; material: string;
  totalWeightG: number; costPerGram: number; status: string;
}): Promise<Filament> {
  const res = await fetch(`${API_BASE}/filaments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create filament');
  const f = await res.json();
  return { ...f, createdAt: new Date(f.createdAt) };
}

export async function updateFilament(id: string, data: Partial<{
  brand: string; colour: string; colourHex: string; material: string;
  totalWeightG: number; remainingWeightG: number; costPerGram: number; status: string;
}>): Promise<Filament> {
  const res = await fetch(`${API_BASE}/filaments/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update filament');
  const f = await res.json();
  return { ...f, createdAt: new Date(f.createdAt) };
}

export async function deleteFilament(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/filaments/${id}`, { method: 'DELETE', headers: { 'x-auth-token': _token } });
  if (!res.ok) throw new Error('Failed to delete filament');
}

export async function fetchOrderFilaments(orderId: string): Promise<OrderFilamentUsage[]> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/filaments`, { headers: { 'x-auth-token': _token } });
  if (!res.ok) throw new Error('Failed to fetch order filaments');
  return res.json();
}

export async function logFilamentUsage(orderId: string, filamentId: string, gramsUsed: number): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/filaments`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ filamentId, gramsUsed }),
  });
  if (!res.ok) throw new Error('Failed to log filament usage');
}

export async function removeFilamentUsage(orderId: string, usageId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/filaments/${usageId}`, {
    method: 'DELETE', headers: { 'x-auth-token': _token },
  });
  if (!res.ok) throw new Error('Failed to remove filament usage');
}
