"use client";
// Rail de escritorio, con la misma forma que el de FrontOms
// (components/layout/sidebar.tsx de FrontOmsMimbral): columna fija de 84 px,
// cada módulo es su ícono con el nombre corto DEBAJO, y el submenú se abre
// como panel al costado al pulsarlo. El panel se cierra al sacar el mouse del
// menú (rail + panel), con Esc o al navegar.
//
// Mismos colores que FrontOms (píldora azul suave para el activo, gris para el
// resto) con algo más de carácter: la barra azul del activo, el ícono que se
// levanta al pasar el mouse y el panel con el ícono y la descripción del módulo.
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Typography, keyframes } from "@mui/material";
import SidebarUserMenu from "./SidebarUserMenu";
import { MODULOS, Modulo, Pagina, esRutaActiva, moduloActivo } from "./MenuItems";
import Desplegable from "./Desplegable";

export const ANCHO_RAIL = 84;
const ANCHO_PANEL = 248;

const AZUL = "#1d4ed8";
const AZUL_SUAVE = "#eff6ff";
const GRIS_TEXTO = "#374151";
const GRIS_SUAVE = "#f3f4f6";
const BORDE = "#e5e7eb";

const entrarPanel = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
`;

/** Estilo de una fila del panel (página o cabecera de desplegable). */
const filaRailSx = (activa: boolean, hijo: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  px: hijo ? 1.5 : 2,
  py: hijo ? "7px" : "9px",
  fontSize: hijo ? 13.5 : 14,
  textDecoration: "none",
  color: activa ? AZUL : "#1f2937",
  fontWeight: activa ? 600 : 400,
  bgcolor: activa ? "rgba(239, 246, 255, 0.7)" : "transparent",
  borderLeft: `3px solid ${activa ? "#3b82f6" : "transparent"}`,
  transition: "background-color 150ms",
  "&:hover": { bgcolor: activa ? "rgba(239, 246, 255, 0.9)" : GRIS_SUAVE },
  "&:hover .pagina-icono": { color: AZUL },
  "&:focus-visible": { outline: `2px solid ${AZUL}`, outlineOffset: -2 },
});

/** Una página del panel como enlace. */
function filaRail(p: Pagina, path: string, hijo: boolean) {
  const Icono = p.icon;
  const pActiva = esRutaActiva(p.href, path);
  return (
    <Box component={Link} href={p.href} aria-current={pActiva ? "page" : undefined} sx={filaRailSx(pActiva, hijo)}>
      <Box component="span" className="pagina-icono" sx={{ display: "flex", color: pActiva ? AZUL : "#9ca3af", transition: "color 150ms" }}>
        <Icono size={hijo ? 16 : 17} stroke={1.7} />
      </Box>
      {p.titulo}
    </Box>
  );
}

export default function RailSidebar() {
  const path = usePathname() ?? "";
  const activo = moduloActivo(path);
  const [abierto, setAbierto] = useState<Modulo | null>(null);
  const railRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Al navegar se cierra el panel.
  useEffect(() => setAbierto(null), [path]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  /** Pasar del rail al panel (o al revés) no lo cierra; salir de los dos, sí. */
  const alSalir = (e: React.MouseEvent) => {
    const hacia = e.relatedTarget as Node | null;
    if (hacia instanceof Node && (railRef.current?.contains(hacia) || panelRef.current?.contains(hacia))) return;
    setAbierto(null);
  };

  const estiloItem = (esActivo: boolean, esAbierto: boolean) => ({
    position: "relative" as const,
    width: ANCHO_RAIL - 6,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
    py: "7px",
    borderRadius: "12px",
    border: 0,
    cursor: "pointer",
    textDecoration: "none",
    font: "inherit",
    color: esActivo ? AZUL : esAbierto ? "#1f2937" : GRIS_TEXTO,
    bgcolor: esActivo ? AZUL_SUAVE : esAbierto ? GRIS_SUAVE : "transparent",
    transition: "background-color 200ms, color 200ms",
    "&:hover": { bgcolor: esActivo ? AZUL_SUAVE : GRIS_SUAVE },
    "&:active": { bgcolor: esActivo ? "#dbeafe" : "#e5e7eb" },
    "&:focus-visible": { outline: `2px solid ${AZUL}`, outlineOffset: 0 },
    "& .rail-icono": { display: "flex", transition: "transform 200ms cubic-bezier(.34,1.56,.64,1)" },
    "&:hover .rail-icono": { transform: "translateY(-2px) scale(1.08)" },
    // Barra azul del módulo activo, pegada al borde izquierdo del rail.
    "&::before": {
      content: '""',
      position: "absolute",
      left: -3,
      top: "22%",
      bottom: "22%",
      width: 3,
      borderRadius: "0 3px 3px 0",
      bgcolor: AZUL,
      opacity: esActivo ? 1 : 0,
      transition: "opacity 200ms",
    },
  });

  const rotulo = (texto: string) => (
    <Box
      component="span"
      sx={{ width: "100%", textAlign: "center", fontSize: "10.5px", fontWeight: 500, lineHeight: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
    >
      {texto}
    </Box>
  );

  return (
    <Box sx={{ width: ANCHO_RAIL, flexShrink: 0 }}>
      <Box
        component="nav"
        ref={railRef}
        aria-label="Menú principal"
        onMouseLeave={alSalir}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1200,
          height: "100vh",
          width: ANCHO_RAIL,
          bgcolor: "#fff",
          borderRight: `1px solid ${BORDE}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", p: 2, borderBottom: `1px solid ${GRIS_SUAVE}`, flexShrink: 0 }}>
          {/* Como en FrontOms: la «M» azul, acceso al inicio (el logo de Mimbral no se lee a este ancho). */}
          <Box
            component={Link}
            href="/inicio"
            aria-label="Inicio · Análisis 360"
            sx={{
              width: 36,
              height: 36,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              textDecoration: "none",
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
              boxShadow: "0 4px 10px -4px rgba(37, 99, 235, 0.6)",
              transition: "transform 200ms, box-shadow 200ms",
              "&:hover": { transform: "rotate(-6deg) scale(1.05)", boxShadow: "0 6px 14px -4px rgba(37, 99, 235, 0.7)" },
              "&:focus-visible": { outline: `2px solid ${AZUL}`, outlineOffset: 2 },
            }}
          >
            <span aria-hidden="true">M</span>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            py: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            "&::-webkit-scrollbar": { width: 0 },
          }}
        >
          {MODULOS.map((m) => {
            const Icono = m.icon;
            const esActivo = activo?.id === m.id;
            const esAbierto = abierto?.id === m.id;
            const contenido = (
              <>
                <span className="rail-icono">
                  <Icono size={21} stroke={esActivo ? 2 : 1.6} />
                </span>
                {rotulo(m.titulo)}
              </>
            );
            return m.href ? (
              <Box key={m.id} component={Link} href={m.href} aria-current={esActivo ? "page" : undefined} sx={estiloItem(esActivo, false)}>
                {contenido}
              </Box>
            ) : (
              <Box
                key={m.id}
                component="button"
                type="button"
                aria-expanded={esAbierto}
                aria-haspopup="true"
                onClick={() => setAbierto(esAbierto ? null : m)}
                sx={estiloItem(esActivo, esAbierto)}
              >
                {contenido}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flexShrink: 0, borderTop: `1px solid ${GRIS_SUAVE}`, display: "flex", justifyContent: "center" }}>
          <SidebarUserMenu collapsed />
        </Box>
      </Box>

      {abierto && (
        <Box
          component="nav"
          ref={panelRef}
          aria-label={`Submenú de ${abierto.titulo}`}
          onMouseLeave={alSalir}
          sx={{
            position: "fixed",
            top: 0,
            left: ANCHO_RAIL,
            zIndex: 1190,
            height: "100vh",
            width: ANCHO_PANEL,
            overflowY: "auto",
            bgcolor: "#f9fafb",
            borderRight: `1px solid ${BORDE}`,
            boxShadow: "6px 0 18px -10px rgba(15, 23, 42, 0.25)",
            animation: `${entrarPanel} 160ms ease-out`,
          }}
        >
          <Box sx={{ p: 2, bgcolor: "#fff", borderBottom: `1px solid ${BORDE}`, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: AZUL,
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              }}
            >
              <abierto.icon size={20} stroke={1.8} />
            </Box>
            <Box minWidth={0}>
              <Typography sx={{ fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{abierto.titulo}</Typography>
              {abierto.descripcion && (
                <Typography sx={{ fontSize: 12, color: "#6b7280", lineHeight: 1.35, mt: "2px" }}>{abierto.descripcion}</Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ py: 1 }}>
            {(abierto.grupos ?? []).map((g) => (
              <Box key={g.titulo || "paginas"} sx={{ mb: 0.5 }}>
                {g.titulo && (
                  <Typography sx={{ px: 2, pt: 1.25, pb: 0.5, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>
                    {g.titulo}
                  </Typography>
                )}
                {g.paginas.map((p) =>
                  p.hijos ? (
                    <Desplegable key={p.href} pagina={p} path={path} sxCabecera={(a) => filaRailSx(a, false)} renderHijo={(h) => filaRail(h, path, true)} />
                  ) : (
                    <React.Fragment key={p.href}>{filaRail(p, path, false)}</React.Fragment>
                  )
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
