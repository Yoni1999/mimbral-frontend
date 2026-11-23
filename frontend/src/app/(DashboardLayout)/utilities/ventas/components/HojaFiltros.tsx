"use client";
// Panel de filtros en celular: una hoja que sube desde abajo, del ancho de la
// pantalla, con los controles a ancho completo y un botón "Aplicar"/"Listo"
// siempre visible al pie. En escritorio cada vista sigue con su Popover: estas
// piezas solo se usan cuando `useEsCelular()` es true (o se ocultan desde sm).
import React from "react";
import { Box, Button, Drawer, IconButton, Typography } from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { ChipFiltro, tinta } from "./estilo";

/**
 * Hoja inferior de filtros. `onAplicar` es la acción del botón principal; si
 * no se pasa, el botón solo cierra (vistas que aplican cada cambio al
 * instante). `onLimpiar` agrega un botón secundario a la izquierda.
 */
export function HojaFiltros({
  abierta,
  onCerrar,
  titulo = "Filtros",
  descripcion,
  onAplicar,
  textoAplicar,
  onLimpiar,
  textoLimpiar = "Limpiar",
  children,
}: {
  abierta: boolean;
  onCerrar: () => void;
  titulo?: string;
  descripcion?: string;
  onAplicar?: () => void;
  textoAplicar?: string;
  onLimpiar?: () => void;
  textoLimpiar?: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer
      anchor="bottom"
      open={abierta}
      onClose={onCerrar}
      // Sobre la barra de navegación inferior (zIndex 1250), como un diálogo.
      sx={{ zIndex: (t) => t.zIndex.modal }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          maxHeight: "88dvh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Encabezado fijo: tirador, título y cerrar. */}
      <Box sx={{ px: 2, pt: 1, pb: 1.25, borderBottom: `1px solid ${tinta.borde}`, flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 999, bgcolor: "#e2e8f0", mx: "auto", mb: 1 }} />
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 800, color: tinta.primaria }}>{titulo}</Typography>
            {descripcion && <Typography sx={{ fontSize: 13, color: tinta.secundaria }}>{descripcion}</Typography>}
          </Box>
          <IconButton aria-label="Cerrar filtros" onClick={onCerrar} sx={{ width: 40, height: 40, mr: -0.75, color: tinta.secundaria }}>
            <IconX size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Cuerpo: se desliza si no cabe; controles a ancho completo y de 44 px. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          "& .MuiFormControl-root, & .MuiAutocomplete-root": { width: "100% !important", minWidth: "0 !important" },
          "& .MuiOutlinedInput-root": { minHeight: 44, height: "auto !important", fontSize: 15 },
          "& .MuiSelect-select": { py: "11px" },
        }}
      >
        {children}
      </Box>

      {/* Pie fijo: el botón principal siempre a la vista. */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          gap: 1,
          px: 2,
          pt: 1.25,
          pb: "calc(12px + env(safe-area-inset-bottom))",
          borderTop: `1px solid ${tinta.borde}`,
          bgcolor: "#fff",
        }}
      >
        {onLimpiar && (
          <Button
            onClick={onLimpiar}
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: "12px", height: 46, px: 2, fontWeight: 600, color: tinta.secundaria, borderColor: tinta.borde }}
          >
            {textoLimpiar}
          </Button>
        )}
        <Button
          onClick={onAplicar ?? onCerrar}
          variant="contained"
          disableElevation
          fullWidth
          sx={{ textTransform: "none", borderRadius: "12px", height: 46, fontWeight: 700, fontSize: 15 }}
        >
          {textoAplicar ?? (onAplicar ? "Aplicar" : "Listo")}
        </Button>
      </Box>
    </Drawer>
  );
}

/** Rótulo de un grupo de campos dentro de la hoja. */
export function EtiquetaHoja({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ fontSize: 13, fontWeight: 600, color: tinta.secundaria, mb: -0.75 }}>{children}</Typography>;
}

/**
 * Chips de los filtros activos que en celular quedan escondidos en la hoja
 * (canal, vendedor, temporada…): así se ve qué está filtrando sin abrirla.
 * Solo se muestran bajo 600 px.
 */
export function FiltrosActivosMovil({ activos }: { activos: { etiqueta: string; onQuitar: () => void }[] }) {
  if (activos.length === 0) return null;
  return (
    <Box sx={{ display: { xs: "flex", sm: "none" }, flexWrap: "wrap", gap: 0.75 }}>
      {activos.map((a) => (
        <ChipFiltro key={a.etiqueta} etiqueta={a.etiqueta} onQuitar={a.onQuitar} />
      ))}
    </Box>
  );
}

/**
 * Accesos rápidos de período en celular: en vez de una fila que se desliza
 * de lado sin que se note (el último quedaba cortado), las píldoras pasan a
 * dos líneas y crecen a un alto que se puede tocar. Se aplica al contenedor
 * de <RangosRapidos>; desde sm no cambia nada.
 */
export const pildorasMovilSx = {
  // Misma consulta que theme.breakpoints.down("sm").
  "@media (max-width: 599.95px)": {
    "& > [role='group']": { flexWrap: "wrap", overflowX: "visible" },
    "& > [role='group'] > button": { minHeight: 34, px: 1.5, fontSize: 13 },
  },
} as const;
