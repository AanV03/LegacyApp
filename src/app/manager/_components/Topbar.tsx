"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, User, LogOut, Menu, Bell, Clipboard, Folder, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useSidebar } from "~/components/ui/sidebar";

interface TopbarProps {
  userName?: string;
  onNotificationClick?: () => void;
}

interface StoredUser {
  name?: string;
  email?: string;
}

export function Topbar({ userName: initialUserName = "Usuario", onNotificationClick }: TopbarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState(initialUserName);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: unreadNotifications = [] } = api.notification.getUnread.useQuery();
  const { data: unreadCountData } = api.notification.getUnreadCount.useQuery();
  const unreadCount = unreadCountData?.unreadCount ?? 0;
  
  const recentNotifications = (unreadNotifications ?? []).slice(0, 3);

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case "TASK_CREATED":
        return "Tarea creada";
      case "TASK_ASSIGNED":
        return "Tarea asignada";
      case "TASK_UPDATED":
        return "Tarea actualizada";
      case "TASK_COMPLETED":
        return "Tarea completada";
      case "TASK_STATUS_CHANGED":
        return "Estado de tarea";
      case "TASK_DELETED":
        return "Tarea eliminada";
      case "PROJECT_CREATED":
        return "Proyecto creado";
      case "PROJECT_DELETED":
        return "Proyecto eliminado";
      case "COMMENT_ADDED":
        return "Comentario añadido";
      default:
        return type.replace(/_/g, " ");
    }
  };

  const getIconComponent = (type: string) => {
    if (type.includes("TASK")) return <Clipboard size={18} />;
    if (type.includes("PROJECT")) return <Folder size={18} />;
    if (type.includes("COMMENT")) return <MessageSquare size={18} />;
    return <Bell size={18} />;
  };

  useEffect(() => {
    // Obtener nombre del usuario desde localStorage o sessionStorage
    let foundUserName = initialUserName;
    
    // Intenta obtener desde localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser) as StoredUser;
        foundUserName = userObj.name ?? userObj.email ?? initialUserName;
      } catch {
        foundUserName = storedUser ?? initialUserName;
      }
    }
    
    // Intenta obtener desde sessionStorage
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser && foundUserName === initialUserName) {
      try {
        const userObj = JSON.parse(sessionUser) as StoredUser;
        foundUserName = userObj.name ?? userObj.email ?? initialUserName;
      } catch {
        foundUserName = sessionUser ?? initialUserName;
      }
    }
    
    setUserName(foundUserName);
  }, [initialUserName]);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    toast.success("Sesión cerrada exitosamente");
    router.push("/");
  };

  const handleSearchChange = (_e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(_e.target.value);
  };

  const handleSearchSubmit = (_e: React.FormEvent): void => {
    _e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implementar lógica de búsqueda
      console.log("Buscando:", searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full topbar-gradient-start border-b border-border shadow-sm h-16">
      <div className="flex items-center justify-between px-4 md:px-6 h-full">
        {/* Mobile Menu Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 -ml-2"
          onClick={() => setOpenMobile(true)}
        >
          <Menu size={20} />
        </Button>

        {/* Search Bar - Hidden on Mobile */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md mr-4"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </form>

        {/* Right section with user name and menu */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 bg-white/95 backdrop-blur max-h-96 overflow-y-auto shadow-lg rounded-lg border border-border" sideOffset={12}>
              {recentNotifications.length > 0 ? (
                <>
                  <div className="p-4 space-y-3 border-b">
                    <div className="text-sm font-semibold text-foreground">Notificaciones Recientes</div>
                    {recentNotifications.map((notif, idx) => {
                      return (
                        <div key={idx} className="px-3 py-2 text-sm rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-default border border-border/50">
                          <div className="flex items-start gap-2">
                            <span className="text-lg shrink-0">{getIconComponent(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground text-xs mb-1">{getNotificationLabel(notif.type)}</div>
                              <div className="text-xs text-muted-foreground wrap-break-word">{notif.message}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleString("es-ES", { 
                                  hour: "2-digit", 
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit"
                                }) : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setShowNotifications(false);
                      onNotificationClick?.();
                    }}
                    className="cursor-pointer justify-center py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Ver todas ({unreadCount})
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Name - Show on all sizes */}
          <span className="text-xs md:text-sm font-medium text-foreground truncate max-w-30 md:max-w-none">
            {userName}
          </span>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 bg-purple-400/15" sideOffset={12}>
              <DropdownMenuItem
                onClick={() => router.push("/manager/profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
