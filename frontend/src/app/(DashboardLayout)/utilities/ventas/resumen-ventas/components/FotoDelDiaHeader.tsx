"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
    FormControl,
  Grid,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import RangosRapidos, { etiquetaRango, rangoInicial, TEMPORADAS, FechasDelRango } from "../../components/RangosRapidos";
import { BotonLimpiar, CANALES, ChipFiltro, controlSx, etiquetaControlSx as etiquetaSx, tarjetaSx, tinta, filaControlesSx, IconoFiltros, SoloMovil } from "../../components/estilo";
import FrescuraDatos from "../../components/FrescuraDatos";

export interface Filters {
  canal: string;
  temporada: string;
  fechaInicio: string;
  fechaFin: string;
  sku?: string;
  familia?: string;
  subfamilia?: string;
  comparacion?: "Periodo anterior" | "Mismo período año anterior" | "";
}

interface Props {
  onFilterChange: (filters: Filters) => void;
  /** Filtros con que abre (los que el usuario dejó buscados). */
  valorInicial?: Filters;
}

/** La vista abre en "Ayer": la copia de SAP se carga a las 04:00, así que
 *  "Hoy" casi no tiene ventas durante el día. */
export const filtrosIniciales = (): Filters => {
  return {
    canal: "",
    temporada: "",
    ...rangoInicial(),
    sku: "",
    familia: "",
    subfamilia: "",
    comparacion: "",
  };
};

const NOMBRE_CANAL: Record<string, string> = Object.fromEntries(CANALES.map((c) => [c.clave, c.nombre]));

