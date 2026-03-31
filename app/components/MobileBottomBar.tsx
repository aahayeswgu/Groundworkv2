const tabs = [
  {
    label: "Map",
    active: true,
    icon: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    label: "Pins",
    active: false,
    icon: (
      <>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </>
    ),
  },
  {
    label: "Planner",
    active: false,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    label: "Email",
    active: false,
    icon: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="22,7 12,13 2,7" />
      </>
    ),
  },
  {
    label: "More",
    active: false,
    icon: (
      <>
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </>
    ),
  },
];

export default function MobileBottomBar() {
  return (
    <div className="mobile-bottom-bar hidden fixed bottom-0 inset-x-0 z-30 bg-bg-card border-t border-border pb-[calc(6px+env(safe-area-inset-bottom,0px))] pt-1.5 shadow-[0_-2px_12px_rgba(0,0,0,0.15)]">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 border-none bg-transparent cursor-pointer text-[10px] font-semibold transition-colors duration-150 min-w-[54px] ${
              tab.active ? "text-orange" : "text-text-muted"
            }`}
          >
            <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {tab.icon}
            </svg>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
