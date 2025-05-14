"use client";

import React from "react";
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface Filters {
  vendedorEmpresa: string;
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: string;
  canal: string;
}

interface HeaderVendedorProps {
  filtros: Filters;
  setFiltros: React.Dispatch<React.SetStateAction<Filters>>;
  onAplicar: () => void;
}

const HeaderVendedor: React.FC<HeaderVendedorProps> = ({
  filtros,
  setFiltros,
  onAplicar,
}) => {
  const [vendedoresDisponibles, setVendedoresDisponibles] = React.useState<any[]>([]);
  const [vendedorSeleccionado, setVendedorSeleccionado] = React.useState<{
    nombre: string;
    memo: string;
    imagen: string;
  } | null>(null);

  const [openDialog, setOpenDialog] = React.useState(false);
  const [showCanalWarning, setShowCanalWarning] = React.useState(false);
  const [showVendedorModal, setShowVendedorModal] = React.useState(false);

  React.useEffect(() => {
    if (!filtros.canal) {
      setShowCanalWarning(true);
    }
  }, []);

  const handleChange = (key: keyof Filters, value: string) => {
    setFiltros((prev) => {
      let nuevoEstado = { ...prev, [key]: value };

      if (key === "periodo") {
        nuevoEstado.fechaInicio = "";
        nuevoEstado.fechaFin = "";
      }

      if (key === "fechaInicio" || key === "fechaFin") {
        nuevoEstado.periodo = "";
      }

      if (key === "canal") {
        const url = `${BACKEND_URL}/api/oc/obvc?canal=${value}`;
        fetchWithToken(url)
          .then((res) => res?.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setVendedoresDisponibles(data);
              setShowVendedorModal(true);
            } else {
              setVendedoresDisponibles([]);
            }
          })
          .catch(() => setVendedoresDisponibles([]));

        nuevoEstado.vendedorEmpresa = "";
        setVendedorSeleccionado(null);
      }

      return nuevoEstado;
    });
  };

  React.useEffect(() => {
    if (!filtros.vendedorEmpresa || !Array.isArray(vendedoresDisponibles)) {
      setVendedorSeleccionado(null);
      return;
    }

    const vendedor = vendedoresDisponibles.find(
      (v) => v.SlpCode === filtros.vendedorEmpresa
    );

    if (vendedor) {
      setVendedorSeleccionado({
        nombre: vendedor.SlpName,
        memo: vendedor.Memo,
        imagen: vendedor.U_Imagen,
      });
    } else {
      setVendedorSeleccionado(null);
    }
  }, [filtros.vendedorEmpresa, vendedoresDisponibles]);

  const handleClear = () => {
    setFiltros({
      vendedorEmpresa: "",
      temporada: "",
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      modoComparacion: "",
      canal: "",
    });
    setVendedorSeleccionado(null);
    setVendedoresDisponibles([]);
  };

  return (
    <>
      {/* Modal selección de canal */}
      <Dialog open={showCanalWarning}>
        <Box p={3} textAlign="center" minWidth={360}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            ¡Para Analizar un vendedor primero debes elegir su canal de ventas!
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {[
              { canal: "chorrillo", label: "Chorrillo", img: "https://mimbralb2c.vtexassets.com/assets/vtex.file-manager-graphql/images/e9a60107-d732-4cc3-a62f-d5fe5679b440___b7a7fd376ceb91d394f43267c7936901.jpg" },
              { canal: "empresas", label: "Empresas", img: "https://cdn-icons-png.flaticon.com/512/3135/3135695.png" },
              { canal: "balmaceda", label: "Balmaceda", img: "https://mimbralb2c.vtexassets.com/assets/vtex.file-manager-graphql/images/8862c350-c93b-4af7-9ee7-c5f56bb98b22___91d6e40eb7d601487470b5aa6d0cb3da.jpg" },
            ].map(({ canal, label, img }) => (
              <Grid item xs={12} sm={4} key={canal}>
                <Box
                  onClick={() => {
                    handleChange("canal", canal);
                    setShowCanalWarning(false);
                  }}
                  sx={{
                    border: "2px solid #ccc",
                    borderRadius: 2,
                    p: 1,
                    cursor: "pointer",
                    transition: "0.3s",
                    "&:hover": { borderColor: "#284270", boxShadow: 3 },
                  }}
                >
                  <img
                    src={img}
                    alt={label}
                    style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }}
                  />
                  <Typography mt={1} fontWeight={600}>{label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Typography variant="body2" color="text.secondary" mt={3}>
            Esta selección es necesaria para continuar.
          </Typography>
        </Box>
      </Dialog>

      {/* Modal selección de vendedor */}
      <Dialog open={showVendedorModal} onClose={() => setShowVendedorModal(false)}>
        <Box p={3}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Selecciona un vendedor asociado al canal
          </Typography>
          <Grid container spacing={2}>
            {vendedoresDisponibles.map((vendedor) => (
              <Grid item xs={12} sm={6} md={4} key={vendedor.SlpCode}>
                <Box
                  onClick={() => {
                    handleChange("vendedorEmpresa", vendedor.SlpCode);
                    setShowVendedorModal(false);
                  }}
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <img
                    src={vendedor.U_Imagen || "https://res.cloudinary.com/dhzahos7u/image/upload/v1747075685/sin_imagen_hz1c4d.jpg"}
                    alt={vendedor.SlpName}
                    style={{
                      width: 66,
                      height: 66,
                      objectFit: "cover",
                      borderRadius: "50%",
                      marginBottom: 8,
                    }}
                  />
                  <Typography fontWeight={600}>{vendedor.SlpName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vendedor.Memo}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Dialog>

      {/* 🔸 Modal imagen ampliada */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        <Box
          p={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{ backgroundColor: "#fff" }}
        >
          <img
            src={
              vendedorSeleccionado?.imagen ||
              "https://res.cloudinary.com/dhzahos7u/image/upload/v1747075685/sin_imagen_hz1c4d.jpg"
            }
            alt="Imagen ampliada"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              borderRadius: 8,
              boxShadow: "0 0 12px rgba(0,0,0,0.3)",
            }}
          />
        </Box>
      </Dialog>

      {/* 🔸 Header con filtros */}
      <Box
        sx={{
          mb: 2,
          px: 2,
          py: 2,
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          borderRadius: 1,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <img
                src={
                  vendedorSeleccionado?.imagen ||
                  "https://res.cloudinary.com/dhzahos7u/image/upload/v1747075685/sin_imagen_hz1c4d.jpg"
                }
                alt="Foto del vendedor"
                onClick={() => setOpenDialog(true)}
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                }}
              />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {vendedorSeleccionado?.nombre || "Todos los vendedores"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vendedorSeleccionado?.memo || "Vendedores"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Filtros */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={1.5} justifyContent="flex-end">
              {/* Canal */}
              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Canal</InputLabel>
                  <Select
                    value={filtros.canal || ""}
                    onChange={(e) => handleChange("canal", e.target.value)}
                    label="Canal"
                    sx={{ fontSize: "0.75rem", height: 36 }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="chorrillo">Chorrillo</MenuItem>
                    <MenuItem value="empresas">Empresas</MenuItem>
                    <MenuItem value="balmaceda">Balmaceda</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Vendedor */}
              <Grid item xs={6} sm={3} md={1.8}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vendedor</InputLabel>
                  <Select
                    value={filtros.vendedorEmpresa}
                    onChange={(e) =>
                      handleChange("vendedorEmpresa", e.target.value)
                    }
                    label="Vendedor"
                    sx={{ fontSize: "0.75rem", height: 36 }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Array.isArray(vendedoresDisponibles) &&
                      vendedoresDisponibles.map((vendedor) => (
                        <MenuItem
                          key={vendedor.SlpCode}
                          value={vendedor.SlpCode}
                        >
                          {vendedor.SlpName}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Temporada */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Temporada</InputLabel>
                  <Select
                    value={filtros.temporada}
                    onChange={(e) =>
                      handleChange("temporada", e.target.value)
                    }
                    label="Temporada"
                    sx={{ fontSize: "0.75rem", height: 36 }}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="verano">Verano</MenuItem>
                    <MenuItem value="invierno">Invierno</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Período */}
              <Grid item xs={6} sm={3} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={filtros.periodo}
                    onChange={(e) => handleChange("periodo", e.target.value)}
                    label="Período"
                    sx={{ fontSize: "0.75rem", height: 36 }}
                  >
                    <MenuItem value="1D">Hoy</MenuItem>
                    <MenuItem value="7D">Últimos 7 días</MenuItem>
                    <MenuItem value="14D">Últimos 14 días</MenuItem>
                    <MenuItem value="1M">Mes actual</MenuItem>
                    <MenuItem value="3M">3 meses</MenuItem>
                    <MenuItem value="6M">6 meses</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fecha Inicio */}
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label="Inicio"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={filtros.fechaInicio}
                  onChange={(e) =>
                    handleChange("fechaInicio", e.target.value)
                  }
                  inputProps={{ style: { fontSize: "0.75rem", height: 16 } }}
                />
              </Grid>

              {/* Fecha Fin */}
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label="Fin"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={filtros.fechaFin}
                  onChange={(e) =>
                    handleChange("fechaFin", e.target.value)
                  }
                  inputProps={{ style: { fontSize: "0.75rem", height: 16 } }}
                />
              </Grid>
              {/* Modo Comparación */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Comparar con</InputLabel>
                  <Select
                    value={filtros.modoComparacion}
                    onChange={(e) => handleChange("modoComparacion", e.target.value)}
                    label="Comparar con"
                    sx={{ fontSize: "0.75rem", height: 36 }}
                  >
                    <MenuItem value="PeriodoAnterior">Periodo anterior</MenuItem>
                    <MenuItem value="MismoPeriodoAnoAnterior">Mismo período año anterior</MenuItem>
                  </Select>
                </FormControl>
              </Grid>


              <Grid item xs={6} sm={3} md={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  fullWidth
                  onClick={handleClear}
                  startIcon={<DeleteOutlineIcon />}
                >
                  Limpiar
                </Button>
              </Grid>

            </Grid>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default HeaderVendedor;
