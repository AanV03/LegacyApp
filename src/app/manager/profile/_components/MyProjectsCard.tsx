"use client";

import { api } from "~/trpc/react";
import { useMemo } from "react";

interface Project {
    id?: string | number;
    name?: string | null;
    title?: string | null;
}

export default function MyProjectsCard({ _userEmail }: { _userEmail?: string }) {
    const query = api.project.list.useQuery();
    const projects = useMemo(() => (query.data ?? []) as Project[], [query.data]);
    const isLoading = query.isLoading;

    return (
        <div className="p-4 bg-card rounded-lg border shadow-sm">
            <div className="mb-2">
                <h4 className="font-semibold">Mis proyectos</h4>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
            ) : projects.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tienes proyectos aún</div>
            ) : (
                <ul className="space-y-2">
                    {projects.map((p: Project) => (
                        <li key={p.id} className="flex items-center justify-between">
                            <div className="text-sm wrap-break-word">{p.name ?? p.title ?? `#${p.id}`}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
