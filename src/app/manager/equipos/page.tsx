import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import ClientEquipos from "./ClientEquipos";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;

  if (!token) {
    // No token -> not authorized
    redirect("/manager/inicio");
  }

  try {
    const payload = jwt.verify(token, env.AUTH_SECRET ?? "") as any;
    const roles: string[] = [];
    if (payload.role) roles.push(payload.role);
    if (Array.isArray(payload.roles)) roles.push(...payload.roles);

    const isAdmin = roles.includes("ADMIN");
    if (!isAdmin) {
      redirect("/manager/inicio");
    }
  } catch (e) {
    // Invalid token -> redirect
    redirect("/manager/inicio");
  }

  // Authorized: render client UI with header
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Equipos</h2>
        <p className="text-muted-foreground">Administra miembros y roles</p>
      </div>
      <ClientEquipos />
    </>
  );
}
