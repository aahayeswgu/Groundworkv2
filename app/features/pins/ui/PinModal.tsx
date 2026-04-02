"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/app/store";
import type { Pin, PinStatus, NoteEntry } from "../model/pin.types";
import { buildCreatePin, buildNoteEntry, buildUpdatePinPatch } from "../lib/pin-modal";
import { PIN_MODAL_INPUT_CLASS, PIN_MODAL_LABEL_CLASS } from "../model/pin-modal.model";
import { PinModalFooter } from "./PinModalFooter";
import { PinModalHeader } from "./PinModalHeader";
import { PinModalNotesSection } from "./PinModalNotesSection";
import { PinModalStatusField } from "./PinModalStatusField";

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

  // ESC key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSave() {
    const timestamp = new Date().toISOString();

    if (mode === "create") {
      addPin(buildCreatePin({
        initialData,
        title,
        address,
        status,
        contact,
        phone,
        followUpDate,
        notes,
        timestamp,
      }));
    } else {
      updatePin(initialData.id!, buildUpdatePinPatch({
        title,
        address,
        status,
        contact,
        phone,
        followUpDate,
        notes,
        timestamp,
      }));
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
      <div className="relative z-10 bg-bg-card rounded-xl border border-border shadow-gw w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <PinModalHeader mode={mode} onClose={onClose} />

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

          <PinModalStatusField status={status} onStatusChange={setStatus} />

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

        {/* Footer */}
        <PinModalFooter mode={mode} onClose={onClose} onDelete={handleDelete} onSave={handleSave} />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
