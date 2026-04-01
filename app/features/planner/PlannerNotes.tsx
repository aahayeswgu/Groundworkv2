"use client";

import { useState, useEffect, useRef } from "react";

interface PlannerNotesProps {
  notes: string[];
  activePage: number;
  onChangePage: (text: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageIndex: number) => void;
  onNavigatePage: (page: number) => void;
}

export default function PlannerNotes({
  notes,
  activePage,
  onChangePage,
  onAddPage,
  onDeletePage,
  onNavigatePage,
}: PlannerNotesProps) {
  const [localText, setLocalText] = useState(notes[activePage] ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local text when activePage changes
  useEffect(() => {
    setLocalText(notes[activePage] ?? "");
  }, [activePage, notes]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setLocalText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangePage(text);
    }, 800);
  }

  const totalPages = notes.length;
  const isFirst = activePage === 0;
  const isLast = activePage === totalPages - 1;

  return (
    <div className="px-4 py-3 border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Notes</span>
        <span className="text-[11px] text-text-muted">
          Page {activePage + 1} of {totalPages}
        </span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 mb-2">
        <button
          onClick={() => onNavigatePage(activePage - 1)}
          disabled={isFirst}
          className="text-xs px-2 py-1 rounded text-text-secondary hover:text-orange disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          &lt; Prev
        </button>

        {/* Page dots */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          {notes.map((_, i) => (
            <button
              key={i}
              onClick={() => onNavigatePage(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === activePage
                  ? "bg-orange"
                  : "bg-border hover:bg-text-muted"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => onNavigatePage(activePage + 1)}
          disabled={isLast}
          className="text-xs px-2 py-1 rounded text-text-secondary hover:text-orange disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next &gt;
        </button>

        {/* Add page button */}
        <button
          onClick={onAddPage}
          className="text-xs px-2 py-1 rounded border border-border text-text-muted hover:text-orange hover:border-orange transition-colors"
        >
          + Add
        </button>

        {/* Delete page button — disabled on page 1 (index 0) */}
        <button
          onClick={() => onDeletePage(activePage)}
          disabled={activePage === 0}
          className="text-xs px-2 py-1 rounded border border-border text-text-muted hover:text-orange hover:border-orange disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Delete this page"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={localText}
        onChange={handleChange}
        placeholder="Write your notes here..."
        className="bg-bg-card border border-border rounded-lg p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 w-full min-h-[120px] resize-y"
      />
    </div>
  );
}
