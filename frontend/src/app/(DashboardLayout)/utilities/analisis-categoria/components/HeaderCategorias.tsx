"use client";

import React from "react";
import { Box, Button, FormControl, MenuItem, Popover, Select, Stack, Typography } from "@mui/material";
import { IconAdjustmentsHorizontal, IconChevronRight } from "@tabler/icons-react";
import DateRangeFilter, { DateRangeValue } from "@/app/(DashboardLayout)/utilities/ventas/components/DateRangeFilter";
import RangosRapidos, { TEMPORADAS, etiquetaRango, rangoInicial } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import FrescuraDatos from "@/app/(DashboardLayout)/utilities/ventas/components/FrescuraDatos";
import {
  BotonLimpiar,
  ChipFiltro,
  controlSx,
  etiquetaControlSx,
  tarjetaSx,
  tinta,
  filaControlesSx,
} from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { Arbol, Paso } from "../niveles";
import SelectorCategoria from "./SelectorCategoria";

export interface FiltrosCategorias {
  /** Árbol por el que se mira: categorías o familias. */
  arbol: Arbol;
  fechaInicio: string;
  fechaFin: string;
  temporada: string;
  ruta: Paso[];
}

/** Una opción del buscador: cualquier nivel del árbol. */
export interface OpcionCategoria extends Paso {
  /** Nivel superior, para distinguir nombres repetidos. */
  padre?: string;
  /** Código del nivel superior (subfamilias: su familia). */
  padreCodigo?: string;
  imagen?: string;
}

interface Props {
  filtros: FiltrosCategorias;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosCategorias>>;
  opciones: OpcionCategoria[];
  cargandoOpciones: boolean;
  familias: OpcionCategoria[];
  cargandoFamilias: boolean;
}

/** Barra de filtros de Análisis por categoría: dónde estás en el árbol (con
 *  migas para subir), buscador para saltar a cualquier nivel, período y
 *  temporada. Cada cambio se aplica al instante. */
