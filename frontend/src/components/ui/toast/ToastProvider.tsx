"use client";
import { useMediaQuery } from "@mui/material";
import { Toaster } from "react-hot-toast";

/** Monta el contenedor de avisos flotantes. Una sola vez, en el layout raiz
 * — ver src/app/layout.tsx. En escritorio van arriba a la derecha; en celular
 * abajo, sobre la barra de navegación (64 px), porque arriba tapaban el
 * encabezado y el botón de filtros de la vista mientras duraban. */
export default function ToastProvider() {
  // Mismo corte que el breakpoint `sm` de MUI; sin tema: este provider vive fuera de él.
  const esCelular = useMediaQuery("(max-width:599.95px)", { noSsr: true });
  return (
    <Toaster
      position={esCelular ? "bottom-center" : "top-right"}
      toastOptions={{ duration: Infinity }}
      containerStyle={
        esCelular
          ? // Bajo los modales de MUI (1300): una hoja de filtros abierta tapa
            // el aviso y no al revés. Sobre la barra de navegación no hace falta
            // competir: el aviso queda encima de ella por posición, no por capa.
            { zIndex: 1250, bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", left: 12, right: 12 }
          : { zIndex: 2000 }
      }
    />
  );
}
