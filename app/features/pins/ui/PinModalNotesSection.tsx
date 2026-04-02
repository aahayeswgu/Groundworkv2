import type { NoteEntry } from "@/app/features/pins/model/pin.types";
import { formatNoteDate } from "../lib/pin-modal";
import { PIN_MODAL_INPUT_CLASS, PIN_MODAL_LABEL_CLASS } from "../model/pin-modal.model";

interface PinModalNotesSectionProps {
  notes: NoteEntry[];
  noteInput: string;
  onNoteInputChange: (value: string) => void;
  onAddNote: () => void;
}

export function PinModalNotesSection({
  notes,
  noteInput,
  onNoteInputChange,
  onAddNote,
}: PinModalNotesSectionProps) {
  return (
    <div>
      <label className={PIN_MODAL_LABEL_CLASS}>Activity Log</label>

      {notes.length > 0 && (
        <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
          {[...notes].reverse().map((entry, idx) => (
            <div
              key={idx}
              className="px-3 py-2 bg-bg-secondary rounded-lg border border-border text-xs"
            >
              <p className="text-text-muted mb-0.5">{formatNoteDate(entry.date)}</p>
              <p className="text-text-primary">{entry.text}</p>
            </div>
          ))}
        </div>
      )}

      <textarea
        rows={2}
        value={noteInput}
        onChange={(e) => onNoteInputChange(e.target.value)}
        placeholder="Add a note..."
        className={`${PIN_MODAL_INPUT_CLASS} resize-none`}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onAddNote();
        }}
      />
      <button
        onClick={onAddNote}
        disabled={!noteInput.trim()}
        className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-orange text-orange hover:bg-orange-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Add Note
      </button>
    </div>
  );
}
