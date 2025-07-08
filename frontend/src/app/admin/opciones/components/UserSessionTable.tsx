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
  sesiones: number;
  ultimaConexion: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  // Función auxiliar para añadir ceros iniciales si es necesario
  const pad = (num: number) => num < 10 ? '0' + num : num;

  // Nombres de los meses en español
  const monthNames = ["ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
  ];

  // Construimos la cadena de fecha y hora en formato UTC
  return `${pad(day)} ${monthNames[month]} ${year}, ${pad(hours)}:${pad(minutes)}:${pad(seconds)} `;
};

const UserSessionTable = () => {
  const [data, setData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState<keyof SessionData>("ultimaConexion");
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
    } else if (orderBy === "ultimaConexion") {
      const dateA = new Date(a.ultimaConexion).getTime();
      const dateB = new Date(b.ultimaConexion).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    } else {
      const valA = a[orderBy] as number;
      const valB = b[orderBy] as number;
      return order === "asc" ? valA - valB : valB - valA;
    }
  });

  if (loading) return <Typography sx={{ mt: 4 }}>Cargando sesiones...</Typography>;

  return (
    <DashboardCard title="Resumen de Sesiones" sx={{ maxWidth: 500, mt: 0 }}>
      <TableContainer
        component={Paper}
        sx={{
          height: 280,
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
                  active={orderBy === "ultimaConexion"}
                  direction={orderBy === "ultimaConexion" ? order : "asc"}
                  onClick={() => handleSort("ultimaConexion")}
                >
                  Última Conexión
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
                <TableCell align="right">{formatDate(user.ultimaConexion)}</TableCell>
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
