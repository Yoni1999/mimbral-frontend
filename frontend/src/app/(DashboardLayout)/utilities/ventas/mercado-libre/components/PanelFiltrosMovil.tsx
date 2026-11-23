"use client";
// Filtros en celular para las vistas de Mercado Libre y Falabella: en vez de
// tres o cuatro filas de píldoras arriba de la vista, un botón «Filtros» que
// abre un panel desde abajo, y los filtros que no están en su valor de siempre
// quedan a la vista como chips con su ×. Solo se usa debajo de 600 px; en
// escritorio las vistas siguen con sus píldoras de siempre.
import React from "react";
import { Box, Button, Drawer, IconButton, Typography } from "@mui/material";
import { IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";
import { ChipFiltro, tinta } from "../../components/estilo";
import { useEsCelular } from "../../components/movil";
import { BotonFiltrosBarra } from "../../components/PeriodoMovil";

export interface FiltroActivo {
  etiqueta: string;
  onQuitar: () => void;
}

/** Píldoras más altas (dedo, no cursor) y, con `rotular`, el nombre de cada
 *  grupo (su aria-label) escrito encima. */
const cuerpoSx = (rotular: boolean) =>
  ({
    display: "flex",
    flexDirection: "column",
    gap: 2,
    "& button[aria-pressed]": { minHeight: 36, px: 1.5, fontSize: 13 },
    "& [role='group']": { gap: 1 },
    // Envoltorios de la vista que ponían los grupos uno al lado del otro: acá, uno bajo otro.
    "& > :not([role='group'])": { flexDirection: "column", gap: 2 },
    ...(rotular
      ? {
          // Solo grupos sin etiqueta propia (un <p> justo antes).
          "& [role='group'][aria-label]:not(p + [role='group'])::before": {
            content: "attr(aria-label)",
            display: "block",
            width: "100%",
            fontSize: 12,
            fontWeight: 600,
            color: tinta.secundaria,
          },
        }
      : {}),
  }) as const;

/** Botón «Filtros» (con cuántos hay activos) y su panel desde abajo. Los
 *  cambios se aplican al tocar cada opción, como en escritorio; «Ver
 *  resultados» cierra el panel. */
export function BotonFiltrosMovil({
  activos = [],
  rotularGrupos = true,
  soloIcono = false,
  children,
}: {
  activos?: FiltroActivo[];
  /** Escribe el nombre de cada grupo de píldoras sin etiqueta propia sobre él. */
  rotularGrupos?: boolean;
  /** Botón cuadrado de la barra de período (PeriodoMovil): ícono con punto azul si hay filtros puestos. */
  soloIcono?: boolean;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = React.useState(false);
  const cerrar = () => setAbierto(false);
  return (
    <>
      {soloIcono ? (
        <BotonFiltrosBarra activos={activos.length > 0} onClick={() => setAbierto(true)} />
      ) : (
      <Button
        variant="outlined"
        onClick={() => setAbierto(true)}
        startIcon={<IconAdjustmentsHorizontal size={17} />}
        sx={{
          height: 36,
          px: 1.5,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: 13.5,
          whiteSpace: "nowrap",
          borderColor: activos.length ? tinta.acento : tinta.borde,
          color: activos.length ? tinta.acento : tinta.primaria,
          bgcolor: activos.length ? "#eff4ff" : "#fff",
        }}
      >
        Filtros{activos.length ? ` · ${activos.length}` : ""}
      </Button>
      )}
      <Drawer
        anchor="bottom"
        open={abierto}
        onClose={cerrar}
        // Sobre la barra de navegación inferior del celular.
        sx={{ zIndex: 1500 }}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "85vh", display: "flex", flexDirection: "column" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 1.5, pb: 1, borderBottom: `1px solid ${tinta.borde}` }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria }}>Filtros</Typography>
          <IconButton aria-label="Cerrar" onClick={cerrar} sx={{ width: 40, height: 40 }}>
            <IconX size={20} />
          </IconButton>
        </Box>
        <Box sx={{ ...cuerpoSx(rotularGrupos), px: 2, py: 2, overflowY: "auto", flex: 1 }}>{children}</Box>
        <Box sx={{ display: "flex", gap: 1, px: 2, pt: 1.25, pb: "calc(12px + env(safe-area-inset-bottom))", borderTop: `1px solid ${tinta.borde}` }}>
          {/* Quita solo los filtros del panel; el período queda como está. */}
          {activos.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => activos.forEach((a) => a.onQuitar())}
              sx={{ height: 44, flex: 1, borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: tinta.borde, color: tinta.primaria }}
            >
              Limpiar
            </Button>
          )}
          <Button variant="contained" disableElevation onClick={cerrar} sx={{ height: 44, flex: 2, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
            Ver resultados
          </Button>
        </Box>
      </Drawer>
    </>
  );
}

