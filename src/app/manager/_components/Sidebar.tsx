"use client";

import Image from "next/image";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  MessageSquare,
  History,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/use-mobile";

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "tasks", label: "Tareas", icon: CheckSquare },
  { id: "projects", label: "Proyectos", icon: Briefcase },
  { id: "comments", label: "Comentarios", icon: MessageSquare },
  { id: "history", label: "Historial", icon: History },
  { id: "reports", label: "Reportes", icon: FileText },
];

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const gradientClass = !isMobile
    ? "**:data-[sidebar='sidebar']:bg-linear-to-b **:data-[sidebar='sidebar']:from-purple-400/40 **:data-[sidebar='sidebar']:via-purple-300/25 **:data-[sidebar='sidebar']:to-blue-400/40"
    : "md:**:data-[sidebar='sidebar']:bg-sidebar";

  return (
    <Sidebar className={`border-r ${gradientClass}`}>
      {/* Header */}
      <SidebarHeader className="border-b px-4 h-16 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Manager Logo" width={32} height={32} />
          <h1 className="text-lg font-bold text-foreground">Manager</h1>
        </div>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => {
                    onTabChange(item.id);
                    setOpenMobile(false);
                  }}
                  isActive={isActive}
                  className="cursor-pointer px-4 py-2.5"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t px-4 py-4">
        <div className="text-xs text-muted-foreground text-center">
          © Legacy App
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
