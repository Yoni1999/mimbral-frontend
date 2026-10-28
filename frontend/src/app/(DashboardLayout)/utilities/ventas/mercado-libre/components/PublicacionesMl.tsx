"use client";

import React from "react";
import { Box, Popover, Tooltip, Typography } from "@mui/material";
import { IconExternalLink } from "@tabler/icons-react";
import { tinta } from "../../components/estilo";
import { PublicacionMl } from "./comun";

/** Estado de una publicación de ML, con color fijo (siempre con texto). */
export const ESTADOS_PUBLICACION: Record<string, { texto: string; color: string; fondo: string }> = {
  active: { texto: "Activa", color: "#067647", fondo: "#ecfdf3" },
  paused: { texto: "Pausada", color: "#b54708", fondo: "#fffaeb" },
  under_review: { texto: "En revisión", color: "#175cd3", fondo: "#eff8ff" },
  inactive: { texto: "Inactiva", color: "#475569", fondo: "#f1f5f9" },
  closed: { texto: "Cerrada", color: "#b42318", fondo: "#fef3f2" },
};
export const estadoPublicacion = (estado: string | null) =>
  ESTADOS_PUBLICACION[estado ?? ""] ?? { texto: estado ?? "Sin estado", color: "#475569", fondo: "#f1f5f9" };

const LOGISTICA: Record<string, string> = { fulfillment: "Full", cross_docking: "Colecta", self_service: "Flex", drop_off: "Drop off", default: "Envío normal" };

export function ChipEstadoPublicacion({ estado }: { estado: string | null }) {
  const e = estadoPublicacion(estado);
  return (
    <Box component="span" sx={{ px: 0.8, py: 0.15, borderRadius: 999, bgcolor: e.fondo, color: e.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {e.texto}
    </Box>
  );
}

function Enlace({ p, conTexto = false }: { p: PublicacionMl; conTexto?: boolean }) {
  if (!p.url) return null;
  return (
    <Tooltip title={`Abrir ${p.itemId} en Mercado Libre`} placement="top" arrow>
      <Box
        component="a"
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: tinta.acento, fontSize: 11.5, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
      >
        {conTexto ? p.itemId : null}
        <IconExternalLink size={14} />
      </Box>
    </Tooltip>
  );
}

/**
 * Publicaciones de un SKU en la tabla: el estado de la primera (activas
 * primero) con su enlace, y "+N" para ver todas (catálogo, clásica,
 * variaciones) con su estado, tipo de envío y enlace.
 */
export default function PublicacionesMl({ publicaciones }: { publicaciones: PublicacionMl[] | null | undefined }) {
  const [ancla, setAncla] = React.useState<HTMLElement | null>(null);
  if (publicaciones == null) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  if (publicaciones.length === 0) return <Box component="span" sx={{ fontSize: 11.5, color: tinta.tenue }}>Sin publicación</Box>;
  const [primera, ...resto] = publicaciones;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, alignItems: "flex-start" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
        <ChipEstadoPublicacion estado={primera.estado} />
        <Enlace p={primera} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 10.5, color: tinta.tenue }}>
        <span>{primera.catalogo ? "Catálogo" : "Normal"}</span>
        {resto.length > 0 && (
          <Box
            component="button"
            type="button"
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              setAncla(e.currentTarget);
            }}
            sx={{ border: 0, p: 0, bgcolor: "transparent", fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, color: tinta.acento, cursor: "pointer" }}
          >
            +{resto.length} más
          </Box>
        )}
      </Box>

      <Popover
        open={!!ancla}
        anchorEl={ancla}
        onClose={() => setAncla(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{ sx: { p: 1.5, width: 380, maxWidth: "calc(100vw - 24px)", borderRadius: "12px", border: `1px solid ${tinta.borde}` } }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: tinta.primaria, mb: 1 }}>Publicaciones del producto</Typography>
        {publicaciones.map((p) => (
          <Box key={p.itemId} sx={{ py: 0.75, borderTop: `1px solid ${tinta.borde}`, "&:first-of-type": { borderTop: 0 } }}>
            <Typography noWrap title={p.titulo ?? ""} sx={{ fontSize: 12.5, fontWeight: 600, color: tinta.primaria }}>
              {p.titulo ?? p.itemId}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 0.4, fontSize: 11.5, color: tinta.secundaria }}>
              <ChipEstadoPublicacion estado={p.estado} />
              <span>{p.catalogo ? "Catálogo" : "Normal"}</span>
              {p.logistica && <span>· {LOGISTICA[p.logistica] ?? p.logistica}</span>}
              {p.principal && <span>· principal</span>}
              <Box sx={{ ml: "auto" }}>
                <Enlace p={p} conTexto />
              </Box>
            </Box>
          </Box>
        ))}
      </Popover>
    </Box>
  );
}