/** Chips de los filtros activos, bajo la barra (solo si hay alguno). */
export function ChipsFiltrosActivos({ activos }: { activos: FiltroActivo[] }) {
  if (activos.length === 0) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, "& button": { minWidth: 28, minHeight: 28 } }}>
      {activos.map((a) => (
        <ChipFiltro key={a.etiqueta} etiqueta={a.etiqueta} onQuitar={a.onQuitar} />
      ))}
    </Box>
  );
}

/** Fila que se desliza de lado con un degradado en el borde que aún tiene
 *  contenido escondido, para que se note que sigue (accesos rápidos de período). */
export function FilaDeslizable({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = React.useState({ izq: false, der: false });
  const medir = React.useCallback(() => {
    // El contenedor que se desliza es el primer hijo con scroll horizontal.
    const el = ref.current?.querySelector<HTMLElement>("[role='group']") ?? ref.current;
    if (!el) return;
    const izq = el.scrollLeft > 2;
    const der = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setBordes((b) => (b.izq === izq && b.der === der ? b : { izq, der }));
  }, []);
  React.useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir]);
  // La opción marcada siempre a la vista ("30 días" queda al final de la fila):
  // al cambiar cuál está marcada, la fila se corre hasta ella.
  const marcadaAntes = React.useRef<string | null>(null);
  React.useEffect(() => {
    const fila = ref.current?.querySelector<HTMLElement>("[role='group']");
    const marcada = fila?.querySelector<HTMLElement>("[aria-pressed='true']");
    const texto = marcada?.textContent ?? "";
    if (!fila || !marcada || texto === marcadaAntes.current) return;
    marcadaAntes.current = texto;
    const izq = marcada.offsetLeft - fila.offsetLeft;
    const der = izq + marcada.offsetWidth;
    if (izq < fila.scrollLeft) fila.scrollLeft = Math.max(0, izq - 24);
    else if (der > fila.scrollLeft + fila.clientWidth) fila.scrollLeft = der - fila.clientWidth + 24;
    medir();
  });
  const mascara = `linear-gradient(to right, ${bordes.izq ? "transparent 0, #000 28px" : "#000 0"}, ${bordes.der ? "#000 calc(100% - 36px), transparent 100%" : "#000 100%"})`;
  return (
    <Box
      ref={ref}
      onScrollCapture={medir}
      sx={{
        minWidth: 0,
        WebkitMaskImage: mascara,
        maskImage: mascara,
        // Una sola línea que se desliza, con píldoras a tamaño de dedo.
        "& > [role='group']": { display: "flex", flexWrap: "nowrap", overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, "& > *": { flexShrink: 0 } },
        "& button[aria-pressed]": { minHeight: 34, px: 1.5, fontSize: 13 },
      }}
    >
      {children}
    </Box>
  );
}

/** Filtros de una vista: en escritorio se muestran tal cual (mismo lugar y
 *  forma); en celular quedan dentro del botón «Filtros», con los activos como
 *  chips debajo. */
export function FiltrosAdaptables({ activos = [], children }: { activos?: FiltroActivo[]; children: React.ReactNode }) {
  const esCelular = useEsCelular();
  if (!esCelular) return <>{children}</>;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, width: "100%" }}>
      <BotonFiltrosMovil activos={activos}>{children}</BotonFiltrosMovil>
      <ChipsFiltrosActivos activos={activos} />
    </Box>
  );
}
