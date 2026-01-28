"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "~/components/ui/sidebar";
import { SidebarNav } from "~/app/manager/_components/Sidebar";
import { Topbar } from "~/app/manager/_components/Topbar";

const tabToPath: Record<string, string> = {
    dashboard: "inicio",
    tasks: "tareas",
    projects: "proyectos",
    teams: "equipos",
    comments: "comentarios",
    history: "historial",
    reports: "reportes",
};

const pathToTab = (p: string) => {
    if (!p) return "dashboard";
    if (p.startsWith("/manager/inicio")) return "dashboard";
    if (p.startsWith("/manager/tareas")) return "tasks";
    if (p.startsWith("/manager/proyectos")) return "projects";
    if (p.startsWith("/manager/equipos")) return "teams";
    if (p.startsWith("/manager/comentarios")) return "comments";
    if (p.startsWith("/manager/historial")) return "history";
    if (p.startsWith("/manager/reportes")) return "reports";
    return "dashboard";
};

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("dashboard");

    useEffect(() => {
        setSelectedTab(pathToTab(pathname ?? ""));
    }, [pathname]);

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab);
        const p = tabToPath[tab] ?? "inicio";
        try {
            router.push(`/manager/${p}`);
        } catch { }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <SidebarNav activeTab={selectedTab} onTabChange={handleTabChange} />

                <div className="flex-1 flex flex-col">
                    <Topbar userName="Usuario" onNotificationClick={() => router.push("/manager/notificaciones")} />

                    <main className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="p-6 md:p-8">
                            <div className="mx-auto max-w-7xl">{children}</div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
