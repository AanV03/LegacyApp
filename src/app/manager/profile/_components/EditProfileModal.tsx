"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

interface UserProfile {
    name?: string;
    email?: string;
    phone?: string;
    github?: string;
    website?: string;
    location?: string;
    bio?: string;
    skills?: string[] | string;
}

interface Props {
    user?: UserProfile;
    onSave?: (data: UserProfile) => void;
}

export default function EditProfileModal({ user, onSave }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [name, setName] = useState<string>(user?.name ?? "");
    const [email, setEmail] = useState<string>(user?.email ?? "");
    const [phone, setPhone] = useState<string>(user?.phone ?? "");
    const [github, setGithub] = useState<string>(user?.github ?? "");
    const [website, setWebsite] = useState<string>(user?.website ?? "");
    const [location, setLocation] = useState<string>(user?.location ?? "");
    const [bio, setBio] = useState<string>(user?.bio ?? "");
    const initialSkills = Array.isArray(user?.skills)
        ? user.skills.join(", ")
        : typeof user?.skills === "string"
        ? user.skills
        : "";
    const [skills, setSkills] = useState<string>(initialSkills);

    useEffect(() => {
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setPhone(user?.phone ?? "");
        setGithub(user?.github ?? "");
        setWebsite(user?.website ?? "");
        setLocation(user?.location ?? "");
        setBio(user?.bio ?? "");
        setSkills(Array.isArray(user?.skills) ? user.skills.join(", ") : typeof user?.skills === "string" ? user.skills : "");
    }, [user]);

    const handleOpen = () => setOpen(true);

    const handleSave = async () => {
        const payload: UserProfile & { skills?: string[] } = {
            name: name || undefined,
            email: email || undefined,
            phone: phone || undefined,
            github: github || undefined,
            website: website || undefined,
            location: location || undefined,
            bio: bio || undefined,
            skills: skills ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        };

        try {
            type TRPCModule = {
                api?: {
                    user?: {
                        update?: {
                            mutateAsync?: (p: unknown) => Promise<unknown>;
                        };
                    };
                };
            };

            const mod = (await import("~/trpc/react")) as TRPCModule | undefined;
            if (mod?.api?.user?.update?.mutateAsync) {
                try {
                    await mod.api.user.update.mutateAsync(payload);
                } catch {
                }
            }
        } catch {
        }

        try {
            localStorage.setItem("user", JSON.stringify(payload));
            sessionStorage.setItem("user", JSON.stringify(payload));
        } catch {
        }

        onSave?.(payload);
        setOpen(false);
    };

    return (
        <div>
            <Button onClick={handleOpen}>Editar perfil</Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Editar perfil (opcional)</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div>
                                <label htmlFor="name-input" className="block text-sm text-muted-foreground">Nombre</label>
                                <input id="name-input" placeholder="Nombre" className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="email-input" className="block text-sm text-muted-foreground">Correo</label>
                                <input id="email-input" placeholder="correo@ejemplo.com" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>

                            <div>
                                <label htmlFor="phone-input" className="block text-sm text-muted-foreground">Teléfono</label>
                                <input id="phone-input" placeholder="+34 600 000 000" className="w-full border rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="location-input" className="block text-sm text-muted-foreground">Ubicación</label>
                                <input id="location-input" placeholder="Ciudad, País" className="w-full border rounded px-3 py-2" value={location} onChange={(e) => setLocation(e.target.value)} />
                            </div>

                            <div>
                                <label htmlFor="github-input" className="block text-sm text-muted-foreground">GitHub</label>
                                <input id="github-input" placeholder="github.com/usuario" className="w-full border rounded px-3 py-2" value={github} onChange={(e) => setGithub(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="website-input" className="block text-sm text-muted-foreground">Sitio web</label>
                                <input id="website-input" placeholder="https://..." className="w-full border rounded px-3 py-2" value={website} onChange={(e) => setWebsite(e.target.value)} />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="bio-textarea" className="block text-sm text-muted-foreground">Bio / Notas</label>
                                <textarea id="bio-textarea" placeholder="Una breve biografía" className="w-full border rounded px-3 py-2" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="skills-input" className="block text-sm text-muted-foreground">Skills (coma-separadas)</label>
                                <input id="skills-input" placeholder="react, node, prisma" className="w-full border rounded px-3 py-2" value={skills} onChange={(e) => setSkills(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Guardar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
