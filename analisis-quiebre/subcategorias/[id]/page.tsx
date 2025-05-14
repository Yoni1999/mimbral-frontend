'use client';
import { useRouter, useParams, useSearchParams } from "next/navigation"; // 🔥 useSearchParams para obtener el proveedor
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import QuiebrePorSubCategoria from '../../components/QuiebrePorSubCategoria';

const SubcategoriasQuiebrePage = () => {
  const router = useRouter();
  const { id } = useParams(); // 🔹 Obtener el ID de la categoría desde la URL
  const searchParams = useSearchParams(); // 🔥 Obtener parámetros de la URL
  const providerCode = searchParams.get("proveedor") || ""; // 🔥 Extraer `proveedor` de la URL

  return (
    <PageContainer title="Subcategorías en Quiebre" description="Lista de subcategorías en quiebre">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Subcategorías en Quiebre
        </Typography>
      </Box>

      {/* 🔹 Botón mejorado de "Volver a Categorías" */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<ArrowBackIcon />}
        sx={{
          mb: 2,
          borderRadius: 3,
          fontWeight: "bold",
          textTransform: "none",
          px: 3,
          boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
          transition: "0.3s",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0px 6px 12px rgba(0,0,0,0.3)",
            backgroundColor: "#1565c0",
          }
        }}
        onClick={() => router.back()}
      >
        Volver a Categorías
      </Button>

      {/* 🔹 Pasar el código del proveedor a `QuiebrePorSubCategoria.tsx` */}
      <QuiebrePorSubCategoria categoriaId={id as string} providerCode={providerCode} />
    </PageContainer>
  );
};

export default SubcategoriasQuiebrePage;
