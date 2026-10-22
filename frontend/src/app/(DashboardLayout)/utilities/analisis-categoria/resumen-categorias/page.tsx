import { redirect } from "next/navigation";

/** Vista retirada: el primer nivel ahora es parte de Análisis por categoría. */
export default function ResumenCategoriasRetirada() {
  redirect("/utilities/analisis-categoria");
}
