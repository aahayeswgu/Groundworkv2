"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useStore } from "@/app/store";
import type { Pin, PinStatus, NoteEntry } from "../model/pin.types";
import { buildCreatePin, buildNoteEntry, buildUpdatePinPatch } from "../lib/pin-modal";
import { resolvePinMetadataForSave } from "../lib/pin-save";
import {
  PIN_MODAL_INPUT_CLASS,
  PIN_MODAL_LABEL_CLASS,
  PIN_MODAL_STATUS_OPTIONS,
} from "../model/pin-modal.model";
import { PinModalNotesSection } from "./PinModalNotesSection";

export interface PinModalProps {
  mode: "create" | "edit";
  initialData: Partial<Pin>;
  onClose: () => void;
}

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
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const metadataResult = await resolvePinMetadataForSave({
        initialData,
        title,
        address,
      });
      if (!metadataResult.ok) {
        toast.error(metadataResult.error);
        return;
      }

      const timestamp = new Date().toISOString();
      const {
        resolvedAddress,
        placeId: resolvedPlaceId,
        photoUrl: resolvedPhotoUrl,
        rating: resolvedRating,
        ratingCount: resolvedRatingCount,
      } = metadataResult.data;

      if (mode === "create") {
        addPin(
          buildCreatePin({
            initialData: {
              ...initialData,
              placeId: resolvedPlaceId,
              photoUrl: resolvedPhotoUrl,
              rating: resolvedRating,
              ratingCount: resolvedRatingCount,
            },
            title,
            address: resolvedAddress,
            status,
            contact,
            phone,
            followUpDate,
            notes,
            timestamp,
          }),
        );
      } else {
        updatePin(
          initialData.id!,
          buildUpdatePinPatch({
            title,
            address: resolvedAddress,
            status,
            contact,
            phone,
            followUpDate,
            notes,
            timestamp,
            placeId: resolvedPlaceId,
            photoUrl: resolvedPhotoUrl,
            rating: resolvedRating,
            ratingCount: resolvedRatingCount,
          }),
        );
      }

      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (initialData.id) {
      deletePin(initialData.id);
    }
    onClose();
  }

  function handleAddNote() {
    const nextNote = buildNoteEntry(noteInput, new Date().toISOString());
    if (!nextNote) return;
    setNotes((prev) => [...prev, nextNote]);
    setNoteInput("");
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal card */}
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="relative z-10 bg-bg-card rounded-xl border border-border shadow-gw w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
      >
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
            <label className={PIN_MODAL_LABEL_CLASS}>Business Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Business name"
              className={PIN_MODAL_INPUT_CLASS}
            />
          </div>

          {/* Address */}
          <div>
            <label className={PIN_MODAL_LABEL_CLASS}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className={PIN_MODAL_INPUT_CLASS}
            />
          </div>

          <div>
            <label className={PIN_MODAL_LABEL_CLASS}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {PIN_MODAL_STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: option.color, borderColor: option.color, color: "#fff" }
                        : { backgroundColor: "transparent", borderColor: option.color, color: option.color }
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className={PIN_MODAL_LABEL_CLASS}>Contact</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Contact name"
              className={PIN_MODAL_INPUT_CLASS}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={PIN_MODAL_LABEL_CLASS}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={PIN_MODAL_INPUT_CLASS}
            />
          </div>

          {/* Follow-up date */}
          <div>
            <label className={PIN_MODAL_LABEL_CLASS}>Follow-Up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={PIN_MODAL_INPUT_CLASS}
            />
          </div>

          {/* Notes / Activity Log */}
          <PinModalNotesSection
            notes={notes}
            noteInput={noteInput}
            onNoteInputChange={setNoteInput}
            onAddNote={handleAddNote}
          />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          <div>
            {mode === "edit" && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                void handleSave();
              }}
              disabled={saving}
              className={`px-4 py-2 text-sm font-medium rounded-lg bg-orange text-white transition-opacity ${
                saving ? "cursor-default opacity-70" : "hover:opacity-90"
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
