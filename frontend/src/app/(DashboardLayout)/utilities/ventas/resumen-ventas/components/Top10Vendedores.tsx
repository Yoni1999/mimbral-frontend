"use client";
import React, { useMemo, useState } from "react";
import { Avatar, Box, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Typography } from "@mui/material";
import { BarraParticipacion, ChipMargen, formatoMonto, tablaSx, tinta, Panel, Columnas, TextoCelda } from "../../components/estilo";
import { OrdenMovil, TarjetasMovil, useEsCelular } from "../../components/movil";

interface Vendedor {
  Nombre: string;
  Imagen: string;
  UnidadesVendidas: number;
  Items: number;
  MargenBruto: number;
  MargenPorcentaje: number;
  TotalVentas?: number;
}

type Order = "asc" | "desc";
type OrderBy = "Nombre" | "UnidadesVendidas" | "Items" | "MargenBruto" | "MargenPorcentaje" | "TotalVentas";

interface Props {
  data: Vendedor[];
}

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const TopVendedoresChart: React.FC<Props> = ({ data }) => {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("TotalVentas");
  const esCelular = useEsCelular();

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    return [...(Array.isArray(data) ? data : [])].sort((a, b) => {
      if (orderBy === "Nombre") {
        const r = String(a.Nombre ?? "").localeCompare(String(b.Nombre ?? ""), "es");
        return order === "asc" ? r : -r;
      }
      const valA = a[orderBy] ?? 0;
      const valB = b[orderBy] ?? 0;
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [data, order, orderBy]);

  const maxVenta = Math.max(0, ...sortedData.map((v) => v.TotalVentas ?? 0));

  const columna = (key: OrderBy, label: string, ultima = false, primera = false) => (
    <TableCell align={primera ? "left" : "right"} sx={ultima ? { pr: 2.5 } : primera ? { pl: 2.5 } : undefined} sortDirection={orderBy === key ? order : false}>
      <TableSortLabel active={orderBy === key} direction={orderBy === key ? order : "desc"} onClick={() => handleSort(key)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel titulo="Top 10 vendedores" descripcion="Ordenable por cualquier columna" sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {esCelular ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <OrdenMovil
            opciones={[
              { clave: "TotalVentas", titulo: "Ventas" },
              { clave: "UnidadesVendidas", titulo: "Unidades" },
              { clave: "MargenPorcentaje", titulo: "% Margen" },
              { clave: "MargenBruto", titulo: "Margen bruto" },
              { clave: "Items", titulo: "Ítems" },
              { clave: "Nombre", titulo: "Vendedor" },
            ]}
            clave={orderBy}
            direccion={order}
            onCambiar={(clave, direccion) => {
              setOrderBy(clave as OrderBy);
              setOrder(direccion);
            }}
          />
          <TarjetasMovil
            filas={sortedData.map((vendedor, i) => ({
              clave: vendedor.Nombre,
              titulo: vendedor.Nombre,
              // Foto del vendedor (o recuadro gris) con su posición si se ordena de mayor a menor por una cifra.
              imagen: vendedor.Imagen || null,
              rango: order === "desc" && orderBy !== "Nombre" ? i + 1 : undefined,
              principales: [
                { titulo: "Unidades", valor: (vendedor.UnidadesVendidas ?? 0).toLocaleString("es-CL"), unidad: "un." },
                { titulo: "Ventas", valor: vendedor.TotalVentas ? formatoMonto(vendedor.TotalVentas) : "—" },
                { titulo: "Margen", valor: "", chip: vendedor.MargenPorcentaje ?? null },
              ],
              detalle: [
                { titulo: "Margen bruto", valor: formatoMonto(vendedor.MargenBruto) },
                { titulo: "Ítems", valor: (vendedor.Items ?? 0).toLocaleString("es-CL") },
              ],
            }))}
          />
        </Box>
      ) : (
      <Box sx={{ maxHeight: 360, overflowY: "auto", overflowX: "hidden", mx: -2.5 }}>
        <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[30, 18, 13, 10, 15, 14]} />
          <TableHead>
            <TableRow>
              {columna("Nombre", "Vendedor", false, true)}
              {columna("TotalVentas", "Ventas")}
              {columna("UnidadesVendidas", "Unidades")}
              {columna("Items", "Ítems")}
              {columna("MargenBruto", "Margen bruto")}
              {columna("MargenPorcentaje", "% Margen", true)}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((vendedor) => (
              <TableRow key={vendedor.Nombre}>
                <TableCell sx={{ pl: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={vendedor.Imagen || undefined}
                      alt={vendedor.Nombre}
                      sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: "#eff4ff", color: tinta.acento, flexShrink: 0 }}
                    >
                      {iniciales(vendedor.Nombre || "")}
                    </Avatar>
                    <TextoCelda texto={vendedor.Nombre} />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {vendedor.TotalVentas ? formatoMonto(vendedor.TotalVentas) : "—"}
                  <Box sx={{ mt: 0.5 }}>
                    <BarraParticipacion valor={vendedor.TotalVentas ?? 0} maximo={maxVenta} />
                  </Box>
                </TableCell>
                <TableCell align="right">{(vendedor.UnidadesVendidas ?? 0).toLocaleString("es-CL")}</TableCell>
                <TableCell align="right">{(vendedor.Items ?? 0).toLocaleString("es-CL")}</TableCell>
                <TableCell align="right">{formatoMonto(vendedor.MargenBruto)}</TableCell>
                <TableCell align="right" sx={{ pr: 2.5 }}>
                  <ChipMargen valor={vendedor.MargenPorcentaje} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      )}
    </Panel>
  );
};

export default TopVendedoresChart;
