import { redirect } from "next/navigation";

/** Vista retirada: el segundo nivel (categoría) ahora es parte de Análisis por categoría.
 *  Los enlaces guardados conservan la categoría y el rango de fechas. */
export default function VistaRetirada({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const destino = new URLSearchParams();
  for (const clave of ["categoria", "fechaInicio", "fechaFin"]) {
    const valor = searchParams[clave];
    if (valor) destino.set(clave, valor);
  }
  const query = destino.toString();
  redirect(`/utilities/analisis-categoria${query ? `?${query}` : ""}`);
}
