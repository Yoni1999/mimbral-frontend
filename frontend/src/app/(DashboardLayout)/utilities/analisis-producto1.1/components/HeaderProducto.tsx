"use client";

import React from "react";
import { Box, Button, FormControl, MenuItem, Popover, Select, Stack, Typography } from "@mui/material";
import DateRangeFilter, { DateRangeValue } from "@/app/(DashboardLayout)/utilities/ventas/components/DateRangeFilter";
import RangosRapidos, { TEMPORADAS, etiquetaRango, rangoInicial, FechasDelRango } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import FrescuraDatos from "@/app/(DashboardLayout)/utilities/ventas/components/FrescuraDatos";
import { useEsCelular } from "@/app/(DashboardLayout)/utilities/ventas/components/movil";
import { EtiquetaHoja, FiltrosActivosMovil, HojaFiltros, pildorasMovilSx } from "@/app/(DashboardLayout)/utilities/ventas/components/HojaFiltros";
import PeriodoMovil, { FiltrosPuestosMovil } from "@/app/(DashboardLayout)/utilities/ventas/components/PeriodoMovil";
import { useBarraMovil } from "@/app/(DashboardLayout)/layout/header/BarraMovil";
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
import SelectorProducto, { FotoProducto, ProductoElegido } from "./SelectorProducto";

export interface FiltrosProducto {
  producto: ProductoElegido | null;
  canal: string;
  fechaInicio: string;
  fechaFin: string;
  temporada: string;
  /** "" = período anterior (por defecto). */
  modoComparacion: "" | "MismoPeriodoAnoAnterior";
}

interface Props {
  filtros: FiltrosProducto;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosProducto>>;
  selectorAbierto: boolean;
  setSelectorAbierto: (abierto: boolean) => void;
}

/** Barra de filtros de Análisis de producto: el producto (con buscador), los
 *  períodos rápidos, canal, fecha, y en "Filtros" la temporada y contra qué
 *  se compara. Cada cambio se aplica al instante. */
