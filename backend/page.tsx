import { redirect } from "next/navigation";

export default function Home() {
  redirect("/authentication/login"); // 🔄 Redirige al login automáticamente
}
