"use client";

import React from "react";
import { Box, IconButton, InputAdornment, Pagination, Skeleton, TableCell, TableSortLabel, TextField, Typography } from "@mui/material";
import { IconSearch, IconX } from "@tabler/icons-react";
import { cifraSx, controlSx, tarjetaSx, tinta } from "../estilo";

/** Una cifra del resumen del detalle (franja superior). */
export interface Cifra {
  etiqueta: string;
  valor: string;
  ayuda?: string;
}

export function FranjaResumen({ cifras, cargando }: { cifras: Cifra[]; cargando: boolean }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: `repeat(${cifras.length}, 1fr)` }, gap: 1.5, mb: 2 }}>
      {cifras.map((c) => (
        <Box key={c.etiqueta} sx={{ ...tarjetaSx, px: 1.75, py: 1.25 }} title={c.ayuda}>
          <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: tinta.secundaria }}>
            {c.etiqueta}
          </Typography>
          <Typography noWrap sx={{ fontSize: 21, fontWeight: 750, color: tinta.primaria, lineHeight: 1.25, ...cifraSx }}>
            {cargando ? <Skeleton width={90} /> : c.valor}
          </Typography>
          {c.ayuda && (
            <Typography noWrap sx={{ fontSize: 11, color: tinta.tenue }}>
              {c.ayuda}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

export function Buscador({ valor, onCambiar, placeholder }: { valor: string; onCambiar: (v: string) => void; placeholder: string }) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconSearch size={15} color={tinta.tenue} />
          </InputAdornment>
        ),
        endAdornment: valor ? (
          <IconButton size="small" aria-label="Borrar búsqueda" onClick={() => onCambiar("")}>
            <IconX size={15} />
          </IconButton>
        ) : null,
      }}
      sx={{ width: { xs: "100%", sm: 320 }, "& .MuiOutlinedInput-root": controlSx }}
    />
  );
}

/** Celda de encabezado que ordena la lista del servidor. */
export function Encabezado({
  columna,
  texto,
  orden,
  onOrdenar,
  align = "left",
}: {
  columna?: string;
  texto: string;
  orden: { orden: string; direccion: "asc" | "desc" };
  onOrdenar: (columna: string) => void;
  align?: "left" | "right";
}) {
  if (!columna) return <TableCell align={align}>{texto}</TableCell>;
  const activa = orden.orden === columna;
  return (
    <TableCell align={align} sortDirection={activa ? orden.direccion : false}>
      <TableSortLabel active={activa} direction={activa ? orden.direccion : "desc"} onClick={() => onOrdenar(columna)}>
        {texto}
      </TableSortLabel>
    </TableCell>
  );
}

export function Paginador({ total, pagina, tamano, onPagina }: { total: number; pagina: number; tamano: number; onPagina: (p: number) => void }) {
  const paginas = Math.ceil(total / tamano);
  if (total === 0) return null;
  const desde = (pagina - 1) * tamano + 1;
  const hasta = Math.min(pagina * tamano, total);
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mt: 1.5 }}>
      <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, ...cifraSx }}>
        {desde.toLocaleString("es-CL")}–{hasta.toLocaleString("es-CL")} de {total.toLocaleString("es-CL")}
      </Typography>
      {paginas > 1 && <Pagination count={paginas} page={pagina} onChange={(_, p) => onPagina(p)} color="primary" shape="rounded" size="small" />}
    </Box>
  );
}

export function FilasCargando({ filas = 10 }: { filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <Skeleton key={i} height={42} />
      ))}
    </>
  );
}

export function SinResultados({ buscando }: { buscando: boolean }) {
  return (
    <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>
      {buscando ? "Nada coincide con la búsqueda." : "Sin registros con estos filtros."}
    </Typography>
  );
}
