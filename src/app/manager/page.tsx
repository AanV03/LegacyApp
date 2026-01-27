import { redirect } from "next/navigation";

export default function ManagerPage() {
  // Redirect /manager -> /manager/inicio
  redirect("/manager/inicio");
}
