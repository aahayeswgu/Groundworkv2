export default function MapArea() {
  return (
    <div className="flex-1 relative h-screen overflow-hidden">
      {/* Map container */}
      <div className="w-full h-full z-[1]">
        <div className="w-full h-full bg-bg-primary flex items-center justify-center text-text-muted text-sm">
          Map will load here
        </div>
      </div>

      {/* Floating map controls */}
      <div className="map-controls-pos absolute top-3 right-3 z-20 flex flex-col gap-2">
        {[
          { title: "Drop a pin", icon: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, strokeWidth: "2.5", size: 20 },
          { title: "My location", icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></>, strokeWidth: "2", size: 18 },
          { title: "Get directions", icon: <polygon points="3 11 22 2 13 21 11 13 3 11" />, strokeWidth: "2", size: 18 },
          { title: "Discover businesses", icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></>, strokeWidth: "2", size: 18 },
          { title: "Show/hide pins", icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, strokeWidth: "2", size: 18 },
          { title: "Satellite view", icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>, strokeWidth: "2", size: 18 },
        ].map((btn) => (
          <button
            key={btn.title}
            className="map-ctrl-size w-10 h-10 bg-bg-card border border-border rounded-lg flex items-center justify-center text-text-primary shadow-gw transition-all duration-200 hover:border-orange hover:text-orange"
            title={btn.title}
          >
            <svg width={btn.size} height={btn.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={btn.strokeWidth}>
              {btn.icon}
            </svg>
          </button>
        ))}

        {/* Quick Entry (accent button) */}
        <button
          className="map-ctrl-size w-10 h-10 bg-orange border border-orange rounded-lg flex items-center justify-center text-white shadow-gw transition-all duration-200"
          title="Quick Entry"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      </div>
    </div>
  );
}
