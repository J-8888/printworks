import React from 'react';
import type { Page } from '@/App';

interface BottomNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
  activeCount: number;
}

export function BottomNav({ page, onNavigate, activeCount }: BottomNavProps) {
  const tabs: { page: Page; label: string; icon: React.ReactNode }[] = [
    {
      page: 'orders',
      label: 'Orders',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    
    {
    page: 'review',
    label: 'Review',
    icon: <span style={{ fontSize: '20px' }}>⏳</span>,
    },
    
    {
      page: 'customers',
      label: 'Customers',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M16 11c1.657 0 3 1.343 3 3s-1.343 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M19 20c0-2.21-1.343-4-3-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      page: 'archive',
      label: 'Completed',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      page: 'filament',
      label: 'Filament',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e1014]/95 backdrop-blur-md border-t border-[#1e2228] pb-safe">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = page === tab.page;
          return (
            <button
              key={tab.page}
              onClick={() => onNavigate(tab.page)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${
                active ? 'text-[#22c55e]' : 'text-[#4a4f5a] active:text-[#8a8f9a]'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#22c55e] rounded-full" />
              )}
              <span className="relative">
                {tab.icon}
                {tab.page === 'orders' && activeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 bg-[#22c55e] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-[#22c55e]' : 'text-[#4a4f5a]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
