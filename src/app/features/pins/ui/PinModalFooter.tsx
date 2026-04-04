interface PinModalFooterProps {
  mode: "create" | "edit";
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export function PinModalFooter({
  mode,
  onClose,
  onDelete,
  onSave,
}: PinModalFooterProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
      <div>
        {mode === "edit" && (
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-orange text-white hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  );
}
