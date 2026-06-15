import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order, OrderStatus } from '@/types/order';
import { IconX } from '@/icons';

interface AddOrderModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => void;
}

const STATUSES: OrderStatus[] = ['Pending', 'Printing', 'Payment Required', 'Collected'];

export function AddOrderModal({ open, onClose, onAdd }: AddOrderModalProps) {
  const [customer, setCustomer] = useState('');
  const [item, setItem] = useState('');
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState<OrderStatus>('Pending');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCustomer('');
      setItem('');
      setTotal('');
      setStatus('Pending');
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!customer.trim()) errs.customer = 'Customer name is required';
    if (!item.trim()) errs.item = 'Item name is required';
    const num = parseFloat(total);
    if (!total.trim() || isNaN(num) || num <= 0) errs.total = 'Enter a valid amount';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onAdd({ customer: customer.trim(), item: item.trim(), totalGbp: parseFloat(parseFloat(total).toFixed(2)), status, notes: '', email: '' });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#1a1d23] border border-[#2e333d] rounded-xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#2e333d]">
                <h2 id="modal-title" className="text-base font-semibold text-[#e8e8e8]">
                  New Order
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e] transition-colors"
                  aria-label="Close"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="px-6 py-5 space-y-4">
                  {/* Customer */}
                  <div>
                    <label htmlFor="customer" className="block text-xs font-semibold text-[#8a8f9a] uppercase tracking-wider mb-1.5">
                      Customer Name
                    </label>
                    <input
                      ref={firstInputRef}
                      id="customer"
                      type="text"
                      value={customer}
                      onChange={(e) => { setCustomer(e.target.value); setErrors((p) => ({ ...p, customer: '' })); }}
                      placeholder="e.g. James Walker"
                      className={`w-full bg-[#22262e] border rounded-lg px-3.5 py-2.5 text-sm text-[#e8e8e8] placeholder-[#4a4f5a] outline-none transition-colors focus:border-[#22c55e] ${errors.customer ? 'border-red-500' : 'border-[#2e333d]'}`}
                    />
                    {errors.customer && <p className="mt-1 text-xs text-red-400">{errors.customer}</p>}
                  </div>

                  {/* Item */}
                  <div>
                    <label htmlFor="item" className="block text-xs font-semibold text-[#8a8f9a] uppercase tracking-wider mb-1.5">
                      Item
                    </label>
                    <input
                      id="item"
                      type="text"
                      value={item}
                      onChange={(e) => { setItem(e.target.value); setErrors((p) => ({ ...p, item: '' })); }}
                      placeholder="e.g. Spur Gear 32T"
                      className={`w-full bg-[#22262e] border rounded-lg px-3.5 py-2.5 text-sm text-[#e8e8e8] placeholder-[#4a4f5a] outline-none transition-colors focus:border-[#22c55e] ${errors.item ? 'border-red-500' : 'border-[#2e333d]'}`}
                    />
                    {errors.item && <p className="mt-1 text-xs text-red-400">{errors.item}</p>}
                  </div>

                  {/* Total */}
                  <div>
                    <label htmlFor="total" className="block text-xs font-semibold text-[#8a8f9a] uppercase tracking-wider mb-1.5">
                      Total (GBP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8f9a] text-sm font-semibold select-none">£</span>
                      <input
                        id="total"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={total}
                        onChange={(e) => { setTotal(e.target.value); setErrors((p) => ({ ...p, total: '' })); }}
                        placeholder="0.00"
                        className={`w-full bg-[#22262e] border rounded-lg pl-7 pr-3.5 py-2.5 text-sm text-[#e8e8e8] placeholder-[#4a4f5a] outline-none transition-colors focus:border-[#22c55e] ${errors.total ? 'border-red-500' : 'border-[#2e333d]'}`}
                      />
                    </div>
                    {errors.total && <p className="mt-1 text-xs text-red-400">{errors.total}</p>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-[#8a8f9a] uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left ${
                            status === s
                              ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                              : 'border-[#2e333d] bg-[#22262e] text-[#8a8f9a] hover:border-[#3e434d] hover:text-[#e8e8e8]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2e333d]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-[#8a8f9a] hover:text-[#e8e8e8] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-bold rounded-lg transition-colors"
                  >
                    Add Order
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
