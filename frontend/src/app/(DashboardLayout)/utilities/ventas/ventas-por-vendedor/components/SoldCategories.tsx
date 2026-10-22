"use client";

import React from "react";
import {
  Box,
  InputAdornment,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import { IconSearch } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { useEstadoVista } from "@/utils/estadoVista";
import {
  BarraParticipacion,
  ChipMargen,
  ChipVariacion,
  Columnas,
  Panel,
  TextoCelda,
  controlSx,
  formatoMonto,
  tablaSx,
  tinta,
} from "../../components/estilo";
import type { Filters } from "./Header";
import { consultaVendedor } from "./consulta";

interface Categoria {
  codigo: string;
  nombre: string;
  unidades: number;
  ventas: number;
  margenPorcentaje: number;
  cambioUnidades: number | null;
  cambioVentas: number | null;
}

type Orden = "unidades" | "ventas" | "margen";

const CAMPO: Record<Orden, keyof Categoria> = { unidades: "unidades", ventas: "ventas", margen: "margenPorcentaje" };

/** Categorías vendidas en el período, con búsqueda y orden por columna. */
const CategoriasVendidas: React.FC<{ filtros: Filters }> = ({ filtros }) => {
  // Búsqueda y orden se recuerdan al volver a la vista.
  const [vista, setVista] = useEstadoVista<{ searchTerm: string; sortBy: Orden | ""; sortDirection: "asc" | "desc" }>(
    "ventas-por-vendedor:vista",
    () => ({ searchTerm: "", sortBy: "ventas", sortDirection: "desc" })
  );
  const { searchTerm, sortDirection } = vista;
  const sortBy: Orden = vista.sortBy || "ventas";

  const url = `${BACKEND_URL}/api/pv/ventascategoria?${consultaVendedor(filtros)}`;
  const { datos, cargando } = useCargaDatos<Categoria[]>(
    url,
    async (signal) => {
      const json = await apiJson(url, { signal });
      return (Array.isArray(json) ? json : []).map((item: any) => ({
        codigo: String(item.code ?? item.Categoria),
        nombre: item.Categoria || "Sin categoría",
        unidades: Number(item.Unidades_Actual) || 0,
        ventas: Number(item.Ventas_Actual) || 0,
        margenPorcentaje: Number(item.MargenBruto_Actual_Porcentaje) || 0,
        cambioUnidades: item.PorcentajeCambioUnidades ?? null,
        cambioVentas: item.PorcentajeCambioVentas ?? null,
      }));
    },
    []
  );

  const ordenar = (columna: Orden) =>
    setVista((v) => ({
      ...v,
      sortBy: columna,
      sortDirection: sortBy === columna && v.sortDirection === "desc" ? "asc" : "desc",
    }));

  const filas = datos
    .filter((c) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const dif = (a[CAMPO[sortBy]] as number) - (b[CAMPO[sortBy]] as number);
      return sortDirection === "asc" ? dif : -dif;
    });
  const maxVenta = Math.max(0, ...datos.map((c) => c.ventas));

  const encabezado = (columna: Orden, texto: string) => (
    <TableCell align="right" sortDirection={sortBy === columna ? sortDirection : false}>
      <TableSortLabel active={sortBy === columna} direction={sortBy === columna ? sortDirection : "desc"} onClick={() => ordenar(columna)}>
        {texto}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel
      titulo="Categorías vendidas"
      descripcion={cargando ? "Cargando…" : `${datos.length.toLocaleString("es-CL")} categorías en el período`}
      accion={
        <TextField
          size="small"
          placeholder="Buscar categoría"
          value={searchTerm}
          onChange={(e) => setVista((v) => ({ ...v, searchTerm: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={15} color={tinta.tenue} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 200, "& .MuiOutlinedInput-root": controlSx }}
        />
      }
    >
      {cargando ? (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={44} />)
      ) : filas.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>
          {datos.length === 0 ? "Sin ventas en el período." : "Ninguna categoría coincide con la búsqueda."}
        </Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 520, mx: -2.5, width: "auto", overflowX: "hidden" }}>
          <Table size="small" stickyHeader sx={tablaSx}>
            <Columnas anchos={[40, 20, 25, 15]} />
            <TableHead>
              <TableRow>
                <TableCell>Categoría</TableCell>
                {encabezado("unidades", "Unidades")}
                {encabezado("ventas", "Ventas")}
                {encabezado("margen", "% Margen")}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((c) => (
                <TableRow key={c.codigo}>
                  <TableCell>
                    <TextoCelda texto={c.nombre} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
                      {c.unidades.toLocaleString("es-CL")}
                      <ChipVariacion valor={c.cambioUnidades} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75 }}>
                      {formatoMonto(c.ventas)}
                      <ChipVariacion valor={c.cambioVentas} />
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <BarraParticipacion valor={c.ventas} maximo={maxVenta} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <ChipMargen valor={c.margenPorcentaje} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
};

export default CategoriasVendidas;
