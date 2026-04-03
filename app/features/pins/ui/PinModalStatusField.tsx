import type { PinStatus } from "@/app/features/pins/model/pin.types";
import { PIN_MODAL_LABEL_CLASS, PIN_MODAL_STATUS_OPTIONS } from "../model/pin-modal.model";

interface PinModalStatusFieldProps {
  status: PinStatus;
  onStatusChange: (status: PinStatus) => void;
}

export function PinModalStatusField({ status, onStatusChange }: PinModalStatusFieldProps) {
  return (
    <div>
      <label className={PIN_MODAL_LABEL_CLASS}>Status</label>
      <div className="flex gap-2 flex-wrap">
        {PIN_MODAL_STATUS_OPTIONS.map((option) => {
          const isSelected = status === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
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
  );
}
