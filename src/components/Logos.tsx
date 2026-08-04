import React from 'react';

export function NetbueLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dynamic sphere of multi-color ribbon arrows */}
      <g transform="translate(10, 10)">
        {/* Purple arrow (top outer) */}
        <path d="M 40 40 C 65 15, 105 15, 125 35" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" />
        <path d="M 125 35 L 115 35 M 125 35 L 125 45" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Blue arrow */}
        <path d="M 30 65 C 55 35, 110 30, 135 60" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" />
        <path d="M 135 60 L 125 58 M 135 60 L 133 70" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Light Green arrow */}
        <path d="M 28 95 C 50 65, 115 55, 142 90" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
        <path d="M 142 90 L 132 87 M 142 90 L 138 100" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Yellow/Orange arrow */}
        <path d="M 35 125 C 60 95, 120 85, 145 120" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
        <path d="M 145 120 L 135 116 M 145 120 L 140 130" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Orange/Red arrow */}
        <path d="M 50 150 C 75 125, 120 115, 138 142" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
        <path d="M 138 142 L 128 138 M 138 142 L 134 152" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Shadow-like blue lines on the right side of the globe */}
        <path d="M 155 45 C 170 60, 170 90, 155 110" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 10" />
        <path d="M 165 60 C 178 75, 178 100, 165 115" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Brand Text */}
      <g transform="translate(200, 20)">
        {/* "NETBUE" styled text in Royal Blue */}
        <text x="0" y="70" fill="#2563EB" fontSize="72" fontWeight="800" fontFamily="'Inter', sans-serif" letterSpacing="2">
          NETBUE
        </text>
        {/* "Beyond Technology" subtitle */}
        <text x="5" y="125" fill="#374151" fontSize="38" fontWeight="400" fontFamily="'Inter', sans-serif" letterSpacing="1">
          Beyond Technology
        </text>
      </g>
    </svg>
  );
}

export function FaturathiLogo({ className = "h-12 w-auto", showSlogan = true, iconOnly = false }: { className?: string, showSlogan?: boolean, iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <svg viewBox="15 5 210 150" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sheet with checklist */}
        <g transform="translate(60, 10)">
          {/* Document outline */}
          <rect x="20" y="10" width="100" height="130" rx="14" fill="white" stroke="#004494" strokeWidth="7" />
          <path d="M 90 10 L 120 10 L 120 40 Z" fill="#004494" />
          
          {/* Green horizontal bars in document */}
          <line x1="40" y1="35" x2="80" y2="35" stroke="#008744" strokeWidth="7" strokeLinecap="round" />
          <line x1="40" y1="55" x2="100" y2="55" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
          
          {/* Table checkgrid */}
          <rect x="40" y="75" width="60" height="45" rx="4" stroke="#94A3B8" strokeWidth="3" />
          <line x1="60" y1="75" x2="60" y2="120" stroke="#94A3B8" strokeWidth="2" />
          <line x1="80" y1="75" x2="80" y2="120" stroke="#94A3B8" strokeWidth="2" />
          <line x1="40" y1="90" x2="100" y2="90" stroke="#94A3B8" strokeWidth="2" />
          
          {/* Large dynamic green checkmark */}
          <path d="M 45 100 L 55 110 L 75 90" stroke="#008744" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Dynamic letter 'ف' (Fa) looping in Deep Blue */}
        <path d="M 155 125 C 190 125, 215 95, 215 65 C 215 35, 175 40, 175 65 C 175 85, 140 150, 70 150 C 40 150, 45 120, 50 110" 
              stroke="#004494" strokeWidth="12" strokeLinecap="round" fill="none" />
        
        {/* Green Diamond dot for 'ف' */}
        <rect x="195" y="15" width="18" height="18" rx="2" transform="rotate(45, 204, 24)" fill="#008744" />
      </svg>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 320 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sheet with checklist */}
        <g transform="translate(60, 10)">
          {/* Document outline */}
          <rect x="20" y="10" width="100" height="130" rx="14" fill="white" stroke="#004494" strokeWidth="7" />
          <path d="M 90 10 L 120 10 L 120 40 Z" fill="#004494" />
          
          {/* Green horizontal bars in document */}
          <line x1="40" y1="35" x2="80" y2="35" stroke="#008744" strokeWidth="7" strokeLinecap="round" />
          <line x1="40" y1="55" x2="100" y2="55" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
          
          {/* Table checkgrid */}
          <rect x="40" y="75" width="60" height="45" rx="4" stroke="#94A3B8" strokeWidth="3" />
          <line x1="60" y1="75" x2="60" y2="120" stroke="#94A3B8" strokeWidth="2" />
          <line x1="80" y1="75" x2="80" y2="120" stroke="#94A3B8" strokeWidth="2" />
          <line x1="40" y1="90" x2="100" y2="90" stroke="#94A3B8" strokeWidth="2" />
          
          {/* Large dynamic green checkmark */}
          <path d="M 45 100 L 55 110 L 75 90" stroke="#008744" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Dynamic letter 'ف' (Fa) looping in Deep Blue */}
        <path d="M 155 125 C 190 125, 215 95, 215 65 C 215 35, 175 40, 175 65 C 175 85, 140 150, 70 150 C 40 150, 45 120, 50 110" 
              stroke="#004494" strokeWidth="12" strokeLinecap="round" fill="none" />
        
        {/* Green Diamond dot for 'ف' */}
        <rect x="195" y="15" width="18" height="18" rx="2" transform="rotate(45, 204, 24)" fill="#008744" />

        {/* faturathi word text */}
        <g transform="translate(15, 195)">
          <text x="0" y="0" fill="#004494" fontSize="32" fontWeight="800" fontFamily="'Inter', sans-serif">
            fatur
            <tspan fill="#008744">athi</tspan>
          </text>
        </g>
      </svg>
      {showSlogan && (
        <span className="text-[10px] font-medium tracking-wide text-[#004494] font-sans mt-0.5 select-none">
          — فاتورتك .. أصبحت أسهل —
        </span>
      )}
    </div>
  );
}
