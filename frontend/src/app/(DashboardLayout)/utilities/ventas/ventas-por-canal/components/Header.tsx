"use client";

import { useState } from "react";
import { Box, Button, FormControl, MenuItem, Select, Stack, Typography } from "@mui/material";
import DateRangeFilter, { DateRangeValue } from "../../components/DateRangeFilter";
import RangosRapidos, { etiquetaRango, rangoInicial, FechasDelRango } from "../../components/RangosRapidos";
import FrescuraDatos from "../../components/FrescuraDatos";
import { BotonLimpiar, CANALES, ChipFiltro, controlSx, tarjetaSx, tinta, filaControlesSx, IconoFiltros } from "../../components/estilo";
import { FiltrosActivosMovil, HojaFiltros, pildorasMovilSx } from "../../components/HojaFiltros";
import PeriodoMovil, { FiltrosPuestosMovil } from "../../components/PeriodoMovil";
import { useEsCelular } from "../../components/movil";
import { useBarraMovil } from "@/app/(DashboardLayout)/layout/header/BarraMovil";

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
  // Hoja de filtros (solo celular: en escritorio el canal está en la fila).
  const [hojaAbierta, setHojaAbierta] = useState(false);

  const handleDateChange = (range: DateRangeValue | null) =>
    onFilterChange({ ...filters, ...(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoInicial()) });

  const handleClearFilters = () => onFilterChange({ canal: "", ...rangoInicial() });

  const rango = etiquetaRango(filters.fechaInicio, filters.fechaFin);
  const enEstadoInicial = !filters.canal && !vendedor && rango === "Ayer";
  const esCelular = useEsCelular();

  // Celular: el nombre de la vista y el período · canal van en la barra de arriba.
  useBarraMovil({ titulo: "Ventas por canal", subtitulo: `${rango} · ${canal ? canal.nombre : "Todos los canales"}` });

  // Selectores de la fila; en celular van dentro del panel de filtros (ver SoloMovil).
  const selectores = (
    <>
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
    </>
  );

  // Celular: sin tarjeta de título. Barra de período pegada arriba y, debajo,
  // canal y vendedor como chips; el canal se elige en la hoja de filtros.
  if (esCelular) {
    return (
      <>
        <PeriodoMovil
          fechaInicio={filters.fechaInicio}
          fechaFin={filters.fechaFin}
          onElegir={(fechaInicio, fechaFin) => onFilterChange({ ...filters, fechaInicio, fechaFin })}
          calendario={
            <DateRangeFilter
              value={filters.fechaInicio && filters.fechaFin ? { start: filters.fechaInicio, end: filters.fechaFin } : null}
              onChange={handleDateChange}
              label="Rango de fecha"
              soloIcono
            />
          }
          onFiltros={() => setHojaAbierta(true)}
          filtrosActivos={!!filters.canal}
        />
        <FiltrosPuestosMovil
          activos={[
            ...(canal ? [{ etiqueta: `Canal: ${canal.nombre}`, onQuitar: () => onFilterChange({ ...filters, canal: "" }) }] : []),
            ...(vendedor && onQuitarVendedor ? [{ etiqueta: `Vendedor: ${vendedor.nombre}`, onQuitar: onQuitarVendedor }] : []),
          ]}
          onLimpiar={handleClearFilters}
        />
        {/* El canal se aplica al elegirlo; "Listo" solo cierra. */}
        <HojaFiltros abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} descripcion="Acotan todas las tarjetas y tablas de la vista.">
          {selectores}
        </HojaFiltros>
      </>
    );
  }

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

        <Box sx={{ flex: 1, minWidth: 0, ...pildorasMovilSx }}>
          <RangosRapidos
            fechaInicio={filters.fechaInicio}
            fechaFin={filters.fechaFin}
            onElegir={(fechaInicio, fechaFin) => onFilterChange({ ...filters, fechaInicio, fechaFin })}
          >
            {vendedor && onQuitarVendedor && <ChipFiltro etiqueta={`Vendedor: ${vendedor.nombre}`} onQuitar={onQuitarVendedor} />}
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
            aria-label="Filtros"
            onClick={() => setHojaAbierta(true)}
            sx={{ display: { xs: "inline-flex", sm: "none" }, minWidth: 36, height: 34, px: 1, borderRadius: "10px", borderColor: tinta.borde, color: tinta.primaria }}
          >
            <IconoFiltros activos={!!filters.canal} />
          </Button>

          <BotonLimpiar onClick={handleClearFilters} disabled={enEstadoInicial} />
        </Stack>

        <FiltrosActivosMovil
          activos={canal ? [{ etiqueta: `Canal: ${canal.nombre}`, onQuitar: () => onFilterChange({ ...filters, canal: "" }) }] : []}
        />
      </Stack>

      {/* El canal se aplica al elegirlo; "Listo" solo cierra. */}
      <HojaFiltros abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} descripcion="Acotan todas las tarjetas y tablas de la vista.">
        {selectores}
      </HojaFiltros>
    </Box>
  );
};

export default HeaderFilters;
