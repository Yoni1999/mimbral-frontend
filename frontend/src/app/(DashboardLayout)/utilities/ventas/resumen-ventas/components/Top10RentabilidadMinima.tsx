// components/TopRentabilidadMinima.tsx
"use client";

import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { TrendingDown } from "@mui/icons-material";

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
  return (
    <Card elevation={1} sx={{ borderRadius: 3, p: 2, background: "#fff" }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
        <TrendingDown fontSize="medium" color="warning" />
        <Typography
            variant="subtitle1"
            fontWeight="bold"
            ml={1}
            sx={{
            color: "primary.main", // ✅ Usando el color del tema
            fontSize: 14,
            }}
        >
            Top 10 Productos con Menor Rentabilidad
        </Typography>
        </Box>

        <Box sx={{ maxHeight: 310, overflowY: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: 12, py: 0.5 }}>Producto</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>Cantidad</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>Venta Prom.</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>Costo Prom.</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>Rentabilidad</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>% Margen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.slice(0, 10).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ py: 0.5 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: "#ffe5e5",
                          color: "#d32f2f",
                          fontSize: 12,
                        }}
                      >
                        {item.Nombre_Producto?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600} fontSize={12}>
                          {item.Nombre_Producto}
                        </Typography>
                        <Typography variant="caption" fontSize={10} color="text.secondary">
                          {item.Codigo_Producto}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>
                    {item.Cantidad_Vendida}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>
                    ${item.Precio_Venta_Promedio.toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>
                    ${item.Costo_Promedio.toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>
                    ${item.Rentabilidad_Total.toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, py: 0.5 }}>
                    {item.Margen_Porcentaje.toFixed(1).replace(".", ",")}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TopRentabilidadMinima;
