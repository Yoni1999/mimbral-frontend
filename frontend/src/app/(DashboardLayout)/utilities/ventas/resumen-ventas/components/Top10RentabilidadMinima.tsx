"use client";
import { Avatar, Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { ChipMargen, formatoPesos, tablaSx, tinta, Panel, Columnas, TextoCelda } from "../../components/estilo";
import { CeldaOrden, useOrdenTabla } from "../../components/ordenTabla";
import { OrdenMovil, TarjetasMovil, useEsCelular } from "../../components/movil";

interface ProductoRentabilidad {
  Nombre_Producto: string;
  Codigo_Producto: string;
  Cantidad_Vendida: number;
  Precio_Venta_Promedio: number;
  Costo_Promedio: number;
  Rentabilidad_Total: number;
  Margen_Porcentaje: number;
}

interface Props {
  data: ProductoRentabilidad[];
}

const TopRentabilidadMinima = ({ data }: Props) => {
  const orden = useOrdenTabla((data ?? []).slice(0, 10), {
    producto: (i) => i.Nombre_Producto,
    cantidad: (i) => i.Cantidad_Vendida,
    venta: (i) => i.Precio_Venta_Promedio,
    costo: (i) => i.Costo_Promedio,
    rentabilidad: (i) => i.Rentabilidad_Total,
    margen: (i) => i.Margen_Porcentaje,
  });
  const esCelular = useEsCelular();
  return (
  <Panel titulo="Top 10 productos menos rentables" descripcion="Los que menos margen dejaron: revisar precio o costo" sx={{ p: { xs: 1.5, sm: 2.5 } }}>
    {esCelular ? (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <OrdenMovil
          opciones={[
            { clave: "rentabilidad", titulo: "Rentabilidad" },
            { clave: "margen", titulo: "% Margen" },
            { clave: "cantidad", titulo: "Cantidad" },
            { clave: "venta", titulo: "Venta prom." },
            { clave: "costo", titulo: "Costo prom." },
            { clave: "producto", titulo: "Producto" },
          ]}
          clave={orden.orden?.clave ?? ""}
          direccion={orden.orden?.direccion ?? "desc"}
          onCambiar={(clave, direccion) => orden.setOrden({ clave, direccion })}
        />
        <TarjetasMovil
          filas={orden.ordenadas.map((item) => ({
            clave: item.Codigo_Producto,
            titulo: item.Nombre_Producto,
            meta: item.Codigo_Producto,
            principales: [
              {
                titulo: "Rentab.",
                valor: (
                  <Box component="span" sx={{ color: item.Rentabilidad_Total < 0 ? "#b42318" : undefined }}>
                    {formatoPesos(item.Rentabilidad_Total)}
                  </Box>
                ),
              },
              { titulo: "Margen", valor: <ChipMargen valor={item.Margen_Porcentaje} /> },
              { titulo: "Cant.", valor: (item.Cantidad_Vendida ?? 0).toLocaleString("es-CL") },
            ],
            detalle: [
              { titulo: "Venta prom.", valor: formatoPesos(item.Precio_Venta_Promedio) },
              { titulo: "Costo prom.", valor: formatoPesos(item.Costo_Promedio) },
            ],
          }))}
        />
      </Box>
    ) : (
    <Box sx={{ maxHeight: 400, overflowY: "auto", overflowX: "hidden", mx: -2.5 }}>
      <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[36, 10, 14, 14, 14, 12]} />
        <TableHead>
          <TableRow>
            <CeldaOrden clave="producto" orden={orden.orden} onOrdenar={orden.ordenarPor} sx={{ pl: 2.5 }}>Producto</CeldaOrden>
            <CeldaOrden clave="cantidad" orden={orden.orden} onOrdenar={orden.ordenarPor} align="right">Cantidad</CeldaOrden>
            <CeldaOrden clave="venta" orden={orden.orden} onOrdenar={orden.ordenarPor} align="right">Venta prom.</CeldaOrden>
            <CeldaOrden clave="costo" orden={orden.orden} onOrdenar={orden.ordenarPor} align="right">Costo prom.</CeldaOrden>
            <CeldaOrden clave="rentabilidad" orden={orden.orden} onOrdenar={orden.ordenarPor} align="right">Rentabilidad</CeldaOrden>
            <CeldaOrden clave="margen" orden={orden.orden} onOrdenar={orden.ordenarPor} align="right" sx={{ pr: 2.5 }}>% Margen</CeldaOrden>
          </TableRow>
        </TableHead>
        <TableBody>
          {orden.ordenadas.map((item) => (
            <TableRow key={item.Codigo_Producto}>
              <TableCell sx={{ pl: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Avatar variant="rounded" sx={{ width: 26, height: 26, bgcolor: "#fef3f2", color: "#b42318", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {item.Nombre_Producto?.charAt(0)}
                  </Avatar>
                  <TextoCelda texto={item.Nombre_Producto} secundario={item.Codigo_Producto} />
                </Box>
              </TableCell>
              <TableCell align="right">{(item.Cantidad_Vendida ?? 0).toLocaleString("es-CL")}</TableCell>
              <TableCell align="right">{formatoPesos(item.Precio_Venta_Promedio)}</TableCell>
              <TableCell align="right">{formatoPesos(item.Costo_Promedio)}</TableCell>
              <TableCell align="right" sx={{ color: item.Rentabilidad_Total < 0 ? "#b42318 !important" : undefined, fontWeight: 600 }}>
                {formatoPesos(item.Rentabilidad_Total)}
              </TableCell>
              <TableCell align="right" sx={{ pr: 2.5 }}>
                <ChipMargen valor={item.Margen_Porcentaje} />
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

export default TopRentabilidadMinima;
