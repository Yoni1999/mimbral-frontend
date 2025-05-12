"use client";
import { Box, TextField, MenuItem, Stack } from "@mui/material";

const HeaderFiltrosMetas = ({ filtros, setFiltros }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center" mb={3}>
      <TextField
        select
        label="Canal"
        value={filtros.canal}
        onChange={(e) => setFiltros({ ...filtros, canal: e.target.value })}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="retail">Retail</MenuItem>
        <MenuItem value="online">Online</MenuItem>
        <MenuItem value="b2b">B2B</MenuItem>
      </TextField>

      <TextField
        select
        label="Período"
        value={filtros.periodo}
        onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="38">Perido 38-Marzo-Abril</MenuItem>
        
      </TextField>

      <TextField
        label="Buscar por SKU o nombre"
        value={filtros.busqueda}
        onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
        size="small"
        sx={{ minWidth: 250 }}
      />
    </Stack>
  );
};

export default HeaderFiltrosMetas;
