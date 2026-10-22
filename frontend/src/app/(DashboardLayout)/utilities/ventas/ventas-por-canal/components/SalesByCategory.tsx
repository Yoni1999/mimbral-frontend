"use client";

import React, { useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import ListaBarras from "../../components/ListaBarras";
import { ChipVariacion, Panel, cifraSx, formatoMonto, formatoPesos, tinta } from "../../components/estilo";

interface CategoriaVentas {
  Categoria: string;
  Ventas_Actual: number;
  Ventas_Anterior?: number;
  PorcentajeCambio?: number;
}

interface Props {
  data: CategoriaVentas[];
  cargando?: boolean;
}

const ITEMS_PER_PAGE = 10;

/** Venta por categoría en el canal, de 10 en 10, con su variación contra el
 *  período anterior. */
const VentasPorCategoriaChart: React.FC<Props> = ({ data, cargando = false }) => {
  const safeData = (Array.isArray(data) ? data : [])
    .map((item) => ({ ...item, Ventas_Actual: Number(item.Ventas_Actual) || 0 }))
    .filter((item) => item.Ventas_Actual > 0)
    .sort((a, b) => b.Ventas_Actual - a.Ventas_Actual);

  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(safeData.length / ITEMS_PER_PAGE));
  const pagina = Math.min(page, totalPages - 1);
  const paginatedData = safeData.slice(pagina * ITEMS_PER_PAGE, (pagina + 1) * ITEMS_PER_PAGE);

  return (
    <Panel
      titulo="Ventas por categoría"
      descripcion={`${safeData.length} categorías con venta`}
      accion={
        !cargando && totalPages > 1 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, ...cifraSx }}>
              {pagina + 1} / {totalPages}
            </Typography>
            <IconButton size="small" aria-label="Página anterior" disabled={pagina === 0} onClick={() => setPage(pagina - 1)}>
              <IconChevronLeft size={18} />
            </IconButton>
            <IconButton size="small" aria-label="Página siguiente" disabled={pagina >= totalPages - 1} onClick={() => setPage(pagina + 1)}>
              <IconChevronRight size={18} />
            </IconButton>
          </Box>
        ) : undefined
      }
    >
      <ListaBarras
        cargando={cargando}
        filasCargando={10}
        items={paginatedData.map((c) => ({
          clave: c.Categoria,
          etiqueta: c.Categoria,
          valor: c.Ventas_Actual,
          texto: formatoMonto(c.Ventas_Actual),
          detalle: c.PorcentajeCambio != null ? <ChipVariacion valor={c.PorcentajeCambio} /> : undefined,
          tooltip:
            c.Ventas_Anterior != null
              ? `${c.Categoria}: ${formatoPesos(c.Ventas_Actual)} · período anterior ${formatoPesos(c.Ventas_Anterior)}`
              : `${c.Categoria}: ${formatoPesos(c.Ventas_Actual)}`,
        }))}
      />
    </Panel>
  );
};

export default VentasPorCategoriaChart;
