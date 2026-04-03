"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Web Speech API types (not in default TypeScript lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface PlannerNotesProps {
  notes: string[];
  activePage: number;
  onChangePage: (text: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageIndex: number) => void;
  onNavigatePage: (page: number) => void;
}

// Check if Speech Recognition is available
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SR ?? null;
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
  const [isListening, setIsListening] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speechAvailable = typeof window !== "undefined" && getSpeechRecognition() !== null;

  const syncLocalText = useCallback((text: string) => {
    setLocalText(text);
  }, []);

  // Reset local text when activePage changes
  useEffect(() => {
    queueMicrotask(() => {
      syncLocalText(notes[activePage] ?? "");
    });
  }, [activePage, notes, syncLocalText]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setLocalText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangePage(text);
    }, 800);
  }

  // Save text helper
  const saveText = useCallback((text: string) => {
    setLocalText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangePage(text);
    }, 400);
  }, [onChangePage]);

  function toggleDictation() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    // Track the text that existed before dictation started
    const baseText = localText;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      // Append finalized text + show interim
      const separator = baseText && !baseText.endsWith(" ") && !baseText.endsWith("\n") ? " " : "";
      const newText = baseText + separator + final + interim;
      saveText(newText);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const totalPages = notes.length;
  const isFirst = activePage === 0;
  const isLast = activePage === totalPages - 1;
  const dictationButtonStateClass = isListening
    ? "border-red-500 bg-red-500 text-white"
    : "border-orange bg-orange text-white";

  return (
    <div className="px-4 py-3 border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Notes</span>
        <div className="flex items-center gap-2">
          {speechAvailable && (
            <button
              onClick={toggleDictation}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold transition-all hover:brightness-110 ${dictationButtonStateClass}`}
              title={isListening ? "Stop dictation" : "Dictate notes"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              {isListening ? "Stop" : "Dictate"}
            </button>
          )}
          <span className="text-[11px] text-text-muted">
            Page {activePage + 1} of {totalPages}
          </span>
        </div>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-red-500/10 border border-red-500/20">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-[pulse_1.5s_infinite]" />
          <span className="text-xs text-red-500 font-semibold">Listening... speak now</span>
        </div>
      )}

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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleChange}
        placeholder={isListening ? "Listening... speak now" : "Write your notes here, or tap Dictate to speak them..."}
        className="bg-bg-card border border-border rounded-lg p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 w-full min-h-[120px] resize-y"
      />
    </div>
  );
}
