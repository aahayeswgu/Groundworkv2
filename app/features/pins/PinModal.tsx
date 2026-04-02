"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PIN_STATUS_OPTIONS } from "@/app/entities/pin/model/pin-status";
import { useStore } from "@/app/shared/store";
import type { Pin, PinStatus, NoteEntry } from "@/app/types/pins.types";

export interface PinModalProps {
  mode: "create" | "edit";
  initialData: Partial<Pin>;
  onClose: () => void;
}

const INPUT_CLASS =
  "w-full px-3 py-2 bg-bg-input border border-border rounded-lg text-sm text-text-primary outline-none focus:border-orange transition-colors";

const LABEL_CLASS = "block text-xs font-medium text-text-secondary mb-1";

export default function PinModal({ mode, initialData, onClose }: PinModalProps) {
  const addPin = useStore((s) => s.addPin);
  const updatePin = useStore((s) => s.updatePin);
  const deletePin = useStore((s) => s.deletePin);

  const [title, setTitle] = useState(initialData.title ?? "");
  const [address, setAddress] = useState(initialData.address ?? "");
  const [status, setStatus] = useState<PinStatus>(initialData.status ?? "prospect");
  const [contact, setContact] = useState(initialData.contact ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [followUpDate, setFollowUpDate] = useState(initialData.followUpDate ?? "");
  const [notes, setNotes] = useState<NoteEntry[]>(initialData.notes ?? []);
  const [noteInput, setNoteInput] = useState("");

  // ESC key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSave() {
    const now = new Date().toISOString();
    if (mode === "create") {
      addPin({
        id: crypto.randomUUID(),
        title: title.trim() || address || "New Pin",
        address,
        status,
        contact,
        phone,
        followUpDate,
        notes,
        lat: initialData.lat ?? 0,
        lng: initialData.lng ?? 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      updatePin(initialData.id!, {
        title,
        address,
        status,
        contact,
        phone,
        followUpDate,
        notes,
        updatedAt: now,
      });
    }
    onClose();
  }

  function handleDelete() {
    if (initialData.id) {
      deletePin(initialData.id);
    }
    onClose();
  }

  function handleAddNote() {
    const text = noteInput.trim();
    if (!text) return;
    setNotes((prev) => [...prev, { text, date: new Date().toISOString() }]);
    setNoteInput("");
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 bg-bg-card rounded-xl border border-border shadow-gw w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text-primary">
            {mode === "create" ? "New Pin" : "Edit Pin"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Title */}
          <div>
            <label className={LABEL_CLASS}>Business Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Business name"
              className={INPUT_CLASS}
            />
          </div>

          {/* Address */}
          <div>
            <label className={LABEL_CLASS}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className={INPUT_CLASS}
            />
          </div>

          {/* Status */}
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {PIN_STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: opt.color, borderColor: opt.color, color: "#fff" }
                        : { backgroundColor: "transparent", borderColor: opt.color, color: opt.color }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className={LABEL_CLASS}>Contact</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact name"
              className={INPUT_CLASS}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={LABEL_CLASS}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={INPUT_CLASS}
            />
          </div>

          {/* Follow-up date */}
          <div>
            <label className={LABEL_CLASS}>Follow-Up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {/* Notes / Activity Log */}
          <div>
            <label className={LABEL_CLASS}>Activity Log</label>

            {/* Prior entries — newest first, read-only */}
            {notes.length > 0 && (
              <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                {[...notes].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-bg-secondary rounded-lg border border-border text-xs"
                  >
                    <p className="text-text-muted mb-0.5">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-text-primary">{entry.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* New note input */}
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note..."
              className={`${INPUT_CLASS} resize-none`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddNote();
              }}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteInput.trim()}
              className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-orange text-orange hover:bg-orange-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          {/* Delete button — edit mode only */}
          <div>
            {mode === "edit" && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Cancel + Save */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-orange text-white hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
