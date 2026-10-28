"use client";
// Navegación de celular (< 600 px), con la misma forma que la de FrontOms
// (components/layout/mobile-bottom-nav.tsx de FrontOmsMimbral): una barra fija
// abajo, global, que no cambia con el módulo en el que estés:
//
//     Inicio | Módulos | Agente | Más
//
// «Módulos» abre la lista de módulos a pantalla completa: cada fila es su
// ícono y su nombre, y lo único que se pinta —una píldora azul suave— es dónde
// estás. Un módulo con submenú abre su propio panel (con «‹ Módulos» para
// volver), igual que el panel al costado del rail en escritorio. «Agente» abre
// el asistente a pantalla completa. «Más» es lo de la persona: perfil y sesión.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { IconHome2, IconLayoutGrid, IconSparkles, IconMenu2, IconChevronRight, IconChevronLeft, IconUserCircle } from "@tabler/icons-react";
import SidebarUserMenu from "./SidebarUserMenu";
import { MODULOS, Modulo, esRutaActiva, moduloActivo } from "./MenuItems";
import Desplegable from "./Desplegable";

const AZUL = "#1d4ed8";
const AZUL_SUAVE = "#eff6ff";
const BORDE = "#e5e7eb";
export const ALTO_BARRA = 64;

type Hoja = "modulos" | "mas" | null;

const filaSx = (activa: boolean) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  minHeight: 56,
  width: "100%",
  px: 2,
  borderRadius: "16px",
  border: 0,
  font: "inherit",
  fontSize: 16,
  textAlign: "left" as const,
  textDecoration: "none",
  cursor: "pointer",
  color: activa ? AZUL : "#111827",
  fontWeight: activa ? 600 : 500,
  bgcolor: activa ? AZUL_SUAVE : "transparent",
  "&:active": { bgcolor: activa ? "#dbeafe" : "#f3f4f6" },
});

const iconoFila = (activa: boolean) => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: activa ? AZUL : "#4b5563",
  bgcolor: activa ? "#dbeafe" : "#f3f4f6",
});

