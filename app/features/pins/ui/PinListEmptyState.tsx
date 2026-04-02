interface PinListEmptyStateProps {
  searchText: string;
}

export function PinListEmptyState({ searchText }: PinListEmptyStateProps) {
  if (searchText.trim()) {
    return (
      <div className="py-10 px-5 text-center text-text-muted">
        <div className="mb-3">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="text-sm leading-relaxed">No pins match your search.</div>
      </div>
    );
  }

  return (
    <div className="py-10 px-5 text-center text-text-muted">
      <div className="mb-3">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto text-text-muted"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="text-sm leading-relaxed">
        No pins yet.
        <br />
        Click the + button on the map to start dropping pins.
      </div>
      <div className="text-xs mt-2 text-text-muted italic">Even the boss takes a day off sometimes.</div>
    </div>
  );
}
