"use client";

import React from "react";
import { Box, Skeleton, Tooltip, Typography } from "@mui/material";
import { BarraParticipacion, cifraSx, tinta } from "./estilo";

export interface ItemBarra {
  clave: string;
  etiqueta: string;
  valor: number;
  /** Valor ya formateado para mostrar (si no, se muestra el número). */
  texto?: string;
  /** Contenido extra a la derecha del valor: porcentaje, chip de margen, etc. */
  detalle?: React.ReactNode;
  color?: string;
  tooltip?: React.ReactNode;
}

interface Props {
  items: ItemBarra[];
  cargando?: boolean;
  filasCargando?: number;
  vacio?: string;
  /** Número de posición delante de cada etiqueta (rankings). */
  numerado?: boolean;
  /** Si viene, cada fila es clicable (y accesible con Enter). */
  onSeleccionar?: (item: ItemBarra) => void;
  /** Clave de la fila seleccionada: se resalta y las demás se atenúan. */
  seleccionada?: string | null;
  colorPorDefecto?: string;
}

/** Ranking con barras horizontales: etiqueta y valor escritos junto a cada
 *  barra. Reemplaza a los donuts y barras de Apex de las vistas de ventas:
 *  con pocas categorías se compara mejor la longitud que el ángulo. */
export default function ListaBarras({
  items,
  cargando = false,
  filasCargando = 6,
  vacio = "Sin datos en el período.",
  numerado = false,
  onSeleccionar,
  seleccionada = null,
  colorPorDefecto = tinta.acento,
}: Props) {
  if (cargando) {
    return (
      <>
        {Array.from({ length: filasCargando }).map((_, i) => (
          <Skeleton key={i} height={44} />
        ))}
      </>
    );
  }
  if (items.length === 0) {
    return <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>{vacio}</Typography>;
  }

  const maximo = Math.max(0, ...items.map((i) => i.valor));

  return (
    <>
      {items.map((item, i) => {
        const activa = seleccionada === item.clave;
        const atenuada = seleccionada != null && !activa;
        const fila = (
          <Box
            role={onSeleccionar ? "button" : undefined}
            tabIndex={onSeleccionar ? 0 : undefined}
            aria-pressed={onSeleccionar ? activa : undefined}
            onClick={onSeleccionar ? () => onSeleccionar(item) : undefined}
            onKeyDown={onSeleccionar ? (e) => e.key === "Enter" && onSeleccionar(item) : undefined}
            sx={{
              py: 0.9,
              px: 1,
              mx: -1,
              borderRadius: "10px",
              cursor: onSeleccionar ? "pointer" : "default",
              opacity: atenuada ? 0.45 : 1,
              bgcolor: activa ? "#eff4ff" : "transparent",
              transition: "opacity 120ms ease, background-color 120ms ease",
              "&:hover": onSeleccionar ? { bgcolor: activa ? "#eff4ff" : tinta.fondoSuave } : undefined,
              "&:focus-visible": { outline: `2px solid ${tinta.acento}` },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, mb: 0.6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                {item.color && <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: item.color, flexShrink: 0 }} />}
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: tinta.primaria }}>
                  {numerado && (
                    <Box component="span" sx={{ color: tinta.tenue, mr: 0.75, ...cifraSx }}>
                      {i + 1}
                    </Box>
                  )}
                  {item.etiqueta}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: tinta.primaria, ...cifraSx }}>
                  {item.texto ?? item.valor.toLocaleString("es-CL")}
                </Typography>
                {item.detalle}
              </Box>
            </Box>
            <BarraParticipacion valor={item.valor} maximo={maximo} color={item.color || colorPorDefecto} />
          </Box>
        );
        return item.tooltip ? (
          <Tooltip key={item.clave} title={item.tooltip} placement="top" arrow>
            {fila}
          </Tooltip>
        ) : (
          <React.Fragment key={item.clave}>{fila}</React.Fragment>
        );
      })}
    </>
  );
}
