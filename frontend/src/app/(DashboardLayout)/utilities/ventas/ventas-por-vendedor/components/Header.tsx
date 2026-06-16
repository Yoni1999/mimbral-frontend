"use client";

import React from "react";
import {
  Box,
  Grid,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Dialog,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import DateRangeFilter, {
  DateRangeValue,
} from "../../components/DateRangeFilter";

export interface Filters {
  vendedorEmpresa: string;
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

      if (key === "canal") {
        const url = `${BACKEND_URL}/api/oc/obvc?canal=${value}`;
        apiJson(url)
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

  const handleDateChange = (range: DateRangeValue | null) => {
    setFiltros((prev) => ({
      ...prev,
      fechaInicio: range?.start || "",
      fechaFin: range?.end || "",
    }));
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
      fechaInicio: "",
      fechaFin: "",
      modoComparacion: "",
      canal: "",
    });
    setVendedorSeleccionado(null);
    setVendedoresDisponibles([]);
  };

  const selectSx = {
    mt: 0.6,
    height: 42,
    bgcolor: "#fff",
    borderRadius: 1.75,
    fontSize: "0.94rem",
    color: "#334155",
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      py: 0,
      px: 1.5,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#cbd5e1",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#94a3b8",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2563eb",
    },
    "& .MuiSelect-icon": {
      color: "#64748b",
    },
  } as const;

  const fieldLabelSx = {
    color: "#475569",
    fontWeight: 700,
    ml: 0.2,
    letterSpacing: 0.2,
  } as const;

  return (
    <>
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

          <Grid item xs={12} md={9}>
            <Grid container spacing={1.5} justifyContent="flex-end">
              <Grid item xs={12} sm={4} md={2.4}>
                <FormControl fullWidth size="small">
                  <Typography variant="caption" sx={fieldLabelSx}>
                    Canal
                  </Typography>
                  <Select
                    value={filtros.canal || ""}
                    onChange={(e) => handleChange("canal", e.target.value)}
                    displayEmpty
                    sx={selectSx}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    <MenuItem value="chorrillo">Chorrillo</MenuItem>
                    <MenuItem value="empresas">Empresas</MenuItem>
                    <MenuItem value="balmaceda">Balmaceda</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={5} md={2.4}>
                <FormControl fullWidth size="small">
                  <Typography variant="caption" sx={fieldLabelSx}>
                    Vendedor
                  </Typography>
                  <Select
                    value={filtros.vendedorEmpresa}
                    onChange={(e) =>
                      handleChange("vendedorEmpresa", e.target.value)
                    }
                    displayEmpty
                    sx={selectSx}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
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

              <Grid item xs={12} sm={4} md={2.4}>
                <DateRangeFilter
                  value={
                    filtros.fechaInicio && filtros.fechaFin
                      ? { start: filtros.fechaInicio, end: filtros.fechaFin }
                      : null
                  }
                  onChange={handleDateChange}
                  label="Rango de Fecha"
                />
              </Grid>

              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <Typography variant="caption" sx={fieldLabelSx}>
                    Comparar con
                  </Typography>
                  <Select
                    value={filtros.modoComparacion}
                    onChange={(e) =>
                      handleChange("modoComparacion", e.target.value)
                    }
                    displayEmpty
                    sx={selectSx}
                  >
                    <MenuItem value="">
                      <em>Seleccionar</em>
                    </MenuItem>
                    <MenuItem value="PeriodoAnterior">Periodo anterior</MenuItem>
                    <MenuItem value="MismoPeriodoAnoAnterior">
                      Mismo período año anterior
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={1.5}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  fullWidth
                  onClick={handleClear}
                  startIcon={<DeleteOutlineIcon />}
                  sx={{ height: 42, borderRadius: 1.75, textTransform: "none" }}
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

