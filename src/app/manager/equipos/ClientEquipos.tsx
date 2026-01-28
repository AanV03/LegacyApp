"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TeamCard from "./_components/TeamCard";
import TeamForm from "./_components/TeamForm";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type Task = { id: string; title: string; status: string };
type Team = { id: string; name: string; members: string[]; tasks: Task[] };

export default function ClientEquipos() {
    const router = useRouter();
    const { data: me, isLoading } = api.user.me.useQuery(undefined, {
        retry: false,
    });

    // Client-side fallback: if the current user is present and is not ADMIN, redirect.
    useEffect(() => {
        if (!isLoading && me) {
            const isAdmin = !!(me.role === "ADMIN" || me.roles?.includes?.("ADMIN"));
            if (!isAdmin) {
                router.replace("/manager/inicio");
            }
        }
    }, [me, isLoading, router]);

    const [teams, setTeams] = useState<Team[]>([
        {
            id: "1",
            name: "Front-end",
            members: ["Ana", "Luis", "María"],
            tasks: [
                { id: "t1", title: "Diseñar header", status: "open" },
                { id: "t2", title: "Refactorizar botón", status: "in-progress" },
            ],
        },
        {
            id: "2",
            name: "Back-end",
            members: ["Pedro", "Sofía"],
            tasks: [{ id: "t3", title: "API login", status: "open" }],
        },
    ]);

    const [showForm, setShowForm] = useState(false);

    function handleCreate(team: { name: string; members: string[]; tasks: string[] }) {
        const newTeam: Team = {
            id: String(Date.now()),
            name: team.name,
            members: team.members,
            tasks: team.tasks.map((t, i) => ({ id: `${Date.now()}-${i}`, title: t, status: "open" })),
        };
        setTeams((s) => [newTeam, ...s]);
        setShowForm(false);
    }

    return (
        <div className="p-6">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Equipos</h1>
                <div>
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                        Crear equipo
                    </Button>
                </div>
            </header>

            {showForm && (
                <div className="mb-6">
                    <TeamForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <TeamCard key={team.id} team={team} />
                ))}
            </div>
        </div>
    );
}
