"use client";

import { useEffect, useState } from "react";
import EditProfileModal from "./_components/EditProfileModal";
import MyProjectsCard from "./_components/MyProjectsCard";
import MyTasksCard from "./_components/MyTasksCard";

interface StoredUser {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    github?: string;
    website?: string;
    bio?: string;
    skills?: string[] | string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<StoredUser | undefined>(undefined);

    useEffect(() => {
        const stored = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as StoredUser;
                setUser(parsed);
            } catch {
                setUser({ name: stored });
            }
        } else {
            setUser({ name: "Aaron", email: "aaronavarah@gmail.com" });
        }
    }, []);

    return (
        <div className="w-full min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 py-2 sm:py-6 lg:py-8 max-w-7xl">
                <div className="flex items-center justify-between gap-3 mb-6 lg:mb-8">
                    <div className="space-y-1 flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight truncate">Mi Perfil</h1>
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">Gestiona tu información personal y configuración de cuenta</p>
                    </div>
                    <div className="shrink-0">
                        <EditProfileModal user={user} onSave={(d) => setUser(d)} />
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border p-4 sm:p-6">
                            <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-4">Información Personal</h3>

                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Nombres</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.name ?? "No especificado"}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Correo Electrónico</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.email ?? "No especificado"}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Teléfono</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.phone ?? "No especificado"}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Ubicación</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.location ?? "No especificado"}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">GitHub</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.github ?? "No especificado"}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Sitio web</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.website ?? "No especificado"}</p>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Bio</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{user?.bio ?? "No especificado"}</p>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Skills</div>
                                    <p className="font-medium text-sm sm:text-base wrap-break-word">{(user?.skills && Array.isArray(user.skills)) ? user.skills.join(", ") : (user?.skills ?? "No especificado")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        <MyProjectsCard _userEmail={user?.email} />
                        <MyTasksCard _userEmail={user?.email} />
                    </div>
                </div>
            </div>
        </div>
    );
}
