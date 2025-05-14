"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // ✅ Importar para leer proveedor desde la URL
import { Grid, Paper, Typography, CircularProgress, Box, Stack } from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";


interface QuiebresPorCategoriaProps {
  onCategoriaClick: (id: string) => void;
  searchTerm: string;
  selectedProveedor?: string
}

const QuiebresPorCategoria: React.FC<QuiebresPorCategoriaProps> = ({ 
  onCategoriaClick, 
  searchTerm 
}) => {
  const searchParams = useSearchParams(); // ✅ Obtener parámetros de la URL
  const selectedProveedor = searchParams.get("proveedor") || ""; // ✅ Obtener proveedor desde la URL

  const [categorias, setCategorias] = useState<{ id: string; categoria: string; subcategorias_en_quiebre: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);

      try {
        // ✅ Construir la URL con el proveedor si está definido
        const url = new URL(`${BACKEND_URL}/api/categorias`);
        if (selectedProveedor) {
          url.searchParams.append("proveedor", selectedProveedor);
        }

        const response = await fetchWithToken(url.toString());
        if (!response) return; // 🔐 Redirige si el token es inválido
        
        const data = await response.json();
        

        const categoriasFormateadas: { id: string; categoria: string; subcategorias_en_quiebre: number }[] = data.map((item: any) => ({
          id: item.Codigo,
          categoria: item.categoria,
          subcategorias_en_quiebre: item.subcategorias_en_quiebre || 0,
        }));

        // ✅ Filtrar SOLO categorías con quiebre (subcategorias_en_quiebre > 0)
        const categoriasConQuiebre = categoriasFormateadas.filter(
          (categoria) => categoria.subcategorias_en_quiebre > 0
        );

        setCategorias(categoriasConQuiebre);
      } catch (error) {
        console.error("❌ Error al obtener categorías:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, [selectedProveedor]); // ✅ Se ejecuta cada vez que cambia el proveedor

  if (loading) {
    return <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />;
  }

  // 🔹 Función para eliminar tildes y caracteres especiales
  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // 🔹 Filtrar categorías en tiempo real con la búsqueda
  const filteredCategorias = categorias.filter((categoria) =>
    categoria.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Grid container spacing={2} justifyContent="center">
      {filteredCategorias.length > 0 ? (
        filteredCategorias.map((categoria) => {
          const imageName = removeAccents(categoria.categoria)
            .toLowerCase()
            .replace(/\s+/g, "_") // Espacios -> "_"
            .replace(/[^a-z0-9_.]/g, ""); // Eliminar caracteres especiales

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={categoria.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "0.3s",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)" },
                }}
                onClick={() => onCategoriaClick(categoria.id)}
              >
                <Box
                  component="img"
                  src={`/images/categorias/${imageName}.png`}
                  alt={categoria.categoria}
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: "8px",
                    backgroundColor: "#f5f5f5",
                    marginRight: 2,
                  }}
                  onError={(e) => (e.currentTarget.src = "/images/categorias/default.png")}
                />

                <Stack>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    {categoria.categoria}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Subcategorías en quiebre:{" "}
                    <strong style={{ color: categoria.subcategorias_en_quiebre > 0 ? "#d32f2f" : "#388e3c" }}>
                      {categoria.subcategorias_en_quiebre}
                    </strong>
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          );
        })
      ) : (
        <Typography sx={{ textAlign: "center", mt: 2, fontWeight: "bold", color: "gray" }}>
          No se encontraron categorías con quiebre.
        </Typography>
      )}
    </Grid>
  );
};

export default QuiebresPorCategoria;
