"use client";
// Tablas en celular: debajo de 600 px (breakpoint `sm` de MUI) una tabla de
// muchas columnas no se lee, así que cada fila pasa a ser una tarjeta con su
// título, hasta tres cifras fijas y el resto en "Ver detalle". En escritorio
// nada cambia: las vistas siguen mostrando su tabla.
import React from "react";
import { Box, ButtonBase, IconButton, MenuItem, Select, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconChevronDown, IconChevronUp, IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { cifraSx, controlSx, tarjetaSx, tinta } from "./estilo";

/** true en celular (menos de 600 px). En el servidor responde false: la tabla es la vista por defecto. */
export function useEsCelular() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
}

/** Una cifra de la tarjeta: su nombre y su valor ya formateado. */
export interface CifraTarjeta {
  titulo: string;
  valor: React.ReactNode;
}

export interface TarjetaMovil {
  clave: string;
  /** Título: nombre del producto, vendedor, categoría… Puede traer foto. */
  titulo: React.ReactNode;
  /** Línea chica bajo el título (SKU, categoría). */
  meta?: React.ReactNode;
  /** Cifras siempre visibles; se muestran hasta tres. */
  principales: CifraTarjeta[];
  /** Cifras que se ven al pulsar "Ver detalle". */
  detalle?: CifraTarjeta[];
  /** Acción al tocar el título (abrir la ficha, el detalle…). */
  onAbrir?: () => void;
}

/** Lista de tarjetas que reemplaza a una tabla en celular. */
export function TarjetasMovil({
  filas,
  cargando = false,
  vacio = "Sin datos para los filtros elegidos.",
}: {
  filas: TarjetaMovil[];
  cargando?: boolean;
  vacio?: React.ReactNode;
}) {
  if (cargando) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={112} sx={{ borderRadius: "14px" }} />
        ))}
      </Box>
    );
  }
  if (filas.length === 0) {
    return <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>{vacio}</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {filas.map((f) => (
        <Tarjeta key={f.clave} fila={f} />
      ))}
    </Box>
  );
}

function Tarjeta({ fila }: { fila: TarjetaMovil }) {
  const [abierta, setAbierta] = React.useState(false);
  const principales = fila.principales.slice(0, 3);
  const detalle = fila.detalle ?? [];
  return (
    <Box sx={{ ...tarjetaSx, px: 1.5, py: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        role={fila.onAbrir ? "link" : undefined}
        tabIndex={fila.onAbrir ? 0 : undefined}
        onClick={fila.onAbrir}
        onKeyDown={(e) => fila.onAbrir && e.key === "Enter" && fila.onAbrir()}
        sx={{
          minWidth: 0,
          cursor: fila.onAbrir ? "pointer" : "default",
          // Las celdas de escritorio (TextoCelda) cortan con "…": en la tarjeta el nombre se lee completo.
          "& .MuiTypography-noWrap": { whiteSpace: "normal", overflow: "visible", textOverflow: "clip" },
        }}
      >
        <Box sx={{ fontSize: 13.5, fontWeight: 700, color: tinta.primaria, lineHeight: 1.3, wordBreak: "break-word" }}>{fila.titulo}</Box>
        {fila.meta ? <Box sx={{ fontSize: 11.5, color: tinta.secundaria, mt: 0.25, wordBreak: "break-word" }}>{fila.meta}</Box> : null}
      </Box>

      {principales.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${principales.length}, minmax(0, 1fr))`,
            gap: 1,
            borderTop: `1px dashed ${tinta.borde}`,
            pt: 1,
          }}
        >
          {principales.map((c) => (
            <Box key={c.titulo} sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 10.5, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3 }}>{c.titulo}</Typography>
              <Box sx={{ fontSize: 14, fontWeight: 700, color: tinta.primaria, mt: 0.25, ...cifraSx, wordBreak: "break-word" }}>{c.valor}</Box>
            </Box>
          ))}
        </Box>
      )}

      {detalle.length > 0 && (
        <>
          <ButtonBase
            onClick={() => setAbierta((v) => !v)}
            aria-expanded={abierta}
            sx={{ alignSelf: "flex-start", gap: 0.5, fontSize: 12.5, fontWeight: 700, color: tinta.acento, borderRadius: "6px", px: 0.25 }}
          >
            {abierta ? "Ocultar detalle" : "Ver detalle"}
            {abierta ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </ButtonBase>
          {abierta && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                columnGap: 1.5,
                rowGap: 0.5,
                bgcolor: tinta.fondoSuave,
                borderRadius: "10px",
                px: 1.25,
                py: 1,
                fontSize: 12.5,
              }}
            >
              {detalle.map((c) => (
                <React.Fragment key={c.titulo}>
                  <Box sx={{ color: tinta.secundaria, minWidth: 0 }}>{c.titulo}</Box>
                  <Box sx={{ fontWeight: 600, color: tinta.primaria, textAlign: "right", ...cifraSx }}>{c.valor}</Box>
                </React.Fragment>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

/**
 * En celular no hay encabezados que tocar para ordenar: el orden se elige en
 * un selector con las mismas columnas y un botón invierte la dirección.
 */
export function OrdenMovil({
  opciones,
  clave,
  direccion,
  onCambiar,
}: {
  opciones: { clave: string; titulo: string }[];
  clave: string;
  direccion: "asc" | "desc";
  onCambiar: (clave: string, direccion: "asc" | "desc") => void;
}) {
  if (opciones.length === 0) return null;
  return (
    <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", width: "100%" }}>
      <Select
        size="small"
        value={opciones.some((o) => o.clave === clave) ? clave : ""}
        onChange={(e) => onCambiar(String(e.target.value), direccion)}
        displayEmpty
        renderValue={(v) => `Ordenar: ${opciones.find((o) => o.clave === v)?.titulo ?? "—"}`}
        sx={{ ...controlSx, flex: 1, minWidth: 0, fontSize: 13 }}
        inputProps={{ "aria-label": "Ordenar por" }}
      >
        {opciones.map((o) => (
          <MenuItem key={o.clave} value={o.clave} sx={{ fontSize: 13 }}>
            {o.titulo}
          </MenuItem>
        ))}
      </Select>
      <IconButton
        aria-label={direccion === "desc" ? "De mayor a menor" : "De menor a mayor"}
        title={direccion === "desc" ? "De mayor a menor" : "De menor a mayor"}
        onClick={() => onCambiar(clave, direccion === "desc" ? "asc" : "desc")}
        sx={{ width: 34, height: 34, borderRadius: "10px", border: `1px solid ${tinta.borde}`, color: tinta.primaria }}
      >
        {direccion === "desc" ? <IconSortDescending size={18} /> : <IconSortAscending size={18} />}
      </IconButton>
    </Box>
  );
}
