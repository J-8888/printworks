import React from 'react';
import { IconCube, IconBell, IconPlus } from '@/icons';
import type { Page } from '@/App';

interface NavProps {
  page: Page;
  onNavigate: (page: Page) => void;
  onNewOrder: () => void;
}

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Orders', page: 'orders' },
  { label: 'Customers', page: 'customers' },
  { label: 'Archive', page: 'archive' },
];

export function Nav({ page, onNavigate, onNewOrder }: NavProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#121418]/95 backdrop-blur border-b border-[#2e333d]">
      <div className="max-w-[1340px] mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#22262e] border border-[#2e333d] flex items-center justify-center">
            <IconCube className="text-[#22c55e]" size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-[#e8e8e8] leading-none tracking-tight">PRINTWORKS</p>
            <p className="text-[10px] text-[#8a8f9a] leading-none mt-0.5 tracking-widest uppercase">3D Print Lab</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <button
              key={link.page}
              onClick={() => onNavigate(link.page)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                page === link.page
                  ? 'text-[#22c55e] bg-[#22c55e]/10'
                  : 'text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e]'
              }`}
              aria-current={page === link.page ? 'page' : undefined}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-1 ml-2" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <button
              key={link.page}
              onClick={() => onNavigate(link.page)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                page === link.page
                  ? 'text-[#22c55e] bg-[#22c55e]/10'
                  : 'text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#8a8f9a] hover:text-[#e8e8e8] hover:bg-[#22262e] transition-colors"
            aria-label="Notifications"
          >
            <IconBell size={18} />
          </button>

          <button
            onClick={onNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black text-sm font-bold rounded-lg transition-colors"
          >
            <IconPlus size={14} />
            <span className="hidden sm:inline">NEW ORDER</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
}
