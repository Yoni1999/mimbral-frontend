"use client";

import React from "react";
import { Box, Button, FormControl, MenuItem, Popover, Select, Stack, Typography } from "@mui/material";
import { IconDownload, IconListDetails } from "@tabler/icons-react";
import DateRangeFilter, { DateRangeValue } from "@/app/(DashboardLayout)/utilities/ventas/components/DateRangeFilter";
import RangosRapidos, { TEMPORADAS, etiquetaRango, FechasDelRango } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import FrescuraDatos from "@/app/(DashboardLayout)/utilities/ventas/components/FrescuraDatos";
import {
  BotonLimpiar,
  CANALES,
  ChipFiltro,
  controlSx,
  etiquetaControlSx,
  tarjetaSx,
  tinta,
  filaControlesSx,
  IconoFiltros,
  SoloMovil,
} from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

export interface FiltrosGrupo {
  skus: string[];
  canal: string;
  fechaInicio: string;
  fechaFin: string;
  temporada: string;
  /** "" = período anterior (por defecto). */
  modoComparacion: "" | "MismoPeriodoAnoAnterior";
}

interface Props {
  filtros: FiltrosGrupo;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosGrupo>>;
  rangoPorDefecto: () => { fechaInicio: string; fechaFin: string };
  onEditarSkus: () => void;
  onDescargar?: () => void;
  descargando?: boolean;
}

const botonSx = {
  textTransform: "none",
  borderRadius: "10px",
  height: 34,
  px: 1.5,
  whiteSpace: "nowrap",
  fontWeight: 600,
  fontSize: 13,
} as const;

/** Barra de filtros del grupo de SKUs: los mismos controles que Análisis de
 *  producto (períodos rápidos, canal, fecha, temporada y comparación), con
 *  el botón de la lista de SKUs en lugar del buscador de un producto. */
