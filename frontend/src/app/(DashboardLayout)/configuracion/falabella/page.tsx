"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { IconInfoCircle, IconStarFilled } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";
import { tarjetaSx, tinta } from "../../utilities/ventas/components/estilo";
import { Etiqueta } from "../../utilities/ventas/mercado-libre/components/TablaInforme";
import { Aviso, nombreMes } from "../../utilities/categorias/mercado-libre/components/comun";

interface Mes {
  mes: string;
  /** Nota cargada a mano; null si el mes usa la de defecto. */
  cargada: number | null;
  /** Nota con que se calcula el despacho de ese mes. */
  nota: number;
  origen: "cargada" | "por_defecto" | "factura";
  ajuste: number;
  actualizadoPor: string | null;
  actualizadoEn: string | null;
}
interface Respuesta {
  porDefecto: number;
  notasValidas: number[];
  meses: Mes[];
}

const API = `${BACKEND_URL}/api/falabella/nota-vendedor`;
const ORIGEN: Record<Mes["origen"], { texto: string; color: string; fondo: string }> = {
  cargada: { texto: "Cargada", color: "#067647", fondo: "#ecfdf3" },
  por_defecto: { texto: "Por defecto", color: "#475467", fondo: "#f2f4f7" },
  factura: { texto: "Estimada con la factura", color: "#b54708", fondo: "#fffaeb" },
};

const Estrellas = ({ nota }: { nota: number }) => (
  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, color: "#f59e0b" }}>
    {Array.from({ length: nota }, (_, i) => (
      <IconStarFilled key={i} size={14} />
    ))}
    <Box component="span" sx={{ ml: 0.5, color: tinta.primaria, fontWeight: 700, fontSize: 13 }}>{nota} de 5</Box>
  </Box>
);

/** Ajustes: nota del vendedor en Falabella por mes, con la que se calcula el despacho de los informes. */
export default function NotaFalabella() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await apiJson<Respuesta>(API));
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo cargar la nota de Falabella.");
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async (mes: string, nota: number | null) => {
    setGuardando(mes);
    try {
      const r = await apiJson<Respuesta>(`${API}/${mes}`, nota == null ? { method: "DELETE" } : { method: "PUT", body: JSON.stringify({ nota }) });
      setDatos(r);
      notifySuccess(nota == null ? `${nombreMes(mes)}: vuelve a la nota por defecto.` : `${nombreMes(mes)}: nota ${nota} guardada.`);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo guardar. Intenta nuevamente.");
    } finally {
      setGuardando(null);
    }
  };

  const celda = { fontSize: 13, py: 1.25, borderColor: tinta.borde } as const;
  const cabecera = { ...celda, fontSize: 11, fontWeight: 700, color: tinta.secundaria, textTransform: "uppercase", letterSpacing: 0.3 } as const;

  return (
    <PageContainer title="Nota de Falabella" description="Nota del vendedor en Falabella por mes, con la que se calcula el despacho de los informes">
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tinta.primaria, mb: 0.5 }}>Nota del vendedor en Falabella</Typography>
        <Typography sx={{ fontSize: 13.5, color: tinta.secundaria, mb: 2 }}>
          Falabella cobra el despacho según las estrellas del vendedor (programa f.plus+). Aquí se carga la nota de cada mes; los informes de Falabella calculan el despacho de cada orden con la nota de su mes.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Aviso tono="neutro" icono={<IconInfoCircle size={16} />}>
            Un mes sin nota cargada se calcula con {datos?.porDefecto ?? 5} estrellas. Falabella no entrega la nota por sus sistemas: se ve en Seller Center y en la columna «Opscore» del reporte de transacciones. Al guardar, los informes se recalculan de inmediato.
          </Aviso>
        </Box>
        <Box sx={{ ...tarjetaSx, p: 0, overflow: "hidden" }}>
          {cargando ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...cabecera, pl: 2.5 }}>Mes</TableCell>
                  <TableCell sx={cabecera}>Nota usada en los informes</TableCell>
                  <TableCell sx={cabecera}>Origen</TableCell>
                  <TableCell sx={cabecera}>Cargar nota</TableCell>
                  <TableCell sx={cabecera} />
                </TableRow>
              </TableHead>
              <TableBody>
                {(datos?.meses ?? []).map((m) => (
                  <TableRow key={m.mes}>
                    <TableCell sx={{ ...celda, pl: 2.5, fontWeight: 700, textTransform: "capitalize" }}>{nombreMes(m.mes)}</TableCell>
                    <TableCell sx={celda}>
                      <Estrellas nota={m.nota} />
                      {m.origen === "factura" ? (
                        <Box sx={{ fontSize: 11.5, color: tinta.secundaria }}>ajustada por {m.ajuste.toLocaleString("es-CL")} según lo que facturó Falabella</Box>
                      ) : null}
                    </TableCell>
                    <TableCell sx={celda}>
                      <Etiqueta {...ORIGEN[m.origen]} />
                      {m.actualizadoEn ? <Box sx={{ fontSize: 11, color: tinta.tenue, mt: 0.25 }}>{m.actualizadoEn.slice(0, 10).split("-").reverse().join("/")}</Box> : null}
                    </TableCell>
                    <TableCell sx={celda}>
                      <Select
                        size="small"
                        displayEmpty
                        disabled={guardando === m.mes}
                        value={m.cargada ?? ""}
                        onChange={(e) => e.target.value !== "" && guardar(m.mes, Number(e.target.value))}
                        sx={{ minWidth: 150, fontSize: 13 }}
                      >
                        <MenuItem value="" disabled>
                          Sin cargar
                        </MenuItem>
                        {(datos?.notasValidas ?? [5, 4, 3, 2])
                          .slice()
                          .sort((a, b) => b - a)
                          .map((nota) => (
                            <MenuItem key={nota} value={nota}>
                              {nota} estrellas
                            </MenuItem>
                          ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={celda} align="right">
                      {m.cargada != null ? (
                        <Button size="small" disabled={guardando === m.mes} onClick={() => guardar(m.mes, null)} sx={{ textTransform: "none", fontSize: 12.5 }}>
                          Quitar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
