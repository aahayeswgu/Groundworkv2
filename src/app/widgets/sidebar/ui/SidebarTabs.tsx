import { SIDEBAR_TABS, type SidebarTab } from "@/app/widgets/sidebar/model/sidebar.model";
import { Tabs, TabsList, TabsTrigger } from "@/app/shared/ui/tabs";

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
}

export default function SidebarTabs({ activeTab, onSelectTab }: SidebarTabsProps) {
  return (
    <div className="hidden border-b border-border bg-bg-card lg:block">
      <Tabs
        value={activeTab}
        onValueChange={(value) => onSelectTab(value as SidebarTab)}
        className="w-full gap-0"
      >
        <TabsList variant="line" className="h-auto w-full gap-0 rounded-none p-0">
          {SIDEBAR_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted shadow-none transition-all duration-200 hover:text-text-secondary data-[state=active]:border-orange data-[state=active]:bg-transparent data-[state=active]:text-orange data-[state=active]:shadow-none after:hidden"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
