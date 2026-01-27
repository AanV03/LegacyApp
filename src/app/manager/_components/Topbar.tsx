"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, User, LogOut, Menu, Bell } from "lucide-react";
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-purple-400/15 max-h-96 overflow-y-auto" sideOffset={12}>
              {recentNotifications.length > 0 ? (
                <>
                  <div className="px-2 py-2 space-y-1">
                    {recentNotifications.map((notif, idx) => (
                      <div key={idx} className="px-3 py-2 text-sm rounded hover:bg-purple-300/20 cursor-default">
                        <div className="font-medium text-foreground">[{notif.type}]</div>
                        <div className="text-xs text-muted-foreground mt-1">{notif.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setShowNotifications(false);
                      onNotificationClick?.();
                    }}
                    className="cursor-pointer justify-center py-2 text-sm"
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
