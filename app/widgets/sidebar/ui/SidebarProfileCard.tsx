import type { ReactNode } from "react";

interface SidebarProfileCardProps {
  avatar: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  trailing: ReactNode;
}

export default function SidebarProfileCard({
  avatar,
  title,
  subtitle,
  onClick,
  trailing,
}: SidebarProfileCardProps) {
  return (
    <div
      className="flex cursor-pointer items-center gap-3 border-b border-border bg-bg-card px-5 py-4 transition-colors duration-150 hover:bg-orange-dim"
      onClick={onClick}
    >
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-orange text-[15px] font-extrabold text-white">
        {avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-text-primary">{title}</div>
        <div className="mt-px truncate text-[11px] text-text-secondary">{subtitle}</div>
      </div>
      {trailing}
    </div>
  );
}

