"use client";

import React from "react";
import { Autocomplete, Avatar, Box, Button, FormControl, MenuItem, Popover, Select, Stack, TextField, Typography } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import DateRangeFilter, { DateRangeValue } from "../../components/DateRangeFilter";
import RangosRapidos, { etiquetaRango, rangoInicial } from "../../components/RangosRapidos";
import FrescuraDatos from "../../components/FrescuraDatos";
import { BotonLimpiar, ChipFiltro, canalPorClave, controlSx, etiquetaControlSx, tarjetaSx, tinta, filaControlesSx, IconoFiltros, SoloMovil } from "../../components/estilo";

export interface Filters {
  vendedorEmpresa: string;
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: string;
  canal: string;
}

/** Canales con vendedores propios (los marketplaces no tienen vendedor). */
const CANALES_VENDEDOR = [
  { clave: "chorrillo", api: "Chorrillo" },
  { clave: "empresas", api: "Empresas" },
  { clave: "balmaceda", api: "Balmaceda" },
] as const;

const nombreCanal = (clave: string) => canalPorClave(clave)?.nombre ?? clave;

const COMPARACIONES = [
  { valor: "", etiqueta: "Período anterior" },
  { valor: "MismoPeriodoAnoAnterior", etiqueta: "Mismo período año anterior" },
];

export interface Vendedor {
  codigo: string;
  nombre: string;
  cargo: string;
  imagen?: string;
  canal: string;
}

interface Props {
  filtros: Filters;
  setFiltros: React.Dispatch<React.SetStateAction<Filters>>;
}

/** Barra de filtros de Ventas por vendedor. Cada cambio se aplica al
 *  instante. El vendedor se busca por nombre en la lista de los canales con
 *  vendedores (o del canal elegido); sin vendedor se ven los totales. */
