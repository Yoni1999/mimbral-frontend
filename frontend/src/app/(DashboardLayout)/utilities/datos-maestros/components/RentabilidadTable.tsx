import {
    Table, TableHead, TableBody, TableCell, TableContainer, TableRow, Paper, Typography
  } from "@mui/material";
  
  const mockData = [
    { item: "1001", nombre: "Producto A", canal: "Empresas", margen: "34%", costo: "$1.200", contribucion: "$450", precio: "$1.650" },
    { item: "1002", nombre: "Producto B", canal: "Meli", margen: "28%", costo: "$900", contribucion: "$350", precio: "$1.250" },
  ];
  
  export default function RentabilidadTable() {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><strong>ItemCode</strong></TableCell>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell><strong>Canal</strong></TableCell>
              <TableCell align="right"><strong>Margen</strong></TableCell>
              <TableCell align="right"><strong>Costo</strong></TableCell>
              <TableCell align="right"><strong>Contribución</strong></TableCell>
              <TableCell align="right"><strong>Precio Venta</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockData.map((row) => (
              <TableRow key={row.item}>
                <TableCell>{row.item}</TableCell>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.canal}</TableCell>
                <TableCell align="right">{row.margen}</TableCell>
                <TableCell align="right">{row.costo}</TableCell>
                <TableCell align="right">{row.contribucion}</TableCell>
                <TableCell align="right">{row.precio}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  