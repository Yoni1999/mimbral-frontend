"use client";

import React, { useMemo, useState } from "react";
import { Avatar, Box, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Typography } from "@mui/material";
import { IconAlertTriangle } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { formatearRUTDesdeSAP } from "@/utils/formatearRUTDesdeSAP";
import { BACKEND_URL } from "@/config";
import { BarraParticipacion, Panel, estado, formatoMonto, tablaSx, tinta, Columnas, TextoCelda } from "../../components/estilo";

type Order = "asc" | "desc";
type OrderBy = "cantidad_compras" | "total_comprado" | "ticket_promedio" | "ultima_compra";

interface ClienteFrecuente {
  cardcode: string;
  cardname: string;
  imagen?: string;
  ciudad?: string;
  linea_credito?: number;
  balance?: number;
  cantidad_compras: number;
  total_comprado: number;
  ticket_promedio: number;
  ultima_compra: string;
}

interface ClientesFrecuentesTableProps {
  filters: {
    canal: string;
    fechaInicio: string;
    fechaFin: string;
    vendedor?: number | null;
  };
}

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const ClientesFrecuentesTable: React.FC<ClientesFrecuentesTableProps> = ({ filters }) => {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("total_comprado");

  // La clave es la URL: aunque la página pase un objeto `filters` nuevo en
  // cada render, solo se pide de nuevo cuando cambian los valores.
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const url = `${BACKEND_URL}/api/top10clientes?${query}`;
  const { datos: clientes, cargando } = useCargaDatos<ClienteFrecuente[]>(
    url,
    async (signal) => {
      const raw = await apiJson(url, { signal });
      return (Array.isArray(raw) ? raw : []).map((c: any) => ({
        cardcode: c.CardCode,
        cardname: c.CardName,
        imagen: c.Imagen || "",
        ciudad: c.CITY || "",
        linea_credito: c.CreditLine || 0,
        balance: c.Balance || 0,
        cantidad_compras: c.Cantidad_Compras,
        total_comprado: c.Total_Comprado,
        ticket_promedio: c.Ticket_Promedio,
        ultima_compra: c.Ultima_Compra ? String(c.Ultima_Compra) : "",
      }));
    },
    []
  );

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    return [...clientes].sort((a, b) => {
      if (orderBy === "ultima_compra") {
        const dateA = new Date(a.ultima_compra || 0).getTime();
        const dateB = new Date(b.ultima_compra || 0).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      }
      const valA = Number(a[orderBy] ?? 0);
      const valB = Number(b[orderBy] ?? 0);
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [clientes, order, orderBy]);

  const maxTotal = Math.max(0, ...sortedData.map((c) => c.total_comprado || 0));

  const columna = (key: OrderBy, label: string) => (
    <TableCell align="right" sortDirection={orderBy === key ? order : false}>
      <TableSortLabel active={orderBy === key} direction={orderBy === key ? order : "desc"} onClick={() => handleSort(key)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel titulo="Clientes frecuentes" descripcion="Los 10 clientes que más compraron en el período">
      {cargando ? (
        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={52} />)
      ) : sortedData.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>
          No hay clientes frecuentes en el período seleccionado.
        </Typography>
      ) : (
        <Box sx={{ overflowY: "auto", overflowX: "hidden", mx: -2.5, maxHeight: 520 }}>
          <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[28, 9, 15, 12, 12, 12, 12]} />
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 2.5 }}>Cliente</TableCell>
                {columna("cantidad_compras", "Compras")}
                {columna("total_comprado", "Total comprado")}
                {columna("ticket_promedio", "Ticket promedio")}
                {columna("ultima_compra", "Última compra")}
                <TableCell align="right">Línea de crédito</TableCell>
                <TableCell align="right" sx={{ pr: 2.5 }}>Pendiente de pago</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((cliente) => {
                const excedente =
                  cliente.balance && cliente.linea_credito && cliente.balance > cliente.linea_credito
                    ? cliente.balance - cliente.linea_credito
                    : 0;
                const fecha = cliente.ultima_compra ? new Date(cliente.ultima_compra) : null;
                return (
                  <TableRow key={cliente.cardcode}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Avatar
                          src={cliente.imagen || undefined}
                          alt={cliente.cardname}
                          sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: "#eff4ff", color: tinta.acento, flexShrink: 0 }}
                        >
                          {iniciales(cliente.cardname || "")}
                        </Avatar>
                        <TextoCelda
                          texto={cliente.cardname}
                          secundario={`${formatearRUTDesdeSAP(cliente.cardcode)}${cliente.ciudad ? ` · ${cliente.ciudad}` : ""}`}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{(cliente.cantidad_compras ?? 0).toLocaleString("es-CL")}</TableCell>
                    <TableCell align="right">
                      {formatoMonto(cliente.total_comprado)}
                      <Box sx={{ mt: 0.5 }}>
                        <BarraParticipacion valor={cliente.total_comprado || 0} maximo={maxTotal} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatoMonto(cliente.ticket_promedio)}</TableCell>
                    <TableCell align="right">
                      {fecha && !isNaN(fecha.getTime()) ? fecha.toLocaleDateString("es-CL") : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {cliente.linea_credito ? formatoMonto(cliente.linea_credito) : <Box component="span" sx={{ color: tinta.tenue }}>Sin crédito</Box>}
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }}>
                      {formatoMonto(cliente.balance)}
                      {excedente > 0 && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            ml: 1,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 999,
                            bgcolor: estado.mal.fondo,
                            color: estado.mal.color,
                            fontSize: 11.5,
                            fontWeight: 700,
                          }}
                        >
                          <IconAlertTriangle size={13} />
                          Excede {formatoMonto(excedente)}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Panel>
  );
};

export default ClientesFrecuentesTable;