const HeaderVendedor: React.FC<Props> = ({ filtros, setFiltros }) => {
  const [vendedores, setVendedores] = React.useState<Vendedor[]>([]);
  const [cargandoVendedores, setCargandoVendedores] = React.useState(false);
  const [filtrosAnchor, setFiltrosAnchor] = React.useState<HTMLElement | null>(null);

  // Lista de vendedores: la del canal elegido o la de los tres canales. Si
  // cambia el canal antes de que llegue, se cancela la anterior.
  React.useEffect(() => {
    const controller = new AbortController();
    const canales = filtros.canal ? CANALES_VENDEDOR.filter((c) => c.clave === filtros.canal) : CANALES_VENDEDOR;
    setCargandoVendedores(true);
    Promise.all(
      canales.map((c) =>
        apiJson(`${BACKEND_URL}/api/oc/obvc?canal=${c.api}`, { signal: controller.signal })
          .then((data: any[]) =>
            (Array.isArray(data) ? data : []).map((v) => ({
              codigo: String(v.SlpCode),
              nombre: v.SlpName,
              cargo: v.Memo,
              imagen: v.U_Imagen || undefined,
              canal: c.clave,
            }))
          )
          .catch(() => [] as Vendedor[])
      )
    ).then((listas) => {
      if (controller.signal.aborted) return;
      setVendedores(listas.flat().sort((a, b) => a.canal.localeCompare(b.canal) || a.nombre.localeCompare(b.nombre)));
      setCargandoVendedores(false);
    });
    return () => controller.abort();
  }, [filtros.canal]);

  const vendedor = vendedores.find((v) => v.codigo === String(filtros.vendedorEmpresa)) ?? null;

  const cambiar = (cambios: Partial<Filters>) => setFiltros((prev) => ({ ...prev, ...cambios }));

  const handleDateChange = (range: DateRangeValue | null) =>
    cambiar(range ? { fechaInicio: range.start, fechaFin: range.end } : rangoInicial());

  const limpiar = () => setFiltros({ vendedorEmpresa: "", modoComparacion: "", canal: "", ...rangoInicial() });

  const rango = etiquetaRango(filtros.fechaInicio, filtros.fechaFin);
  const enEstadoInicial = !filtros.canal && !filtros.vendedorEmpresa && !filtros.modoComparacion && rango === "Ayer";

  // Selectores de la fila; en celular van dentro del panel de filtros (ver SoloMovil).
  const selectores = (
    <>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={filtros.canal}
          displayEmpty
          inputProps={{ "aria-label": "Canal" }}
          // Al cambiar de canal se suelta el vendedor si no es de ese canal.
          onChange={(e) => {
            const canal = e.target.value;
            cambiar({ canal, vendedorEmpresa: !canal || vendedor?.canal === canal ? filtros.vendedorEmpresa : "" });
          }}
          sx={controlSx}
        >
          <MenuItem value="">Todos los canales</MenuItem>
          {CANALES_VENDEDOR.map((c) => (
            <MenuItem key={c.clave} value={c.clave}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: canalPorClave(c.clave)?.color, mr: 1, display: "inline-block" }} />
              {nombreCanal(c.clave)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Autocomplete
        size="small"
        sx={{ minWidth: 230 }}
        options={vendedores}
        value={vendedor}
        loading={cargandoVendedores}
        groupBy={filtros.canal ? undefined : (v) => nombreCanal(v.canal)}
        getOptionLabel={(v) => v.nombre}
        isOptionEqualToValue={(a, b) => a.codigo === b.codigo}
        onChange={(_, v) => cambiar({ vendedorEmpresa: v?.codigo ?? "" })}
        noOptionsText="Sin vendedores"
        loadingText="Cargando vendedores…"
        renderOption={(props, v) => (
          <Box component="li" {...props} key={v.codigo} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar src={v.imagen} alt="" sx={{ width: 24, height: 24, fontSize: 11 }}>
              {v.nombre.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{v.nombre}</Typography>
              <Typography noWrap sx={{ fontSize: 11, color: tinta.tenue }}>{v.cargo}</Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Todos los vendedores"
            inputProps={{ ...params.inputProps, "aria-label": "Vendedor" }}
            sx={{ "& .MuiOutlinedInput-root": { ...controlSx, py: "0 !important" } }}
          />
        )}
      />
    </>
  );

  return (
    <Box sx={{ ...tarjetaSx, position: "relative", mb: 2, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      <FrescuraDatos />
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1.25} alignItems={{ xs: "stretch", xl: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 190, flexShrink: 0 }}>
          {vendedor && (
            <Avatar src={vendedor.imagen} alt="" sx={{ width: 34, height: 34, fontSize: 14, bgcolor: "#eff4ff", color: tinta.acento }}>
              {vendedor.nombre.charAt(0)}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {vendedor ? vendedor.nombre : "Ventas por vendedor"}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11.5, color: tinta.secundaria }}>
              <strong style={{ color: tinta.primaria }}>
                {vendedor ? vendedor.cargo : filtros.canal ? nombreCanal(filtros.canal) : "Todos los vendedores"}
              </strong>{" "}
              · <strong style={{ color: tinta.primaria }}>{rango}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <RangosRapidos
            fechaInicio={filtros.fechaInicio}
            fechaFin={filtros.fechaFin}
            onElegir={(fechaInicio, fechaFin) => cambiar({ fechaInicio, fechaFin })}
          >
            {filtros.modoComparacion && (
              <ChipFiltro etiqueta="vs año anterior" onQuitar={() => cambiar({ modoComparacion: "" })} />
            )}
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
            startIcon={<IconoFiltros activos={!!filtros.canal || !!filtros.vendedorEmpresa} />}
            onClick={(e) => setFiltrosAnchor(e.currentTarget)}
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              height: 34,
              px: 1.5,
              whiteSpace: "nowrap",
              borderColor: filtros.modoComparacion ? tinta.acento : tinta.borde,
              color: filtros.modoComparacion ? tinta.acento : tinta.primaria,
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
        <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, mb: 2 }}>
          Contra qué período se calculan las variaciones.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <SoloMovil>{selectores}</SoloMovil>
        </Box>
        <Typography sx={etiquetaControlSx}>Comparar con</Typography>
        <FormControl fullWidth size="small">
          <Select
            value={filtros.modoComparacion}
            displayEmpty
            inputProps={{ "aria-label": "Comparar con" }}
            onChange={(e) => {
              cambiar({ modoComparacion: e.target.value });
              setFiltrosAnchor(null);
            }}
            sx={controlSx}
          >
            {COMPARACIONES.map((c) => (
              <MenuItem key={c.valor} value={c.valor}>
                {c.etiqueta}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Popover>
    </Box>
  );
};

export default HeaderVendedor;
