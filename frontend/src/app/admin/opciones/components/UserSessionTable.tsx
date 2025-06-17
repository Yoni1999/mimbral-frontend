'use client';
import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TableSortLabel, Typography
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";

interface SessionData {
  nombre: string;
  minutos: number;
  sesiones: number;
}

const formatTiempo = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}min`;
};

const UserSessionTable = () => {
  const [data, setData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState<keyof SessionData>("minutos");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/admin/session-stats`);
        if (!res?.ok) throw new Error("Error al obtener sesiones");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("❌ Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSort = (field: keyof SessionData) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
  };

  const sortedData = [...data].sort((a, b) => {
    if (orderBy === "nombre") {
      const result = a.nombre.localeCompare(b.nombre);
      return order === "asc" ? result : -result;
    } else {
      const valA = a[orderBy] as number;
      const valB = b[orderBy] as number;
      return order === "asc" ? valA - valB : valB - valA;
    }
  });

  if (loading) return <Typography>Cargando sesiones...</Typography>;

  return (
    <DashboardCard title="Resumen de Sesiones" sx={{ maxWidth: 500, mt: 4 }}>
      <TableContainer
        component={Paper}
        sx={{
          height: 380,
          overflowY: "auto",
          backgroundColor: "transparent", 
          boxShadow: "none",  
        }}
      >
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "nombre"}
                  direction={orderBy === "nombre" ? order : "asc"}
                  onClick={() => handleSort("nombre")}
                >
                  Usuario
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "minutos"}
                  direction={orderBy === "minutos" ? order : "asc"}
                  onClick={() => handleSort("minutos")}
                >
                  Tiempo Total
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "sesiones"}
                  direction={orderBy === "sesiones" ? order : "asc"}
                  onClick={() => handleSort("sesiones")}
                >
                  Conexiones
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((user, i) => (
              <TableRow key={i}>
                <TableCell>{user.nombre}</TableCell>
                <TableCell align="right">{formatTiempo(user.minutos)}</TableCell>
                <TableCell align="right">{user.sesiones}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DashboardCard>
  );
};

export default UserSessionTable;
