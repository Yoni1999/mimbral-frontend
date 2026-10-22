"use client";
import { Avatar, Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { ChipMargen, formatoPesos, tablaSx, tinta, Panel, Columnas, TextoCelda } from "../../components/estilo";

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

const TopRentabilidadMinima = ({ data }: Props) => (
  <Panel titulo="Top 10 productos menos rentables" descripcion="Los que menos margen dejaron: revisar precio o costo">
    <Box sx={{ maxHeight: 400, overflowY: "auto", overflowX: "hidden", mx: -2.5 }}>
      <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[36, 10, 14, 14, 14, 12]} />
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 2.5 }}>Producto</TableCell>
            <TableCell align="right">Cantidad</TableCell>
            <TableCell align="right">Venta prom.</TableCell>
            <TableCell align="right">Costo prom.</TableCell>
            <TableCell align="right">Rentabilidad</TableCell>
            <TableCell align="right" sx={{ pr: 2.5 }}>% Margen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).slice(0, 10).map((item) => (
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
  </Panel>
);

export default TopRentabilidadMinima;
