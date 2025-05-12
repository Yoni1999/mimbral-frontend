"use client";
import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress, Collapse, IconButton 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // ✅ Icono de tic verde
import QuiebresPorProducto from "./QuiebresPorProducto";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";


interface Props {
  categoriaId: string;
  providerCode: string;
}

const QuiebrePorSubCategoria: React.FC<Props> = ({ categoriaId, providerCode }) => {
  const [subcategorias, setSubcategorias] = useState<{ 
    codigo_subcategoria: string; 
    nombre_subcategoria: string; 
    productos_en_quiebre: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubcategorias = async () => {
      if (!categoriaId) return;
    
      const queryParams = new URLSearchParams();
      if (providerCode) queryParams.set("proveedor", providerCode);
    
      try {
        const apiUrl = `${BACKEND_URL}/api/categorias/quiebres/${categoriaId}?${queryParams.toString()}`;
        console.log("🔍 Fetching Subcategorias:", apiUrl);
    
        const response = await fetchWithToken(apiUrl);
        if (!response) return; // Token inválido o expirado → redirige automáticamente
        
        const data = await response.json();
        setSubcategorias(data);
        
      } catch (error) {
        console.error("❌ Error al obtener subcategorías en quiebre:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategorias();
  }, [categoriaId, providerCode]);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ borderRadius: 3, boxShadow: "0px 4px 12px rgba(0,0,0,0.1)", overflow: "hidden" }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "#1976d2" }}>
            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Código</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Subcategoría</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Productos en Quiebre</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Ver Productos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subcategorias.map((sub) => {
            const quiebreCount = Number(sub.productos_en_quiebre); // 🔹 Convertimos a número

            return (
              <React.Fragment key={sub.codigo_subcategoria}>
                {/* 🔹 Fila de la subcategoría */}
                <TableRow 
                  sx={{ "&:hover": { bgcolor: "#f0f8ff", cursor: "pointer" } }}
                  onClick={() => setSubcategoriaSeleccionada(prev => prev === sub.codigo_subcategoria ? null : sub.codigo_subcategoria)}
                >
                  <TableCell sx={{ textAlign: "center" }}>{sub.codigo_subcategoria}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>{sub.nombre_subcategoria}</TableCell>
                  
                  {/* 🔹 Si productos en quiebre es 0, mostrar ✔️ verde */}
                  <TableCell sx={{ textAlign: "center", fontWeight: "bold" }}>
                    {quiebreCount === 0 ? (
                      <CheckCircleIcon sx={{ color: "green" }} /> // ✅ Icono verde si no hay quiebre
                    ) : (
                      <Typography sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                        {quiebreCount}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center" }}>
                    <IconButton>
                      {subcategoriaSeleccionada === sub.codigo_subcategoria ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* 🔹 Fila desplegable para mostrar `QuiebresPorProducto.tsx` */}
                <TableRow>
                  <TableCell colSpan={4} sx={{ padding: 0 }}>
                    <Collapse in={subcategoriaSeleccionada === sub.codigo_subcategoria} timeout="auto" unmountOnExit>
                      <QuiebresPorProducto subcategoriaId={subcategoriaSeleccionada || ""} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default QuiebrePorSubCategoria;