export default function MobileBottomNav() {
  const path = usePathname() ?? "";
  const activo = moduloActivo(path);
  const [hoja, setHoja] = useState<Hoja>(null);
  const [modulo, setModulo] = useState<Modulo | null>(null);

  // Al navegar se cierra la hoja abierta.
  useEffect(() => {
    setHoja(null);
    setModulo(null);
  }, [path]);

  const abrir = (h: Hoja) => {
    setModulo(null);
    setHoja((actual) => (actual === h ? null : h));
  };

  const tab = (activa: boolean) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    border: 0,
    bgcolor: "transparent",
    font: "inherit",
    fontSize: 11,
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
    color: activa ? AZUL : "#6b7280",
  });

  return (
    <Box sx={{ display: { xs: "block", sm: "none" } }}>
      {hoja && (
        <Box
          role="dialog"
          aria-label={hoja === "modulos" ? "Módulos" : "Más"}
          sx={{
            position: "fixed",
            inset: 0,
            bottom: `calc(${ALTO_BARRA}px + env(safe-area-inset-bottom, 0px))`,
            zIndex: 1250,
            bgcolor: "#fff",
            overflowY: "auto",
            overscrollBehavior: "contain",
            px: 1.5,
            pt: "max(16px, env(safe-area-inset-top))",
            pb: 2,
          }}
        >
          {hoja === "modulos" && !modulo && (
            <>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", px: 1, mb: 1.5 }}>Módulos</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {MODULOS.map((m) => {
                  const Icono = m.icon;
                  const esActivo = activo?.id === m.id;
                  const contenido = (
                    <>
                      <Box sx={iconoFila(esActivo)}>
                        <Icono size={20} stroke={1.8} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>{m.titulo}</Box>
                      {m.grupos && <IconChevronRight size={18} color="#9ca3af" />}
                    </>
                  );
                  return m.href ? (
                    <Box key={m.id} component={Link} href={m.href} aria-current={esActivo ? "page" : undefined} sx={filaSx(esActivo)}>
                      {contenido}
                    </Box>
                  ) : (
                    <Box key={m.id} component="button" type="button" onClick={() => setModulo(m)} sx={filaSx(esActivo)}>
                      {contenido}
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {hoja === "modulos" && modulo && (
            <>
              <Box
                component="button"
                type="button"
                onClick={() => setModulo(null)}
                sx={{ display: "flex", alignItems: "center", gap: 0.5, border: 0, bgcolor: "transparent", color: AZUL, font: "inherit", fontSize: 15, fontWeight: 600, px: 1, py: 0.5, mb: 1, cursor: "pointer" }}
              >
                <IconChevronLeft size={18} /> Módulos
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", px: 1, mb: 1.5 }}>
                <Box sx={{ ...iconoFila(true), background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
                  <modulo.icon size={20} stroke={1.8} />
                </Box>
                <Box minWidth={0}>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{modulo.titulo}</Typography>
                  {modulo.descripcion && <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.25 }}>{modulo.descripcion}</Typography>}
                </Box>
              </Box>
              {(modulo.grupos ?? []).map((g) => (
                <Box key={g.titulo || "paginas"} sx={{ mb: 1 }}>
                  {g.titulo && (
                    <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af" }}>
                      {g.titulo}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {g.paginas.map((p) => {
                      const Icono = p.icon;
                      const pActiva = esRutaActiva(p.href, path);
                      if (p.hijos)
                        return (
                          <Desplegable
                            key={p.href}
                            pagina={p}
                            path={path}
                            tamanoIcono={20}
                            sxCabecera={(a) => filaSx(a)}
                            renderHijo={(h) => {
                              const IconoHijo = h.icon;
                              const hActiva = esRutaActiva(h.href, path);
                              return (
                                <Box component={Link} href={h.href} aria-current={hActiva ? "page" : undefined} sx={{ ...filaSx(hActiva), my: 0.25 }}>
                                  <Box sx={{ display: "flex", color: hActiva ? AZUL : "#9ca3af" }}>
                                    <IconoHijo size={18} stroke={1.7} />
                                  </Box>
                                  {h.titulo}
                                </Box>
                              );
                            }}
                          />
                        );
                      return (
                        <Box key={p.href} component={Link} href={p.href} aria-current={pActiva ? "page" : undefined} sx={filaSx(pActiva)}>
                          <Box sx={{ display: "flex", color: pActiva ? AZUL : "#9ca3af" }}>
                            <Icono size={20} stroke={1.7} />
                          </Box>
                          {p.titulo}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </>
          )}

          {hoja === "mas" && (
            <>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", px: 1, mb: 1 }}>Más</Typography>
              <SidebarUserMenu
                collapsed={false}
                enLista
                extra={
                  <Box component={Link} href="/perfil" sx={{ ...filaSx(esRutaActiva("/perfil", path)), my: 0.5 }}>
                    <Box sx={iconoFila(esRutaActiva("/perfil", path))}>
                      <IconUserCircle size={20} stroke={1.8} />
                    </Box>
                    Mi perfil
                  </Box>
                }
              />
            </>
          )}
        </Box>
      )}

      <Box
        component="nav"
        aria-label="Navegación principal"
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1260,
          height: `calc(${ALTO_BARRA}px + env(safe-area-inset-bottom, 0px))`,
          pb: "env(safe-area-inset-bottom, 0px)",
          bgcolor: "#fff",
          borderTop: `1px solid ${BORDE}`,
          display: "flex",
        }}
      >
        <Box component={Link} href="/inicio" sx={tab(!hoja && path.startsWith("/inicio"))}>
          <IconHome2 size={24} stroke={1.7} />
          Inicio
        </Box>
        <Box component="button" type="button" aria-expanded={hoja === "modulos"} onClick={() => abrir("modulos")} sx={tab(hoja === "modulos")}>
          <IconLayoutGrid size={24} stroke={1.7} />
          Módulos
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => {
            setHoja(null);
            window.dispatchEvent(new Event("agente:alternar"));
          }}
          sx={tab(false)}
        >
          <Box sx={{ width: 24, height: 24, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}>
            <IconSparkles size={16} />
          </Box>
          Agente
        </Box>
        <Box component="button" type="button" aria-expanded={hoja === "mas"} onClick={() => abrir("mas")} sx={tab(hoja === "mas")}>
          <IconMenu2 size={24} stroke={1.7} />
          Más
        </Box>
      </Box>
    </Box>
  );
}
