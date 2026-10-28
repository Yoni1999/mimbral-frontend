"use client";

import { Box, Button, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import DateRangeFilter, { DateRangeValue } from "../../components/DateRangeFilter";
import RangosRapidos, { etiquetaRango, rangoInicial, FechasDelRango } from "../../components/RangosRapidos";
import FrescuraDatos from "../../components/FrescuraDatos";
import { BotonLimpiar, CANALES, ChipFiltro, controlSx, tarjetaSx, tinta } from "../../components/estilo";

export interface Filters {
  canal: string;
  fechaInicio: string;
  fechaFin: string;
}

interface HeaderFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  /** Vendedor elegido en la lista de vendedores: acota tarjetas y tablas. */
  vendedor?: { codigo: number; nombre: string } | null;
  onQuitarVendedor?: () => void;
}

/** Barra de filtros de Ventas por canal. Cada cambio se aplica al instante
 *  (antes había que pulsar "Aplicar"). */
const HeaderFilters = ({ filters, onFilterChange, vendedor, onQuitarVendedor }: HeaderFiltersProps) => {
  const canal = CANALES.find((c) => c.clave === filters.canal);

  const handleDateChange = (range: DateRangeValue | null) =>
    onFilterChange({ ...filters, ...(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoInicial()) });

  const handleClearFilters = () => onFilterChange({ canal: "", ...rangoInicial() });

  const rango = etiquetaRango(filters.fechaInicio, filters.fechaFin);
  const enEstadoInicial = !filters.canal && !vendedor && rango === "Ayer";

  return (
    <Box sx={{ ...tarjetaSx, position: "relative", mb: 2, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      <FrescuraDatos />
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1.25} alignItems={{ xs: "stretch", xl: "center" }}>
        <Box sx={{ minWidth: 190, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Ventas por canal
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: tinta.secundaria }}>
            <strong style={{ color: tinta.primaria }}>{canal ? canal.nombre : "Todos los canales"}</strong> ·{" "}
            <strong style={{ color: tinta.primaria }}>{rango}</strong>
            <FechasDelRango inicio={filters.fechaInicio} fin={filters.fechaFin} />
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <RangosRapidos
            fechaInicio={filters.fechaInicio}
            fechaFin={filters.fechaFin}
            onElegir={(fechaInicio, fechaFin) => onFilterChange({ ...filters, fechaInicio, fechaFin })}
          >
            {vendedor && onQuitarVendedor && <ChipFiltro etiqueta={`Vendedor: ${vendedor.nombre}`} onQuitar={onQuitarVendedor} />}
          </RangosRapidos>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 175 }}>
            <Select
              value={filters.canal}
              displayEmpty
              inputProps={{ "aria-label": "Canal" }}
              onChange={(e) => onFilterChange({ ...filters, canal: e.target.value })}
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

          <DateRangeFilter
            value={filters.fechaInicio && filters.fechaFin ? { start: filters.fechaInicio, end: filters.fechaFin } : null}
            onChange={handleDateChange}
            label="Rango de fecha"
            soloIcono
          />

          <BotonLimpiar onClick={handleClearFilters} disabled={enEstadoInicial} />
        </Stack>
      </Stack>
    </Box>
  );
};

export default HeaderFilters;
