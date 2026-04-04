import { SIDEBAR_TABS, type SidebarTab } from "@/app/widgets/sidebar/model/sidebar.model";

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
}

export default function SidebarTabs({ activeTab, onSelectTab }: SidebarTabsProps) {
  return (
    <div className="hidden border-b border-border bg-bg-card lg:flex">
      {SIDEBAR_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={`flex-1 py-3 px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-center transition-all duration-200 ${
            activeTab === tab.id
              ? "text-orange border-b-2 border-orange"
              : "text-text-muted border-b-2 border-transparent hover:text-text-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
