import React from 'react';
import { NAV_GROUPS } from './Navbar';

interface SubNavTabStripProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SubNavTabStrip: React.FC<SubNavTabStripProps> = ({ activeTab, onTabChange }) => {
  // Find which group activeTab belongs to
  const currentGroup = NAV_GROUPS.find(g => 
    g.primaryTab === activeTab || g.subItems?.some(s => s.id === activeTab)
  );

  // If group has no sub-items, don't show sub-nav strip
  if (!currentGroup || !currentGroup.subItems || currentGroup.subItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-100/90 border-b border-slate-200 py-2 px-4 sm:px-8 shadow-2xs">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Left Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-[#0056b3] text-white text-xs font-bold font-mono px-2 py-0.5 rounded-md">
            Section {currentGroup.code}
          </span>
          <span className="text-xs font-bold text-slate-800">
            {currentGroup.label} Cascade Sub-Menu:
          </span>
        </div>

        {/* Interactive Sub Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentGroup.subItems.map((sub) => {
            const isSelected = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onTabChange(sub.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0056b3] text-white shadow-xs ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 hover:text-[#0056b3] border border-slate-300'
                }`}
              >
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#0056b3]'
                }`}>
                  {sub.code}
                </span>
                <span className="shrink-0">{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
