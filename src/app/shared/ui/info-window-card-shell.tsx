import { X, ExternalLink } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { Card, CardContent } from "@/app/shared/ui/card";

interface InfoWindowCardShellProps {
  title: string;
  subtitle?: React.ReactNode;
  rating?: React.ReactNode;
  address?: React.ReactNode;
  details?: React.ReactNode;
  mapLinkHref?: string;
  mapLinkLabel?: string | React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  belowContent?: React.ReactNode;
  imageUrl?: string | null;
  imageAlt?: string;
  onClose?: () => void;
  className?: string;
  contentClassName?: string;
  actionsClassName?: string;
  belowContentClassName?: string;
}

export function InfoWindowCardShell({
  title,
  subtitle,
  rating,
  address,
  details,
  mapLinkHref,
  mapLinkLabel = "Open in Google Maps",
  actions,
  footer,
  belowContent,
  imageUrl,
  imageAlt,
  onClose,
  className,
  contentClassName,
  actionsClassName,
  belowContentClassName,
}: InfoWindowCardShellProps) {
  return (
    <Card
      className={cn(
        "w-full min-w-0 max-w-[500px] gap-0 [--info-card-radius:22px] rounded-[var(--info-card-radius)] border-none bg-bg-card/95 py-0 font-sans shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-md",
        className,
      )}
    >
      <div className="grid min-w-0 grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="relative h-[120px] overflow-hidden bg-bg-input sm:h-auto sm:min-h-full sm:rounded-l-[var(--info-card-radius)]">
          {imageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${imageUrl}')` }}
                aria-label={imageAlt ?? title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-input via-bg-secondary to-bg-primary text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-20">
              No Photo
            </div>
          )}
        </div>

        <CardContent className={cn("flex min-w-0 flex-col gap-2.5 p-3.5 sm:rounded-r-[var(--info-card-radius)]", contentClassName)}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[16px] font-extrabold leading-tight tracking-tight text-white">
                {title}
              </h3>
              {subtitle ? <div className="mt-1.5">{subtitle}</div> : null}
            </div>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-text-muted transition-all hover:bg-white/10 hover:text-white active:scale-90"
                aria-label="Close details"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            {rating ? <div className="text-xs">{rating}</div> : null}

            {address ? <div className="text-[12px] leading-snug text-text-muted/80">{address}</div> : null}

            {details ? <div className="space-y-1 text-[12px] text-text-secondary/80">{details}</div> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mapLinkHref ? (
              <a
                href={mapLinkHref}
                target="_blank"
                rel="noopener"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 text-[10px] font-bold text-text-primary no-underline transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
              >
                <ExternalLink className="size-3" />
                {mapLinkLabel}
              </a>
            ) : null}
          </div>

          {actions ? <div className={cn("mt-1", actionsClassName)}>{actions}</div> : null}

          {footer}
        </CardContent>
      </div>

      {belowContent ? (
        <div className={cn("px-3.5 pt-2 pb-3.5", belowContentClassName)}>
          {belowContent}
        </div>
      ) : null}
    </Card>
  );
}
