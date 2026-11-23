"use client";
// Listas de metas y periodos en celular: la DataGrid con 7–10 columnas no se
// lee bajo 600 px (columnas de 30 px con "Ve…"), así que cada fila pasa a ser
// una tarjeta (TarjetasMovil) con la misma paginación del servidor.
import { Box, Button, Typography } from "@mui/material";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { TarjetasMovil, type TarjetaMovil } from "@/app/(DashboardLayout)/utilities/ventas/components/movil";

export default function TarjetasPaginadas({
  filas,
  cargando,
  total,
  paginationModel,
  onPaginationModelChange,
  vacio,
}: {
  filas: TarjetaMovil[];
  cargando: boolean;
  total: number;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange: (m: { page: number; pageSize: number }) => void;
  vacio?: string;
}) {
  const { page, pageSize } = paginationModel;
  const desde = total === 0 ? 0 : page * pageSize + 1;
  const hasta = Math.min(total, (page + 1) * pageSize);
  const ultima = Math.max(0, Math.ceil(total / pageSize) - 1);
  return (
    <Box>
      <TarjetasMovil filas={filas} cargando={cargando} vacio={vacio} />
      {total > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 1.5 }}>
          <Button
            variant="outlined"
            disabled={page === 0 || cargando}
            onClick={() => onPaginationModelChange({ page: page - 1, pageSize })}
            startIcon={<IconChevronLeft size={16} />}
            sx={{ textTransform: "none", borderRadius: "10px", height: 40 }}
          >
            Anterior
          </Button>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {desde}–{hasta} de {total}
          </Typography>
          <Button
            variant="outlined"
            disabled={page >= ultima || cargando}
            onClick={() => onPaginationModelChange({ page: page + 1, pageSize })}
            endIcon={<IconChevronRight size={16} />}
            sx={{ textTransform: "none", borderRadius: "10px", height: 40 }}
          >
            Siguiente
          </Button>
        </Box>
      )}
    </Box>
  );
}
