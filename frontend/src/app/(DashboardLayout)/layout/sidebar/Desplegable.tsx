"use client";
// Entrada del menú con páginas adentro (p. ej. Informes → Mercado Libre). Se
// abre y cierra al pulsarla; arranca abierta si la ruta actual es una de sus
// páginas. La usan el rail de escritorio y la barra de celular, cada uno con
// su propio estilo de fila (renderFila).
import React, { useState } from "react";
import { Box } from "@mui/material";
import { IconChevronDown } from "@tabler/icons-react";
import { Pagina, desplegableActivo } from "./MenuItems";

interface Props {
  pagina: Pagina;
  path: string;
  /** Estilo de la fila de cabecera (mismo que una página del menú). */
  sxCabecera: (activa: boolean) => object;
  /** Cómo se dibuja cada página de adentro. */
  renderHijo: (p: Pagina) => React.ReactNode;
  tamanoIcono?: number;
}

export default function Desplegable({ pagina, path, sxCabecera, renderHijo, tamanoIcono = 17 }: Props) {
  const activa = desplegableActivo(pagina, path);
  const [abierto, setAbierto] = useState(activa);
  const Icono = pagina.icon;
  return (
    <Box>
      <Box
        component="button"
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        sx={{ ...sxCabecera(activa), width: "100%", border: 0, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}
      >
        <Box component="span" className="pagina-icono" sx={{ display: "flex", color: activa ? "#1d4ed8" : "#9ca3af" }}>
          <Icono size={tamanoIcono} stroke={1.7} />
        </Box>
        <Box component="span" sx={{ flex: 1 }}>
          {pagina.titulo}
        </Box>
        <Box component="span" sx={{ display: "flex", color: "#9ca3af", transition: "transform 150ms", transform: abierto ? "rotate(180deg)" : "none" }}>
          <IconChevronDown size={16} />
        </Box>
      </Box>
      {abierto && (
        <Box role="group" aria-label={pagina.titulo} sx={{ ml: 2.5, pl: 0.5, borderLeft: "1px solid #e5e7eb" }}>
          {(pagina.hijos ?? []).map((h) => (
            <React.Fragment key={h.href}>{renderHijo(h)}</React.Fragment>
          ))}
        </Box>
      )}
    </Box>
  );
}
