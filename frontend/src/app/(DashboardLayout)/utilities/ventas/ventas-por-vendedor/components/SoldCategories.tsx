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
import { BarraListaMovil, TarjetasMovil, useEsCelular } from "../../components/movil";

interface Categoria {
  codigo: string;
  nombre: string;
  unidades: number;
  ventas: number;
  margenPorcentaje: number;
  cambioUnidades: number | null;
  cambioVentas: number | null;
}

type Orden = "nombre" | "unidades" | "ventas" | "margen";

const CAMPO: Record<Orden, keyof Categoria> = { nombre: "nombre", unidades: "unidades", ventas: "ventas", margen: "margenPorcentaje" };

/** Categorías vendidas en el período, con búsqueda y orden por columna. */
const CategoriasVendidas: React.FC<{ filtros: Filters }> = ({ filtros }) => {
  // Búsqueda y orden se recuerdan al volver a la vista.
  const [vista, setVista] = useEstadoVista<{ searchTerm: string; sortBy: Orden | ""; sortDirection: "asc" | "desc" }>(
    "ventas-por-vendedor:vista",
    () => ({ searchTerm: "", sortBy: "ventas", sortDirection: "desc" })
  );
  const { searchTerm, sortDirection } = vista;
  const sortBy: Orden = vista.sortBy || "ventas";
  const esCelular = useEsCelular();

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
      const va = a[CAMPO[sortBy]];
      const vb = b[CAMPO[sortBy]];
      const dif = typeof va === "number" && typeof vb === "number" ? va - vb : String(va ?? "").localeCompare(String(vb ?? ""), "es");
      return sortDirection === "asc" ? dif : -dif;
    });
  const maxVenta = Math.max(0, ...datos.map((c) => c.ventas));

  const encabezado = (columna: Orden, texto: string, align: "left" | "right" = "right") => (
    <TableCell align={align} sortDirection={sortBy === columna ? sortDirection : false}>
      <TableSortLabel active={sortBy === columna} direction={sortBy === columna ? sortDirection : "desc"} onClick={() => ordenar(columna)}>
        {texto}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel
      titulo="Categorías vendidas"
      descripcion={cargando ? "Cargando…" : `${datos.length.toLocaleString("es-CL")} categorías en el período`}
      // En celular el buscador va en la barra de la lista.
      accion={esCelular ? undefined : (
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
          sx={{ width: { xs: "100%", sm: 200 }, "& .MuiOutlinedInput-root": controlSx }}
        />
      )}
      sx={{ p: { xs: 1.5, sm: 2.5 } }}
    >
      {esCelular && !cargando && datos.length > 0 && (
        <Box sx={{ mb: 1.25 }}>
          <BarraListaMovil
            buscar={{ valor: searchTerm, onCambiar: (t) => setVista((v) => ({ ...v, searchTerm: t })), placeholder: "Buscar categoría" }}
            orden={{
              opciones: [
                { clave: "ventas", titulo: "Ventas" },
                { clave: "unidades", titulo: "Unidades" },
                { clave: "margen", titulo: "% Margen" },
                { clave: "nombre", titulo: "Categoría" },
              ],
              clave: sortBy,
              direccion: sortDirection,
              onCambiar: (clave, direccion) => setVista((v) => ({ ...v, sortBy: clave as Orden, sortDirection: direccion })),
            }}
          />
        </Box>
      )}
      {cargando ? (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={44} />)
      ) : filas.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>
          {datos.length === 0 ? "Sin ventas en el período." : "Ninguna categoría coincide con la búsqueda."}
        </Typography>
      ) : esCelular ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <TarjetasMovil
            filas={filas.map((c, i) => ({
              clave: c.codigo,
              titulo: c.nombre,
              rango: sortDirection === "desc" && sortBy !== "nombre" && !searchTerm ? i + 1 : undefined,
              principales: [
                { titulo: "Unidades", valor: c.unidades.toLocaleString("es-CL"), unidad: "un." },
                { titulo: "Ventas", valor: formatoMonto(c.ventas) },
                { titulo: "% Margen", valor: "", chip: c.margenPorcentaje },
              ],
              // Las variaciones contra el período anterior van en la hoja.
              detalle: [
                { titulo: "Variación ventas", valor: c.cambioVentas == null ? "—" : <ChipVariacion valor={c.cambioVentas} /> },
                { titulo: "Variación unidades", valor: c.cambioUnidades == null ? "—" : <ChipVariacion valor={c.cambioUnidades} /> },
              ],
            }))}
          />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 520, mx: -2.5, width: "auto", overflowX: "hidden" }}>
          <Table size="small" stickyHeader sx={tablaSx}>
            <Columnas anchos={[40, 20, 25, 15]} />
            <TableHead>
              <TableRow>
                {encabezado("nombre", "Categoría", "left")}
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