const HeaderCategorias: React.FC<Props> = ({ filtros, setFiltros, opciones, cargandoOpciones, familias, cargandoFamilias }) => {
  const [filtrosAnchor, setFiltrosAnchor] = React.useState<HTMLElement | null>(null);
  const { ruta } = filtros;
  const actual = ruta[ruta.length - 1];
  const rango = filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin);

  const cambiar = (cambios: Partial<FiltrosCategorias>) => setFiltros((prev) => ({ ...prev, ...cambios }));
  const irA = (indice: number) => cambiar({ ruta: ruta.slice(0, indice) });

  const handleDateChange = (range: DateRangeValue | null) =>
    cambiar({ temporada: "", ...(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoInicial()) });

  const elegirTemporada = (temporada: string) => {
    const fechas = TEMPORADAS[temporada];
    cambiar(fechas ? { temporada, fechaInicio: fechas.inicio, fechaFin: fechas.fin } : { temporada: "", ...rangoInicial() });
    setFiltrosAnchor(null);
  };

  const limpiar = () => setFiltros({ arbol: "categorias", temporada: "", ruta: [], ...rangoInicial() });
  const enEstadoInicial = filtros.arbol === "categorias" && ruta.length === 0 && !filtros.temporada && rango === "Ayer";
  const raiz = filtros.arbol === "familias" ? "Todas las familias" : "Todas las categorías";

  const miga = (texto: string, indice: number, activa: boolean) => (
    <Box
      component={activa ? "span" : "button"}
      type={activa ? undefined : "button"}
      onClick={activa ? undefined : () => irA(indice)}
      sx={{
        border: 0,
        p: 0,
        bgcolor: "transparent",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: activa ? 700 : 500,
        color: activa ? tinta.primaria : tinta.acento,
        cursor: activa ? "default" : "pointer",
        whiteSpace: "nowrap",
        "&:hover": activa ? undefined : { textDecoration: "underline" },
      }}
    >
      {texto}
    </Box>
  );

  return (
    <Box sx={{ ...tarjetaSx, position: "relative", mb: 2, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      <FrescuraDatos />
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1.25} alignItems={{ xs: "stretch", xl: "center" }}>
        <Box sx={{ minWidth: 200, maxWidth: { xl: 340 }, flexShrink: 0 }}>
          <Typography noWrap sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {actual ? actual.nombre : raiz}
          </Typography>
          {/* Migas: cada nivel de la ruta se puede pulsar para volver a él. */}
          <Box component="nav" aria-label="Nivel" sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap", minWidth: 0 }}>
            {miga(raiz, 0, ruta.length === 0)}
            {ruta.map((p, i) => (
              <React.Fragment key={`${p.nivel}-${p.codigo}`}>
                <IconChevronRight size={12} color={tinta.tenue} />
                {miga(p.nombre || p.codigo, i + 1, i === ruta.length - 1)}
              </React.Fragment>
            ))}
            <Typography component="span" sx={{ fontSize: 11.5, color: tinta.secundaria, ml: 0.5 }}>
              · <strong style={{ color: tinta.primaria }}>{rango}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <RangosRapidos
            fechaInicio={filtros.fechaInicio}
            fechaFin={filtros.fechaFin}
            inactivo={!!filtros.temporada}
            onElegir={(fechaInicio, fechaFin) => cambiar({ temporada: "", fechaInicio, fechaFin })}
          >
            {filtros.temporada && <ChipFiltro etiqueta={`Temporada: ${filtros.temporada}`} onQuitar={() => elegirTemporada("")} />}
          </RangosRapidos>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={filaControlesSx}>
          <SelectorCategoria
            arbol={filtros.arbol}
            ruta={ruta}
            catalogos={{ categorias: opciones, familias }}
            cargando={{ categorias: cargandoOpciones, familias: cargandoFamilias }}
            onElegir={(arbol, nueva) => cambiar({ arbol, ruta: nueva })}
          />

          <DateRangeFilter
            value={filtros.fechaInicio && filtros.fechaFin ? { start: filtros.fechaInicio, end: filtros.fechaFin } : null}
            onChange={handleDateChange}
            label="Rango de fecha"
            soloIcono
          />

          <Button
            variant="outlined"
            startIcon={<IconAdjustmentsHorizontal size={16} />}
            onClick={(e) => setFiltrosAnchor(e.currentTarget)}
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              height: 34,
              px: 1.5,
              whiteSpace: "nowrap",
              borderColor: filtros.temporada ? tinta.acento : tinta.borde,
              color: filtros.temporada ? tinta.acento : tinta.primaria,
              fontWeight: 600,
              fontSize: 13,
              "&:hover": { borderColor: "#cbd5e1", bgcolor: tinta.fondoSuave },
            }}
          >
            <span className="boton-texto">Filtros</span>
          </Button>

          <BotonLimpiar onClick={limpiar} disabled={enEstadoInicial} />
        </Stack>
      </Stack>

      <Popover
        open={!!filtrosAnchor}
        anchorEl={filtrosAnchor}
        onClose={() => setFiltrosAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2.5,
            width: 320,
            borderRadius: "14px",
            border: `1px solid ${tinta.borde}`,
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)",
          },
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tinta.primaria }}>Filtros</Typography>
        <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, mb: 2 }}>Una temporada fija el período de la vista.</Typography>
        <Typography sx={etiquetaControlSx}>Temporada</Typography>
        <FormControl fullWidth size="small">
          <Select
            value={filtros.temporada}
            displayEmpty
            inputProps={{ "aria-label": "Temporada" }}
            onChange={(e) => elegirTemporada(e.target.value)}
            sx={controlSx}
          >
            <MenuItem value="">Sin temporada</MenuItem>
            {Object.keys(TEMPORADAS).map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Popover>
    </Box>
  );
};

export default HeaderCategorias;