const HeaderProducto: React.FC<Props> = ({ filtros, setFiltros, selectorAbierto, setSelectorAbierto }) => {
  const [filtrosAnchor, setFiltrosAnchor] = React.useState<HTMLElement | null>(null);
  const { producto } = filtros;
  const rango = filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin);
  const canal = CANALES.find((c) => c.clave === filtros.canal);

  const esCelular = useEsCelular();
  const cambiar = (cambios: Partial<FiltrosProducto>) => setFiltros((prev) => ({ ...prev, ...cambios }));

  const handleDateChange = (range: DateRangeValue | null) =>
    cambiar({ temporada: "", ...(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoInicial()) });

  const elegirTemporada = (temporada: string) => {
    const fechas = TEMPORADAS[temporada];
    cambiar(fechas ? { temporada, fechaInicio: fechas.inicio, fechaFin: fechas.fin } : { temporada: "", ...rangoInicial() });
  };

  // Limpiar deja el producto: lo que se limpia son los filtros sobre él.
  const limpiar = () => setFiltros((f) => ({ ...f, canal: "", temporada: "", modoComparacion: "", ...rangoInicial() }));
  const enEstadoInicial = !filtros.canal && !filtros.temporada && !filtros.modoComparacion && rango === "Ayer";
  const filtrosActivos = !!filtros.temporada || !!filtros.modoComparacion;

  // Celular: el producto (o el nombre de la vista) y el período · canal van en la barra de arriba.
  useBarraMovil({
    titulo: producto ? producto.nombre || producto.sku : "Análisis de producto",
    subtitulo: `${rango} · ${canal ? canal.nombre : "Todos los canales"}`,
  });

  // Selectores de la fila; en celular van dentro del panel de filtros (ver SoloMovil).
  const selectorCanal = (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <Select
        value={filtros.canal}
        displayEmpty
        inputProps={{ "aria-label": "Canal" }}
        onChange={(e) => cambiar({ canal: e.target.value })}
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
  );

  const selectores = (
    <>
      <SelectorProducto
        producto={producto}
        onElegir={(p) => cambiar({ producto: p })}
        abierto={selectorAbierto}
        setAbierto={setSelectorAbierto}
      />

      {selectorCanal}
    </>
  );

  // Hoja de filtros de celular (la abre el botón de la barra de período).
  const hojaMovil = (
    // Cada cambio se aplica al instante; "Listo" cierra.
    <HojaFiltros abierta={!!filtrosAnchor} onCerrar={() => setFiltrosAnchor(null)} descripcion="Acotan todas las pestañas de la vista.">
      <EtiquetaHoja>Canal</EtiquetaHoja>
      {selectorCanal}
      <EtiquetaHoja>Temporada</EtiquetaHoja>
      <FormControl fullWidth size="small">
        <Select value={filtros.temporada} displayEmpty inputProps={{ "aria-label": "Temporada" }} onChange={(e) => elegirTemporada(e.target.value)} sx={controlSx}>
          <MenuItem value="">Sin temporada</MenuItem>
          {Object.keys(TEMPORADAS).map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <EtiquetaHoja>Comparar con</EtiquetaHoja>
      <FormControl fullWidth size="small">
        <Select
          value={filtros.modoComparacion}
          displayEmpty
          inputProps={{ "aria-label": "Comparar con" }}
          onChange={(e) => cambiar({ modoComparacion: e.target.value as FiltrosProducto["modoComparacion"] })}
          sx={controlSx}
        >
          <MenuItem value="">Período anterior</MenuItem>
          <MenuItem value="MismoPeriodoAnoAnterior">Mismo período año anterior</MenuItem>
        </Select>
      </FormControl>
    </HojaFiltros>
  );

  // Celular: sin tarjeta de título. Barra de período pegada arriba (canal,
  // temporada y comparación en la hoja de filtros), los filtros puestos como
  // chips y el buscador de producto a todo el ancho.
  if (esCelular) {
    return (
      <>
        <PeriodoMovil
          fechaInicio={filtros.fechaInicio}
          fechaFin={filtros.fechaFin}
          inactivo={!!filtros.temporada}
          onElegir={(fechaInicio, fechaFin) => cambiar({ temporada: "", fechaInicio, fechaFin })}
          calendario={
            <DateRangeFilter
              value={filtros.fechaInicio && filtros.fechaFin ? { start: filtros.fechaInicio, end: filtros.fechaFin } : null}
              onChange={handleDateChange}
              label="Rango de fecha"
              soloIcono
            />
          }
          onFiltros={(e) => setFiltrosAnchor(e.currentTarget)}
          filtrosActivos={!!filtros.canal || filtrosActivos}
        />
        <FiltrosPuestosMovil
          activos={[
            ...(canal ? [{ etiqueta: `Canal: ${canal.nombre}`, onQuitar: () => cambiar({ canal: "" }) }] : []),
            ...(filtros.temporada ? [{ etiqueta: `Temporada: ${filtros.temporada}`, onQuitar: () => elegirTemporada("") }] : []),
            ...(filtros.modoComparacion ? [{ etiqueta: "vs año anterior", onQuitar: () => cambiar({ modoComparacion: "" }) }] : []),
          ]}
          onLimpiar={limpiar}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, "& > button": { height: 40 } }}>
          {producto && <FotoProducto src={producto.imagen} tamano={40} />}
          <SelectorProducto producto={producto} onElegir={(p) => cambiar({ producto: p })} abierto={selectorAbierto} setAbierto={setSelectorAbierto} />
        </Box>
        {hojaMovil}
      </>
    );
  }

  return (
    <Box sx={{ ...tarjetaSx, position: "relative", mb: 2, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      <FrescuraDatos />
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1.25} alignItems={{ xs: "stretch", xl: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 200, maxWidth: { xl: 380 }, flexShrink: 0 }}>
          {producto && <FotoProducto src={producto.imagen} tamano={40} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap title={producto?.nombre} sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {producto ? producto.nombre || producto.sku : "Análisis de producto"}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11.5, color: tinta.secundaria }}>
              {producto && (
                <>
                  <strong style={{ color: tinta.primaria }}>SKU {producto.sku}</strong> ·{" "}
                </>
              )}
              <strong style={{ color: tinta.primaria }}>{canal ? canal.nombre : "Todos los canales"}</strong> ·{" "}
              <strong style={{ color: tinta.primaria }}>{rango}</strong>
              <FechasDelRango inicio={filtros.fechaInicio} fin={filtros.fechaFin} />
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, ...pildorasMovilSx }}>
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
              textTransform: "none",
              borderRadius: "10px",
              height: 34,
              px: 1.5,
              whiteSpace: "nowrap",
              borderColor: filtrosActivos ? tinta.acento : tinta.borde,
              color: filtrosActivos ? tinta.acento : tinta.primaria,
              fontWeight: 600,
              fontSize: 13,
              "&:hover": { borderColor: "#cbd5e1", bgcolor: tinta.fondoSuave },
            }}
          >
            <span className="boton-texto">Filtros</span>
          </Button>

          <BotonLimpiar onClick={limpiar} disabled={enEstadoInicial} />
        </Stack>

        {/* En celular el canal queda dentro de la hoja: aquí se ve como chip. */}
        <FiltrosActivosMovil
          activos={canal ? [{ etiqueta: `Canal: ${canal.nombre}`, onQuitar: () => cambiar({ canal: "" }) }] : []}
        />
      </Stack>

      <Popover
        open={!!filtrosAnchor}
        anchorEl={filtrosAnchor}
        onClose={() => setFiltrosAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { mt: 1, p: 2.5, width: 320, maxWidth: "calc(100vw - 24px)", borderRadius: "14px", border: `1px solid ${tinta.borde}`, boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)" },
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
                onChange={(e) => cambiar({ modoComparacion: e.target.value as FiltrosProducto["modoComparacion"] })}
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

export default HeaderProducto;
