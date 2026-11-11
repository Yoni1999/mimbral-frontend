import { redirect } from "next/navigation";

/** Categorías → Mercado Libre abre en el informe de categorías. */
export default function Page() {
  redirect("/utilities/categorias/mercado-libre/informe");
}
