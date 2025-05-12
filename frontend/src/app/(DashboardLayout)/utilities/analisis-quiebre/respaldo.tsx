'use client';

import { useState } from "react";
import {
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import moment from "moment";

// Definir la interfaz para los datos
interface QuiebreData {
  ItemCode: string;
  fecha_inicio_quiebre: string;
  fecha_fin_quiebre?: string;
  dias: number;
}

const AnalisisQuiebre = () => {
  const [itemCodes, setItemCodes] = useState("");
  const [data, setData] = useState<QuiebreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData([]);
    try {
      const response = await fetch("http://localhost:3001/api/quiebres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemCodes: itemCodes.split(",").map(code => code.trim()) }),
      });
      if (!response.ok) throw new Error("Error en la API");
      const result: QuiebreData[] = await response.json();
      setData(result);
    } catch (err) {
      setError("Error al obtener los datos. Verifica la API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Análisis de Quiebre" description="Consulta de quiebres por producto">
      <DashboardCard title="Consulta de Quiebres">
        <Grid container spacing={2}>
          {/* Campo de Entrada */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ingrese códigos de productos separados por comas"
              variant="outlined"
              value={itemCodes}
              onChange={(e) => setItemCodes(e.target.value)}
            />
          </Grid>

          {/* Botón de Consulta */}
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={fetchData} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Consultar"}
            </Button>
          </Grid>

          {/* Mensaje de Error */}
          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}

          {/* Tabla de Resultados */}
          {data.length > 0 && (
            <Grid item xs={12}>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#1976d2" }}>
                      <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>SKU</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Inicio Del Quiebre</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Fin Del Quiebre</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Días Quiebre</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow key={index} sx={{ backgroundColor: index % 2 ? "#f9f9f9" : "white" }}>
                        <TableCell sx={{ textAlign: "center" }}>{item.ItemCode}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {moment.utc(item.fecha_inicio_quiebre).local().format("YYYY-MM-DD HH:mm")}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center", fontWeight: item.fecha_fin_quiebre ? "normal" : "bold", color: item.fecha_fin_quiebre ? "inherit" : "red" }}>
                          {item.fecha_fin_quiebre ? moment.utc(item.fecha_fin_quiebre).local().format("YYYY-MM-DD HH:mm") : "En quiebre"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>{item.dias}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </DashboardCard>
    </PageContainer>
  );
};

export default AnalisisQuiebre;