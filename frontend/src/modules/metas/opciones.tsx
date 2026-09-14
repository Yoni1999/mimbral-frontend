import { IconBuildingStore, IconUser, IconUsers, IconUsersGroup } from "@tabler/icons-react";
import type { AssignmentMode, TargetType } from "./types";

interface Opcion<T> {
  value: T;
  titulo: string;
  descripcion: string;
  icon: JSX.Element;
}

/** Catálogo de opciones de las tarjetas seleccionables del wizard/edición de
 *  metas — compartido para no duplicar textos e íconos entre MetaWizard y la
 *  página de edición. */
export const OPCIONES_TARGET_TYPE: Opcion<TargetType>[] = [
  { value: "SELLER", titulo: "Vendedor", descripcion: "Asigna la meta a uno o varios vendedores.", icon: <IconUser size={20} /> },
  { value: "SALES_CHANNEL", titulo: "Canal de venta", descripcion: "Asigna la meta a uno o varios canales de venta.", icon: <IconBuildingStore size={20} /> },
];

export const OPCIONES_ASIGNACION: Opcion<AssignmentMode>[] = [
  { value: "INDIVIDUAL", titulo: "Individual", descripcion: "Cada responsable tiene el objetivo completo.", icon: <IconUser size={20} /> },
  { value: "SHARED", titulo: "Compartido", descripcion: "Todos suman contra una misma meta.", icon: <IconUsersGroup size={20} /> },
  { value: "DISTRIBUTED", titulo: "Distribuido", descripcion: "El objetivo se reparte entre responsables.", icon: <IconUsers size={20} /> },
];
