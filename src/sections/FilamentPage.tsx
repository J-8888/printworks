import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Filament } from '@/types/filament';
import * as filamentApi from '@/api/filaments';
import { formatGbp } from '@/utils/format';

const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'Resin', 'Other'];
const PRESET_COLOURS = [
  { name: 'White', hex: '#f0f0f0' }, { name: 'Black', hex: '#1a1a1a' },
  { name: 'Red', hex: '#ef4444' }, { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' }, { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' }, { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' }, { name: 'Grey', hex: '#6b7280' },
  { name: 'Silver', hex: '#c0c0c0' }, { name: 'Gold', hex: '#d4af37' },
];

function percentageColour(pct: number) {
  if (pct > 50) return 'text-[#22c55e]';
  if (pct > 20) return 'text-amber-400';
  return 'text-red-400';
}

function AddFilamentModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (f: Filament) => void }) {
  const [brand, setBrand] = useState('');
  const [colour, setColour] = useState('');
  const [colourHex, setColourHex] = useState('#22c55e');
  const [material, setMaterial] = useState('PLA');
  const [weight, setWeight] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) { setBrand(''); setColour(''); setColourHex('#22c55e'); setMaterial('PLA'); setWeight(''); setCost(''); setErrors({}); }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!brand.trim()) errs.brand = 'Required';
    if (!colour.trim()) errs.colour = 'Required';
    if (!weight || parseFloat(weight) <= 0) errs.weight = 'Enter a valid weight';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const f = await filamentApi.createFilament({
        brand: brand.trim(), colour: colour.trim(), colourHex,
        material, totalWeightG: parseFloat(weight),
        costPerGram: cost ? parseFloat(cost) : 0,
      });
      onAdd(f);
      onClose();
    } catch { setErrors({ brand: 'Failed to save, try again' }); }
    setSaving(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div key="modal" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#141720] border-t border-[#1e2228] rounded-t-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-[#2e333d] rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2228] shrink-0">
              <h2 className="text-base font-bold text-[#e8e8e8]">Add Filament</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[#4a4f5a] hover:text-[#e8e8e8] hover:bg-[#1e2228] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Brand</label>
                <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Bambu Lab, Prusament"
                  className={`w-full bg-[#0e1014] border rounded-2xl px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors ${errors.brand ? 'border-red-500' : 'border-[#1e2228]'}`} />
                {errors.brand && <p className="text-xs text-red-400 mt-1">{errors.brand}</p>}
              </div>
              {/* Colour */}
              <div>
                <label className="block text-xs font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Colour</label>
                <input value={colour} onChange={e => setColour(e.target.value)} placeholder="e.g. Matte Black, Galaxy Blue"
                  className={`w-full bg-[#0e1014] border rounded-2xl px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors ${errors.colour ? 'border-red-500' : 'border-[#1e2228]'}`} />
                {errors.colour && <p className="text-xs text-red-400 mt-1">{errors.colour}</p>}
              </div>
              {/* Colour picker */}
              <div>
                <label className="block text-xs font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Colour Swatch</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLOURS.map(c => (
                    <button key={c.hex} type="button" onClick={() => setColourHex(c.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${colourHex === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }} title={c.name} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[#1e2228] shrink-0" style={{ backgroundColor: colourHex }} />
                  <input type="color" value={colourHex} onChange={e => setColourHex(e.target.value)}
                    className="w-full h-10 bg-[#0e1014] border border-[#1e2228] rounded-2xl px-2 cursor-pointer" />
                </div>
              </div>
              {/* Material */}
              <div>
                <label className="block text-xs font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Material</label>
                <div className="grid grid-cols-4 gap-2">
                  {MATERIALS.map(m => (
                    <button key={m} type="button" onClick={() => setMaterial(m)}
                      className={`py-2 rounded-2xl text-xs font-bold border transition-colors ${material === m ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]' : 'border-[#1e2228] text-[#4a4f5a] hover:text-[#e8e8e8]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {/* Weight */}
              <div>
                <label className="block text-xs font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Total Weight (g)</label>
                <input type="number" min="1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 1000"
                  className={`w-full bg-[#0e1014] border rounded-2xl px-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors ${errors.weight ? 'border-red-500' : 'border-[#1e2228]'}`} />
                {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight}</p>}
              </div>
              {/* Cost */}
              <div>
                <label className="block text-xs font-bold text-[#8a8f9a] uppercase tracking-wider mb-2">Cost per gram (£) — optional</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8f9a] text-sm font-semibold">£</span>
                  <input type="number" min="0" step="0.001" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.020"
                    className="w-full bg-[#0e1014] border border-[#1e2228] rounded-2xl pl-7 pr-4 py-3 text-sm text-[#e8e8e8] placeholder-[#2e333d] outline-none focus:border-[#22c55e] transition-colors" />
                </div>
                {weight && cost && <p className="text-xs text-[#4a4f5a] mt-1">Full spool cost: {formatGbp(parseFloat(weight) * parseFloat(cost))}</p>}
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#1e2228] disabled:text-[#4a4f5a] text-black font-bold text-sm rounded-2xl py-4 transition-colors mb-4">
                {saving ? 'Saving...' : 'Add Filament'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function FilamentPage() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await filamentApi.fetchFilaments();
      setFilaments(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSpoolCost = filaments.reduce((s, f) => s + f.totalWeightG * f.costPerGram, 0);
  const totalRemaining = filaments.reduce((s, f) => s + f.remainingWeightG, 0);

  async function handleDelete(id: string) {
    await filamentApi.deleteFilament(id);
    setFilaments(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8e8]">Filament</h1>
          <p className="text-sm text-[#4a4f5a] mt-0.5">{filaments.length} spool{filaments.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] active:scale-95 text-black text-sm font-bold rounded-xl transition-all">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Spool
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
          <p className="text-2xl font-bold font-mono text-[#e8e8e8]">{Math.round(totalRemaining)}g</p>
          <p className="text-xs text-[#4a4f5a] font-medium mt-0.5">Total Remaining</p>
        </div>
        <div className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
          <p className="text-2xl font-bold font-mono text-[#22c55e]">{formatGbp(totalSpoolCost)}</p>
          <p className="text-xs text-[#4a4f5a] font-medium mt-0.5">Total Stock Value</p>
        </div>
      </div>

      {/* Filament list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#141720] border border-[#1e2228] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#3a3f4a]">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[#4a4f5a] text-sm">No filament spools yet</p>
          <button onClick={() => setAddOpen(true)} className="text-[#22c55e] text-sm font-semibold">Add your first spool</button>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {filaments.map((f, i) => {
            const pct = Math.round((f.remainingWeightG / f.totalWeightG) * 100);
            const pctColour = percentageColour(pct);
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
                className="bg-[#141720] border border-[#1e2228] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {/* Colour swatch */}
                  <div className="w-10 h-10 rounded-full shrink-0 border-2 border-[#1e2228]" style={{ backgroundColor: f.colourHex }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#e8e8e8]">{f.brand}</p>
                        <p className="text-xs text-[#8a8f9a]">{f.colour} · {f.material}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold font-mono ${pctColour}`}>{pct}%</p>
                        <p className="text-xs text-[#4a4f5a]">{Math.round(f.remainingWeightG)}g left</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-[#0e1014] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: f.colourHex, opacity: 0.8 }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[#4a4f5a]">{Math.round(f.remainingWeightG)}g / {f.totalWeightG}g</p>
                      {f.costPerGram > 0 && (
                        <p className="text-xs text-[#4a4f5a]">{formatGbp(f.remainingWeightG * f.costPerGram)} remaining value</p>
                      )}
                    </div>
                    {/* Low stock warning */}
                    {pct <= 20 && (
                      <div className="mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-xs text-red-400 font-semibold">⚠ Low stock — consider reordering</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Delete */}
                <button onClick={() => handleDelete(f.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Remove Spool
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddFilamentModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={f => setFilaments(prev => [f, ...prev])} />
    </div>
  );
}
