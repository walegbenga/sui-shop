export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        className={className}
        viewBox="0 0 100 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* First S (top, red) */}
        <path
          d="M5 25C5 25 9 29 17 29C25 29 29 25 29 21C29 17 25 15 17 15C9 15 5 13 5 9C5 5 9 1 17 1C25 1 29 5 29 5"
          stroke="#EF4444"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Second S (overlapping, starts at middle, red) */}
        <path
          d="M15 38C15 38 19 42 27 42C35 42 39 38 39 34C39 30 35 28 27 28C19 28 15 26 15 22C15 18 19 14 27 14C35 14 39 18 39 18"
          stroke="#EF4444"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          transform="translate(0, -5)"
        />
        
        {/* Shopping Cart (beside the S's) */}
        <g transform="translate(45, 8)" stroke="#EF4444" strokeWidth="2.5" fill="none">
          <rect x="0" y="0" width="16" height="14" rx="2" strokeLinejoin="round" />
          <path d="M3 0 L1 -4 L-2 -4" strokeLinecap="round" />
          <circle cx="3" cy="18" r="1.5" fill="#EF4444" />
          <circle cx="13" cy="18" r="1.5" fill="#EF4444" />
        </g>
      </svg>
    </div>
  );
}