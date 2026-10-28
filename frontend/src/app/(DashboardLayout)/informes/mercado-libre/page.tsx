import { redirect } from "next/navigation";

/** /informes/mercado-libre no es un informe: es el grupo del menú. Lleva al primero. */
export default function InformesMercadoLibre() {
  redirect("/informes/mas-vendidos-mercado-libre");
}
