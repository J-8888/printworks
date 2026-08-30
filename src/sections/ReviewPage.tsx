import { useState } from 'react';
import { Order, reviewOrder } from '@/api/orders';

interface Props {
  orders: Order[];
  onReviewed: () => void;
}

export default function ReviewPage({ orders, onReviewed }: Props) {
  const [denyReason, setDenyReason] = useState('');
  const [showReasonFor, setShowReasonFor] = useState<string | null>(null);
  
  const pending = orders.filter(o => !o.reviewed);

  const handleAccept = async (order: Order) => {
    await reviewOrder(order.id, 'accept');
    const msg = encodeURIComponent(`Hi ${order.customer}! Your PrintWorks Order has been accepted. We'll let you know when it's ready! 🖨️`);
    if (order.phone) window.open(`https://wa.me/${order.phone.replace(/\D/g,'')}?text=${msg}`);
    onReviewed();
  };

  const handleDeny = async (order: Order) => {
    if (!denyReason.trim()) return alert('Please enter a reason');
    await reviewOrder(order.id, 'deny', denyReason);
    const msg = encodeURIComponent(`Hi ${order.customer}. Your PrintWorks Order has been declined because: ${denyReason}. You might get a follow up message with more info.`);
    if (order.phone) window.open(`https://wa.me/${order.phone.replace(/\D/g,'')}?text=${msg}`);
    setShowReasonFor(null);
    setDenyReason('');
    onReviewed();
  };

  if (pending.length === 0) {
    return <div className="p-4 text-center text-gray-500">🎉 No orders waiting review</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Review Orders ({pending.length})</h2>
      {pending.map(order => (
        <div key={order.id} className="bg-white rounded-xl shadow p-4 space-y-2">
          <div className="font-bold text-lg">{order.customer}</div>
          <div className="text-gray-700">{order.item}</div>
          {order.phone && <div className="text-sm text-gray-500">📱 {order.phone}</div>}
          
          {showReasonFor === order.id ? (
            <div className="space-y-2 mt-2">
              <input
                className="w-full border rounded-lg p-2"
                placeholder="Reason for denial..."
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeny(order)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg flex-1 font-bold"
                >Confirm Deny</button>
                <button
                  onClick={() => setShowReasonFor(null)}
                  className="bg-gray-200 px-4 py-2 rounded-lg"
                >Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAccept(order)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1 font-bold"
              >✅ Accept</button>
              <button
                onClick={() => setShowReasonFor(order.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg flex-1 font-bold"
              >❌ Deny</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