const FotoDelDiaHeader: React.FC<Props> = ({ onFilterChange, valorInicial }) => {
  const [filters, setFilters] = useState<Filters>(() => valorInicial ?? filtrosIniciales());
  const [filtrosAnchorEl, setFiltrosAnchorEl] = useState<HTMLElement | null>(null);
  const [busquedaSku, setBusquedaSku] = useState(valorInicial?.sku ?? "");
  const [busquedaFamilia, setBusquedaFamilia] = useState(valorInicial?.familia ?? "");
  const [busquedaSubfamilia, setBusquedaSubfamilia] = useState(valorInicial?.subfamilia ?? "");
  const [comparacionVisual, setComparacionVisual] = useState<string>(valorInicial?.comparacion ?? "");

  const filtrosAbiertos = Boolean(filtrosAnchorEl);
  const resumen = useMemo(
    () => (filters.temporada ? `Temporada ${filters.temporada}` : etiquetaRango(filters.fechaInicio, filters.fechaFin)),
    [filters.fechaInicio, filters.fechaFin, filters.temporada]
  );

  const emitir = (updated: Filters) => {
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleChange = (key: keyof Filters, value: string) => {
    let updated: Filters = { ...filters, [key]: value };

    if (key === "temporada") {
      const fechas = TEMPORADAS[value];
      updated = fechas
        ? { ...updated, fechaInicio: fechas.inicio, fechaFin: fechas.fin }
        : { ...updated, ...rangoInicial() };
    }

    if (key === "fechaInicio" || key === "fechaFin") {
      updated = { ...updated, temporada: "" };
    }

    emitir(updated);
  };

  const handleDateChange = (range: DateRangeValue | null) => {
    emitir({
      ...filters,
      temporada: "",
      ...(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoInicial()),
    });
  };

  const aplicarRapido = (fechaInicio: string, fechaFin: string) =>
    emitir({ ...filters, temporada: "", fechaInicio, fechaFin });

  // Limpiar vuelve al estado con que abre la vista ("Ayer", sin filtros).
  const handleClear = () => {
    setBusquedaSku("");
    setBusquedaFamilia("");
    setBusquedaSubfamilia("");
    setComparacionVisual("");
    emitir(filtrosIniciales());
  };

  const aplicarFiltrosAdicionales = () => {
    emitir({
      ...filters,
      sku: busquedaSku.trim(),
      familia: busquedaFamilia.trim(),
      subfamilia: busquedaSubfamilia.trim(),
      comparacion: (comparacionVisual || "") as Filters["comparacion"],
    });
    setFiltrosAnchorEl(null);
  };

  const quitar = (claves: (keyof Filters)[]) => {
    const updated = { ...filters };
    claves.forEach((k) => ((updated as any)[k] = ""));
    if (claves.includes("temporada")) Object.assign(updated, rangoInicial());
    if (claves.includes("sku")) setBusquedaSku("");
    if (claves.includes("familia")) setBusquedaFamilia("");
    if (claves.includes("subfamilia")) setBusquedaSubfamilia("");
    if (claves.includes("comparacion")) setComparacionVisual("");
    emitir(updated);
  };

  const activos: { etiqueta: string; claves: (keyof Filters)[] }[] = [
    filters.canal && { etiqueta: `Canal: ${NOMBRE_CANAL[filters.canal] || filters.canal}`, claves: ["canal"] },
    filters.temporada && { etiqueta: `Temporada: ${filters.temporada}`, claves: ["temporada"] },
    filters.sku && { etiqueta: `SKU: ${filters.sku}`, claves: ["sku"] },
    filters.familia && { etiqueta: `Familia: ${filters.familia}`, claves: ["familia"] },
    filters.subfamilia && { etiqueta: `Subfamilia: ${filters.subfamilia}`, claves: ["subfamilia"] },
    filters.comparacion && { etiqueta: `Comparando con: ${filters.comparacion}`, claves: ["comparacion"] },
  ].filter(Boolean) as { etiqueta: string; claves: (keyof Filters)[] }[];

  const enEstadoInicial = activos.length === 0 && !filters.temporada && resumen === "Ayer";

  // Selectores de la fila; en celular van dentro del panel de filtros (ver SoloMovil).
  const selectores = (
    <>
      <FormControl size="small" sx={{ minWidth: 165 }}>
        <Select
          value={filters.canal}
          onChange={(e) => handleChange("canal", e.target.value)}
          displayEmpty
          inputProps={{ "aria-label": "Canal" }}
          sx={controlSx}
        >
          <MenuItem value="">Todos los canales</MenuItem>
          {CANALES.map((c) => (
            <MenuItem key={c.clave} value={c.clave}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c.color, mr: 1, display: "inline-block" }} />
              {c.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <Select
          value={filters.temporada}
          onChange={(e) => handleChange("temporada", e.target.value)}
          displayEmpty
          inputProps={{ "aria-label": "Temporada" }}
          sx={controlSx}
        >
          <MenuItem value="">Sin temporada</MenuItem>
          {Object.keys(TEMPORADAS).map((season) => (
            <MenuItem key={season} value={season}>
              {season}
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
        <Box sx={{ minWidth: 170, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Resumen de ventas
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: tinta.secundaria }}>
            <strong style={{ color: tinta.primaria }}>{resumen}</strong>
            <FechasDelRango inicio={filters.fechaInicio} fin={filters.fechaFin} />
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <RangosRapidos
            fechaInicio={filters.fechaInicio}
            fechaFin={filters.fechaFin}
            inactivo={!!filters.temporada}
            onElegir={aplicarRapido}
          >
            {activos
              .filter((a) => !a.claves.includes("canal") && !a.claves.includes("temporada"))
              .map((a) => (
                <ChipFiltro key={a.etiqueta} etiqueta={a.etiqueta} onQuitar={() => quitar(a.claves)} />
              ))}
          </RangosRapidos>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={filaControlesSx}>
          {selectores}

          <DateRangeFilter
            value={filters.fechaInicio && filters.fechaFin ? { start: filters.fechaInicio, end: filters.fechaFin } : null}
            onChange={handleDateChange}
            label="Rango de fecha"
            soloIcono
          />

          <Button
            variant="outlined"
            startIcon={<IconoFiltros activos={!!filters.canal || !!filters.temporada} />}
            onClick={(e) => setFiltrosAnchorEl(e.currentTarget)}
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              height: 34,
              px: 1.5,
              whiteSpace: "nowrap",
              borderColor: tinta.borde,
              color: tinta.primaria,
              fontWeight: 600,
              fontSize: 13,
              "&:hover": { borderColor: "#cbd5e1", bgcolor: tinta.fondoSuave },
            }}
          >
            <span className="boton-texto">Más filtros</span>
          </Button>
          <BotonLimpiar onClick={handleClear} disabled={enEstadoInicial} />
        </Stack>
      </Stack>

      <Popover
        open={filtrosAbiertos}
        anchorEl={filtrosAnchorEl}
        onClose={() => setFiltrosAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2.5,
            width: { xs: 340, sm: 560 },
            borderRadius: "14px",
            border: `1px solid ${tinta.borde}`,
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)",
          },
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: tinta.primaria }}>Más filtros</Typography>
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
              Acotan todas las tarjetas, gráficos y tablas de la vista.
            </Typography>
          </Box>

          <SoloMovil>{selectores}</SoloMovil>

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <Typography sx={etiquetaSx}>Comparando con</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={comparacionVisual}
                  onChange={(e) => setComparacionVisual(e.target.value)}
                  displayEmpty
                  sx={controlSx}
                >
                  <MenuItem value="">Período anterior (por defecto)</MenuItem>
                  <MenuItem value="Periodo anterior">Periodo anterior</MenuItem>
                  <MenuItem value="Mismo período año anterior">Mismo período año anterior</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {[
              { label: "SKU", value: busquedaSku, set: setBusquedaSku },
              { label: "Familia", value: busquedaFamilia, set: setBusquedaFamilia },
              { label: "Subfamilia", value: busquedaSubfamilia, set: setBusquedaSubfamilia },
            ].map((campo) => (
              <Grid item xs={12} sm={6} key={campo.label}>
                <Typography sx={etiquetaSx}>{campo.label}</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={campo.label}
                  value={campo.value}
                  onChange={(e) => campo.set(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && aplicarFiltrosAdicionales()}
                  sx={{ "& .MuiOutlinedInput-root": controlSx }}
                />
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Button
              onClick={() => {
                setBusquedaSku("");
                setBusquedaFamilia("");
                setBusquedaSubfamilia("");
                setComparacionVisual("");
              }}
              sx={{ textTransform: "none", color: tinta.secundaria, borderRadius: "10px" }}
            >
              Limpiar campos
            </Button>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={() => setFiltrosAnchorEl(null)}
                sx={{ textTransform: "none", color: tinta.secundaria, borderRadius: "10px" }}
              >
                Cerrar
              </Button>
              <Button
                onClick={aplicarFiltrosAdicionales}
                variant="contained"
                disableElevation
                sx={{ textTransform: "none", borderRadius: "10px", px: 2.5, fontWeight: 700 }}
              >
                Aplicar
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Popover>
    </Box>
  );
};

export default FotoDelDiaHeader;