const HeaderGrupo: React.FC<Props> = ({ filtros, setFiltros, rangoPorDefecto, onEditarSkus, onDescargar, descargando }) => {
  const [filtrosAnchor, setFiltrosAnchor] = React.useState<HTMLElement | null>(null);
  const rango = filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin);
  const canal = CANALES.find((c) => c.clave === filtros.canal);
  const cambiar = (cambios: Partial<FiltrosGrupo>) => setFiltros((prev) => ({ ...prev, ...cambios }));

  const handleDateChange = (range: DateRangeValue | null) =>
    cambiar({ temporada: "", ...(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoPorDefecto()) });

  const elegirTemporada = (temporada: string) => {
    const fechas = TEMPORADAS[temporada];
    cambiar(fechas ? { temporada, fechaInicio: fechas.inicio, fechaFin: fechas.fin } : { temporada: "", ...rangoPorDefecto() });
  };

  // Limpiar deja los SKUs: lo que se limpia son los filtros sobre ellos.
  const porDefecto = rangoPorDefecto();
  const limpiar = () => setFiltros((f) => ({ ...f, canal: "", temporada: "", modoComparacion: "", ...rangoPorDefecto() }));
  const enEstadoInicial =
    !filtros.canal && !filtros.temporada && !filtros.modoComparacion && filtros.fechaInicio === porDefecto.fechaInicio && filtros.fechaFin === porDefecto.fechaFin;
  const filtrosActivos = !!filtros.temporada || !!filtros.modoComparacion;

  const selectores = (
    <>
      <Button
        variant="outlined"
        startIcon={<IconListDetails size={16} />}
        onClick={onEditarSkus}
        sx={{ ...botonSx, borderColor: tinta.borde, color: tinta.primaria, "&:hover": { borderColor: "#cbd5e1", bgcolor: tinta.fondoSuave } }}
      >
        {filtros.skus.length ? `${filtros.skus.length} SKUs` : "Elegir SKUs"}
      </Button>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select value={filtros.canal} displayEmpty inputProps={{ "aria-label": "Canal" }} onChange={(e) => cambiar({ canal: e.target.value })} sx={controlSx}>
          <MenuItem value="">Todos los canales</MenuItem>
          {CANALES.map((c) => (
            <MenuItem key={c.clave} value={c.clave}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c.color, mr: 1, display: "inline-block" }} />
              {c.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <Box sx={{ ...tarjetaSx, position: "relative", mb: 2, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      <FrescuraDatos />
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1.25} alignItems={{ xs: "stretch", xl: "center" }}>
        <Box sx={{ minWidth: 200, maxWidth: { xl: 380 }, flexShrink: 0 }}>
          <Typography noWrap sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Grupo de SKUs
          </Typography>
          <Typography noWrap sx={{ fontSize: 11.5, color: tinta.secundaria }}>
            <strong style={{ color: tinta.primaria }}>{filtros.skus.length} SKUs</strong> ·{" "}
            <strong style={{ color: tinta.primaria }}>{canal ? canal.nombre : "Todos los canales"}</strong> ·{" "}
            <strong style={{ color: tinta.primaria }}>{rango}</strong>
            <FechasDelRango inicio={filtros.fechaInicio} fin={filtros.fechaFin} />
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <RangosRapidos
            fechaInicio={filtros.fechaInicio}
            fechaFin={filtros.fechaFin}
            inactivo={!!filtros.temporada}
            onElegir={(fechaInicio, fechaFin) => cambiar({ temporada: "", fechaInicio, fechaFin })}
          >
            {filtros.temporada && <ChipFiltro etiqueta={`Temporada: ${filtros.temporada}`} onQuitar={() => elegirTemporada("")} />}
            {filtros.modoComparacion && <ChipFiltro etiqueta="vs año anterior" onQuitar={() => cambiar({ modoComparacion: "" })} />}
          </RangosRapidos>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={filaControlesSx}>
          {selectores}

          <DateRangeFilter
            value={filtros.fechaInicio && filtros.fechaFin ? { start: filtros.fechaInicio, end: filtros.fechaFin } : null}
            onChange={handleDateChange}
            label="Rango de fecha"
            soloIcono
          />

          <Button
            variant="outlined"
            startIcon={<IconoFiltros activos={!!filtros.canal} />}
            onClick={(e) => setFiltrosAnchor(e.currentTarget)}
            sx={{
              ...botonSx,
              borderColor: filtrosActivos ? tinta.acento : tinta.borde,
              color: filtrosActivos ? tinta.acento : tinta.primaria,
              "&:hover": { borderColor: "#cbd5e1", bgcolor: tinta.fondoSuave },
            }}
          >
            <span className="boton-texto">Filtros</span>
          </Button>

          {onDescargar && (
            <Button
              variant="contained"
              disableElevation
              startIcon={<IconDownload size={16} />}
              onClick={onDescargar}
              disabled={descargando}
              sx={botonSx}
            >
              <span className="boton-texto">{descargando ? "Preparando…" : "Descargar Excel"}</span>
            </Button>
          )}

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
          sx: { mt: 1, p: 2.5, width: 320, borderRadius: "14px", border: `1px solid ${tinta.borde}`, boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)" },
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tinta.primaria }}>Filtros</Typography>
        <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, mb: 2 }}>Acotan todas las pestañas de la vista.</Typography>
        <Box sx={{ mb: 1.5 }}>
          <SoloMovil>{selectores}</SoloMovil>
        </Box>
        <Stack spacing={1.5}>
          <Box>
            <Typography sx={etiquetaControlSx}>Temporada</Typography>
            <FormControl fullWidth size="small">
              <Select value={filtros.temporada} displayEmpty onChange={(e) => elegirTemporada(e.target.value)} sx={controlSx}>
                <MenuItem value="">Sin temporada</MenuItem>
                {Object.keys(TEMPORADAS).map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography sx={etiquetaControlSx}>Comparar con</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filtros.modoComparacion}
                displayEmpty
                onChange={(e) => cambiar({ modoComparacion: e.target.value as FiltrosGrupo["modoComparacion"] })}
                sx={controlSx}
              >
                <MenuItem value="">Período anterior</MenuItem>
                <MenuItem value="MismoPeriodoAnoAnterior">Mismo período año anterior</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Popover>
    </Box>
  );
};

export default HeaderGrupo;
