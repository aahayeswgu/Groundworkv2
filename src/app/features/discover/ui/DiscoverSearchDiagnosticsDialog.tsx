"use client";

import type { DiscoverSearchMetrics } from "@/app/features/discover/model/discover.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/shared/ui/dialog";
import { Button } from "@/app/shared/ui/button";

interface DiscoverSearchDiagnosticsDialogProps {
  metrics: DiscoverSearchMetrics | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REJECT_REASON_LABELS: Record<string, string> = {
  missing_required_fields: "Missing required fields",
  out_of_bounds: "Outside drawn bounds",
  duplicate_place: "Duplicate place ID",
  closed_business_status: "Closed business status",
  low_rating_count: "Too few reviews",
  excluded_type_without_trade_signal: "Excluded non-trade type",
  address_only_without_trade_signal: "Address-only result",
  excluded_chain: "Excluded chain match",
  excluded_residential_name_without_trade_signal: "Residential-style name pattern",
};

export function DiscoverSearchDiagnosticsDialog({
  metrics,
  open,
  onOpenChange,
}: DiscoverSearchDiagnosticsDialogProps) {
  if (!metrics) return null;

  const rejectRows = Object.entries(metrics.rejectReasons)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1rem)] overflow-hidden border border-border bg-bg-card p-0 text-text-primary shadow-gw-lg sm:max-w-4xl">
        <DialogHeader className="gap-1 border-b border-border/70 px-5 py-4">
          <DialogTitle>Discover Search Diagnostics</DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Latest completed run metrics. This is optional and does not affect discover flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <section className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <SummaryCell label="Final results" value={metrics.finalResultCount} />
            <SummaryCell label="Fallback rate" value={`${Math.round(metrics.fallbackRate * 100)}%`} />
            <SummaryCell label="Nearby dropped" value={metrics.droppedNearby} />
            <SummaryCell label="Text dropped" value={metrics.droppedText} />
            <SummaryCell label="AV shortlisted" value={metrics.avShortlistCount} />
            <SummaryCell label="AV business" value={metrics.avBusinessSignals} />
            <SummaryCell label="AV residential" value={metrics.avResidentialSignals} />
            <SummaryCell label="AV dropped" value={metrics.avDroppedResults} />
          </section>

          <section className="rounded-lg border border-border/70 bg-bg p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Reject Reasons
            </h3>
            {rejectRows.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">No dropped results were recorded.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {rejectRows.map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {REJECT_REASON_LABELS[reason] ?? reason.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-md border border-border/60 bg-bg-card px-2 py-0.5 font-mono text-xs text-text-primary">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border/70 bg-bg p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Per-Category Pipeline
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-xs">
                <thead className="text-text-muted">
                  <tr className="border-b border-border/60">
                    <th className="px-2 py-2 font-semibold">Category</th>
                    <th className="px-2 py-2 font-semibold">Nearby Req</th>
                    <th className="px-2 py-2 font-semibold">Nearby Raw</th>
                    <th className="px-2 py-2 font-semibold">Nearby Kept</th>
                    <th className="px-2 py-2 font-semibold">Nearby Drop</th>
                    <th className="px-2 py-2 font-semibold">Retry No Excl</th>
                    <th className="px-2 py-2 font-semibold">Text Used</th>
                    <th className="px-2 py-2 font-semibold">Text Raw</th>
                    <th className="px-2 py-2 font-semibold">Text Kept</th>
                    <th className="px-2 py-2 font-semibold">Text Drop</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.categories.map((category) => (
                    <tr key={category.id} className="border-b border-border/40 last:border-0">
                      <td className="px-2 py-2 font-medium text-text-primary">{category.id}</td>
                      <td className="px-2 py-2 text-text-secondary">{booleanLabel(category.nearby.requested)}</td>
                      <td className="px-2 py-2 text-text-secondary">{category.nearby.raw}</td>
                      <td className="px-2 py-2 text-text-secondary">{category.nearby.accepted}</td>
                      <td className="px-2 py-2 text-text-secondary">{category.nearby.dropped}</td>
                      <td className="px-2 py-2 text-text-secondary">{booleanLabel(category.nearby.retriedWithoutExclusions)}</td>
                      <td className="px-2 py-2 text-text-secondary">{booleanLabel(category.textFallback.used)}</td>
                      <td className="px-2 py-2 text-text-secondary">{category.textFallback.raw}</td>
                      <td className="px-2 py-2 text-text-secondary">{category.textFallback.accepted}</td>
                      <td className="px-2 py-2 text-text-secondary">{category.textFallback.dropped}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <DialogFooter className="border-border/70 bg-bg-card/70 px-5 py-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function booleanLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function SummaryCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/70 bg-bg px-2.5 py-2">
      <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
