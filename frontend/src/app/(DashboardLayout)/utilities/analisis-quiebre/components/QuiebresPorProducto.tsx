"use client";
import { useEffect, useState } from "react";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { useSearchParams } from "next/navigation";
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // ✅ Icono representativo de Excel
import * as XLSX from "xlsx"; // ✅ Importar XLSX para exportar a Excel
import { BACKEND_URL } from "@/config"; // ✅ Importar la URL base del backend

const QuiebresPorProducto = ({ subcategoriaId }: { subcategoriaId: string }) => {
  const searchParams = useSearchParams();
  const proveedor = searchParams.get("proveedor") || "";

  const [productos, setProductos] = useState<{ 
    Codigo_Producto: string; 
    Nombre_Producto: string; 
    SubCategoria: string;
    Estado_Compra: string;
    Stock_Total_Almacenes_1_3_7: number;
  }[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductosEnQuiebre = async () => {
      if (!subcategoriaId) return;

      try {
        const url = proveedor
          ? `${BACKEND_URL}/api/quiebres/subcategorias/quiebres/${subcategoriaId}?proveedor=${proveedor}`
          : `${BACKEND_URL}/api/quiebres/subcategorias/quiebres/${subcategoriaId}`;

          const response = await fetchWithToken(url);
          if (!response) return; // 🔐 Redirige si no hay token o está vencido
          
          const data = await response.json();
          

        const productosOrdenados = data.sort((a: any, b: any) => {
          if (a.Estado_Compra === "Activo" && b.Estado_Compra === "Activo") {
            return a.Stock_Total_Almacenes_1_3_7 - b.Stock_Total_Almacenes_1_3_7;
          }
          if (a.Estado_Compra === "Activo") return -1;
          if (b.Estado_Compra === "Activo") return 1;
          return b.Stock_Total_Almacenes_1_3_7 - a.Stock_Total_Almacenes_1_3_7;
        });

        setProductos(productosOrdenados);
      } catch (error) {
        console.error("❌ Error al obtener productos en quiebre:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductosEnQuiebre();
  }, [subcategoriaId, proveedor]);

  // 🔹 Extraer dinámicamente el nombre de la subcategoría del primer producto
  const subcategoriaNombre = productos.length > 0 ? productos[0].SubCategoria : "Desconocida";

  // 🔹 Función para exportar a Excel con nombre dinámico
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(productos.map(prod => ({
      SKU: prod.Codigo_Producto,
      Producto: prod.Nombre_Producto,
      Subcategoría: prod.SubCategoria,
      Estado_Compra: prod.Estado_Compra,
      "Stock en 1,3,7": prod.Stock_Total_Almacenes_1_3_7
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos en Quiebre");

    // 🔹 Construcción del nombre del archivo con solo la subcategoría
    const fileName = `Productos en quiebre - Subcategoria ${subcategoriaNombre}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto' }} />;
  }

  return (
    <Box sx={{ p: 2, bgcolor: "#fff3e0", borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Productos en Quiebre
        </Typography>

        {/* 🔹 Tooltip para mostrar "Descargar en Excel" */}
        <Tooltip title="Descargar en Excel">
          <IconButton 
            onClick={exportToExcel}
            sx={{ 
              bgcolor: "#28a745", // Verde típico de Excel
              color: "white", 
              "&:hover": { bgcolor: "#218838" } // Efecto hover más oscuro
            }}
          >
            <InsertDriveFileIcon /> {/* ✅ Icono de Excel */}
          </IconButton>
        </Tooltip>
      </Box>

      {productos.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#ff7043" }}>
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>SKU</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Producto</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Subcategoría</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Estado de Compra</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Stock en 1,3,7</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((prod) => (
                <TableRow key={prod.Codigo_Producto}>
                  <TableCell sx={{ textAlign: "center" }}>{prod.Codigo_Producto}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>{prod.Nombre_Producto}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>{prod.SubCategoria}</TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: "bold", color: prod.Estado_Compra === "Activo" ? "green" : "#d32f2f" }}>
                    {prod.Estado_Compra}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: "bold", color: prod.Stock_Total_Almacenes_1_3_7 === 0 ? "#d32f2f" : "black" }}>
                    {prod.Stock_Total_Almacenes_1_3_7}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ textAlign: "center", color: "gray", fontWeight: "bold", py: 2 }}>
          No hay productos en quiebre para esta subcategoría.
        </Typography>
      )}
    </Box>
  );
};

export default QuiebresPorProducto;
