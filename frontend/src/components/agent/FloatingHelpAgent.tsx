"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Dialog, IconButton, InputBase, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import {
  IconArrowUpRight,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconDownload,
  IconRefresh,
  IconSend,
  IconSparkles,
  IconTable,
  IconX,
} from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import { useEstadoVista } from "@/utils/estadoVista";
import { formatoPesos, formatoPorcentaje, tablaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { descargarExcel } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/comun";

// ── Lo que responde el agente (POST /api/agente/mensaje) ───────────────────
interface Columna {
  clave: string;
  titulo: string;
  tipo: "texto" | "monto" | "numero" | "porcentaje" | "fecha";
  secundaria?: boolean;
}
interface Tabla {
  titulo?: string;
  columnas: Columna[];
  filas: Record<string, unknown>[];
  truncado?: boolean;
  consulta?: Record<string, unknown>;
}
interface Sugerencia {
  texto: string;
  mensaje?: string;
  accion?: Record<string, unknown>;
}
interface Respuesta {
  texto: string;
  tabla?: Tabla;
  enlace?: { texto: string; ruta: string; abrir?: boolean };
  sugerencias?: Sugerencia[];
  contexto?: Record<string, unknown>;
  /** "Descargar excel": el agente repite la tabla y el front la descarga sola. */
  descargar?: boolean;
}
interface Mensaje {
  de: "usuario" | "agente";
  texto: string;
  tabla?: Tabla;
  enlace?: Respuesta["enlace"];
  sugerencias?: Sugerencia[];
  error?: boolean;
}

const FILAS_GUARDADAS = 60;
const MENSAJES_GUARDADOS = 40;

const BIENVENIDA: Mensaje = {
  de: "agente",
  texto:
    "¡Hola! Soy el asistente de **Análisis 360**. Pregúntame por ventas, márgenes, clientes, productos, vendedores, stock o notas de crédito, o pídeme un informe para descargar en Excel.",
  sugerencias: [
    { texto: "¿Cuánto vendimos ayer?" },
    { texto: "Ventas de este mes por canal" },
    { texto: "Top 10 productos de este mes" },
    { texto: "Notas de crédito de este mes por motivo" },
    { texto: "Quiero un informe" },
    { texto: "¿Qué puedes hacer?" },
  ],
};

// ── Formatos ────────────────────────────────────────────────────────────────
function valor(v: unknown, tipo: Columna["tipo"]) {
  if (v == null || v === "") return "—";
  if (tipo === "monto") return formatoPesos(Number(v));
  if (tipo === "numero") return Number(v).toLocaleString("es-CL", { maximumFractionDigits: 2 });
  if (tipo === "porcentaje") return formatoPorcentaje(Number(v), 2);
  if (tipo === "fecha") return String(v).slice(0, 10).split("-").reverse().join("/");
  return String(v);
}

/** **negrita**, _cursiva_ y saltos de línea; nada de HTML. */
function TextoAgente({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("\n").map((linea, i) => (
        <Box key={i} component="span" sx={{ display: "block", mt: i ? 0.5 : 0 }}>
          {linea.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((parte, j) =>
            parte.startsWith("**") && parte.endsWith("**") ? (
              <strong key={j}>{parte.slice(2, -2)}</strong>
            ) : parte.startsWith("_") && parte.endsWith("_") && parte.length > 2 ? (
              <Box key={j} component="em" sx={{ color: tinta.secundaria }}>
                {parte.slice(1, -1)}
              </Box>
            ) : (
              <React.Fragment key={j}>{parte}</React.Fragment>
            )
          )}
        </Box>
      ))}
    </>
  );
}

function TablaAgente({ tabla, filas, compacta }: { tabla: Tabla; filas: Record<string, unknown>[]; compacta: boolean }) {
  const columnas = compacta ? tabla.columnas.filter((c) => !c.secundaria) : tabla.columnas;
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ ...tablaSx, tableLayout: "auto", "& .MuiTableCell-body": { fontSize: compacta ? 12 : 12.5, py: 0.6 }, "& .MuiTableCell-head": { ...tablaSx["& .MuiTableCell-head"], whiteSpace: "nowrap" } }}>
        <TableHead>
          <TableRow>
            {columnas.map((c) => (
              <TableCell key={c.clave} align={c.tipo === "texto" || c.tipo === "fecha" ? "left" : "right"}>
                {c.titulo}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((f, i) => (
            <TableRow key={i}>
              {columnas.map((c) => (
                <TableCell
                  key={c.clave}
                  align={c.tipo === "texto" || c.tipo === "fecha" ? "left" : "right"}
                  sx={{ maxWidth: compacta ? 160 : 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={String(f[c.clave] ?? "")}
                >
                  {valor(f[c.clave], c.tipo)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/** Todas las filas de una tabla: las de la consulta (hasta 5.000) o las que trae. */
async function filasCompletas(tabla: Tabla): Promise<Record<string, unknown>[]> {
  if (!tabla.consulta) return tabla.filas;
  const r = await apiJson(`${BACKEND_URL}/api/agente/consulta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consulta: { ...tabla.consulta, limite: 5000 } }),
  });
  return Array.isArray(r?.filas) ? r.filas : tabla.filas;
}

async function exportar(tabla: Tabla) {
  const filas = await filasCompletas(tabla);
  await descargarExcel(`asistente_${new Date().toISOString().slice(0, 10)}`, [
    {
      nombre: (tabla.titulo ?? "Datos").replace(/[\\/?*[\]:]/g, " ").slice(0, 31),
      filas: filas.map((f: Record<string, unknown>) =>
        Object.fromEntries(
          tabla.columnas.map((c) => [
            c.titulo,
            c.tipo === "texto" ? f[c.clave] ?? "" : c.tipo === "fecha" ? valor(f[c.clave], "fecha") : f[c.clave] == null ? null : Number(f[c.clave]),
          ])
        )
      ),
    },
    { nombre: "Consulta", filas: [{ Detalle: tabla.titulo ?? "" }, { Detalle: `Generado ${new Date().toLocaleString("es-CL")} · montos netos sin IVA` }] },
  ]);
}

/**
 * Asistente de Análisis 360 (sin IA): conversa con /api/agente/mensaje.
 * La conversación (y el contexto que el agente necesita para seguir el
 * hilo) se recuerda al cambiar de vista; se borra al cerrar sesión.
 */
export default function FloatingHelpAgent() {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [grande, setGrande] = React.useState(false);
  const [texto, setTexto] = React.useState("");
  const [pensando, setPensando] = React.useState(false);
  const [tablaCompleta, setTablaCompleta] = React.useState<{ tabla: Tabla; filas: Record<string, unknown>[] } | null>(null);
  const [descargando, setDescargando] = React.useState<number | null>(null);
  const [estado, setEstado] = useEstadoVista<{ mensajes: Mensaje[]; contexto: Record<string, unknown> }>("agente", () => ({
    mensajes: [BIENVENIDA],
    contexto: {},
  }));
  const finRef = React.useRef<HTMLDivElement | null>(null);
  const entradaRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (abierto) {
      finRef.current?.scrollIntoView({ behavior: "smooth" });
      entradaRef.current?.focus();
    }
  }, [abierto, estado.mensajes.length, pensando]);

  const enviar = async (mensaje: string, accion?: Record<string, unknown>, mostrar?: string) => {
    const visible = (mostrar ?? mensaje).trim();
    if ((!mensaje.trim() && !accion) || pensando) return;
    setTexto("");
    setEstado((e) => ({ ...e, mensajes: [...e.mensajes, { de: "usuario" as const, texto: visible }].slice(-MENSAJES_GUARDADOS) }));
    setPensando(true);
    try {
      const r: Respuesta = await apiJson(`${BACKEND_URL}/api/agente/mensaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje, accion, contexto: estado.contexto }),
      });
      // Se guardan pocas filas por tabla: la tabla completa se vuelve a pedir.
      const tabla = r.tabla ? { ...r.tabla, filas: r.tabla.filas.slice(0, FILAS_GUARDADAS), total: r.tabla.filas.length } : undefined;
      setEstado((e) => ({
        mensajes: [
          ...e.mensajes,
          { de: "agente" as const, texto: r.texto, tabla: tabla as Tabla | undefined, enlace: r.enlace, sugerencias: r.sugerencias },
        ].slice(-MENSAJES_GUARDADOS),
        contexto: r.contexto ?? e.contexto,
      }));
      if (r.enlace?.abrir) router.push(r.enlace.ruta);
      if (r.descargar && r.tabla) await exportar(r.tabla);
    } catch (error) {
      setEstado((e) => ({
        ...e,
        mensajes: [...e.mensajes, { de: "agente" as const, texto: "No pude responder en este momento. Intenta de nuevo en unos segundos.", error: true }],
      }));
    } finally {
      setPensando(false);
    }
  };

  const reiniciar = () => setEstado({ mensajes: [BIENVENIDA], contexto: {} });

  const verTabla = async (tabla: Tabla) => {
    setTablaCompleta({ tabla, filas: tabla.filas });
    try {
      const filas = await filasCompletas(tabla);
      setTablaCompleta({ tabla, filas });
    } catch {
      /* se queda con las filas que ya tenía */
    }
  };

  const descargar = async (tabla: Tabla, i: number) => {
    setDescargando(i);
    try {
      await exportar(tabla);
    } finally {
      setDescargando(null);
    }
  };

  const ultimoAgente = [...estado.mensajes].reverse().find((m) => m.de === "agente");

  return (
    <Box sx={{ position: "fixed", right: 20, bottom: 20, zIndex: 1300, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1.25 }}>
      {abierto && (
        <Box
          sx={{
            width: grande ? { xs: "calc(100vw - 24px)", md: "min(1100px, calc(100vw - 48px))" } : { xs: "calc(100vw - 24px)", sm: 440 },
            height: grande ? "calc(100vh - 110px)" : { xs: "calc(100vh - 120px)", sm: 620 },
            maxHeight: "calc(100vh - 100px)",
            bgcolor: "#fff",
            borderRadius: "18px",
            border: `1px solid ${tinta.borde}`,
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Encabezado */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)", color: "#fff" }}>
            <IconSparkles size={20} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Asistente de Análisis 360</Typography>
              <Typography sx={{ fontSize: 11.5, opacity: 0.85 }}>Datos de la copia de SAP · montos netos sin IVA</Typography>
            </Box>
            <Tooltip title="Nueva conversación">
              <IconButton size="small" onClick={reiniciar} sx={{ color: "#fff" }} aria-label="Nueva conversación">
                <IconRefresh size={17} />
              </IconButton>
            </Tooltip>
            <Tooltip title={grande ? "Achicar" : "Agrandar"}>
              <IconButton size="small" onClick={() => setGrande((g) => !g)} sx={{ color: "#fff" }} aria-label={grande ? "Achicar" : "Agrandar"}>
                {grande ? <IconArrowsMinimize size={17} /> : <IconArrowsMaximize size={17} />}
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setAbierto(false)} sx={{ color: "#fff" }} aria-label="Cerrar">
              <IconX size={18} />
            </IconButton>
          </Box>

          {/* Conversación */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 1.75, py: 1.5, bgcolor: "#f6f8fb" }}>
            {estado.mensajes.map((m, i) => {
              const esUltimo = m === ultimoAgente;
              return (
                <Box key={i} sx={{ display: "flex", justifyContent: m.de === "usuario" ? "flex-end" : "flex-start", mb: 1.25 }}>
                  <Box
                    sx={{
                      maxWidth: m.tabla ? "100%" : "88%",
                      width: m.tabla ? "100%" : "auto",
                      px: 1.5,
                      py: 1,
                      borderRadius: m.de === "usuario" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      bgcolor: m.de === "usuario" ? tinta.acento : "#fff",
                      color: m.de === "usuario" ? "#fff" : tinta.primaria,
                      border: m.de === "usuario" ? "none" : `1px solid ${m.error ? "#fecdca" : tinta.borde}`,
                      fontSize: 13.5,
                      lineHeight: 1.5,
                    }}
                  >
                    <TextoAgente texto={m.texto} />

                    {m.tabla && m.tabla.filas.length > 0 && (
                      <Box sx={{ mt: 1, border: `1px solid ${tinta.borde}`, borderRadius: "10px", overflow: "hidden" }}>
                        <TablaAgente tabla={m.tabla} filas={m.tabla.filas.slice(0, grande ? 15 : 6)} compacta={!grande} />
                        <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end", p: 0.75, bgcolor: tinta.fondoSuave, borderTop: `1px solid ${tinta.borde}` }}>
                          <Button size="small" startIcon={<IconTable size={15} />} onClick={() => verTabla(m.tabla!)} sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px" }}>
                            Ver tabla completa
                          </Button>
                          <Button
                            size="small"
                            startIcon={descargando === i ? <CircularProgress size={12} /> : <IconDownload size={15} />}
                            onClick={() => descargar(m.tabla!, i)}
                            disabled={descargando !== null}
                            sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px", color: "#067647" }}
                          >
                            Excel
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {m.enlace && (
                      <Button
                        size="small"
                        endIcon={<IconArrowUpRight size={14} />}
                        onClick={() => router.push(m.enlace!.ruta)}
                        sx={{ mt: 1, textTransform: "none", fontSize: 12.5, fontWeight: 600, borderRadius: "8px", px: 1 }}
                      >
                        {m.enlace.texto}
                      </Button>
                    )}

                    {/* Solo la última respuesta ofrece sus botones: las viejas ya no aplican al contexto. */}
                    {esUltimo && m.sugerencias && m.sugerencias.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                        {m.sugerencias.map((s, j) => (
                          <Box
                            key={j}
                            component="button"
                            type="button"
                            disabled={pensando}
                            onClick={() => enviar(s.mensaje ?? (s.accion ? "" : s.texto), s.accion, s.texto)}
                            sx={{
                              border: `1px solid ${s.texto.startsWith("✓") ? tinta.acento : tinta.borde}`,
                              bgcolor: s.texto.startsWith("✓") ? "#eff4ff" : "#fff",
                              color: s.texto.startsWith("✓") ? tinta.acento : tinta.primaria,
                              borderRadius: 999,
                              px: 1.25,
                              py: 0.4,
                              fontSize: 12.5,
                              fontWeight: 600,
                              fontFamily: "inherit",
                              cursor: "pointer",
                              textAlign: "left",
                              "&:hover": { borderColor: tinta.acento, bgcolor: "#eff4ff" },
                              "&:disabled": { opacity: 0.5, cursor: "default" },
                            }}
                          >
                            {s.texto}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
            {pensando && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: tinta.secundaria, fontSize: 12.5, px: 0.5 }}>
                <CircularProgress size={14} /> Consultando los datos…
              </Box>
            )}
            <div ref={finRef} />
          </Box>

          {/* Entrada */}
          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              enviar(texto);
            }}
            sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.25, borderTop: `1px solid ${tinta.borde}` }}
          >
            <InputBase
              inputRef={entradaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pregunta algo: «venta de ayer en Falabella», «top 10 clientes de octubre»…"
              fullWidth
              sx={{ px: 1.5, py: 0.75, border: `1px solid ${tinta.borde}`, borderRadius: "12px", fontSize: 13.5, "&.Mui-focused": { borderColor: tinta.acento } }}
            />
            <IconButton type="submit" disabled={pensando || !texto.trim()} aria-label="Enviar" sx={{ bgcolor: tinta.acento, color: "#fff", borderRadius: "12px", "&:hover": { bgcolor: "#1d4ed8" }, "&.Mui-disabled": { bgcolor: "#cbd5e1", color: "#fff" } }}>
              <IconSend size={18} />
            </IconButton>
          </Box>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={() => setAbierto((a) => !a)}
        startIcon={abierto ? <IconX size={18} /> : <IconSparkles size={18} />}
        sx={{ borderRadius: 999, px: 2.25, py: 1, textTransform: "none", fontWeight: 700, bgcolor: "#1e3a8a", boxShadow: "0 10px 24px rgba(30, 58, 138, 0.35)", "&:hover": { bgcolor: "#1e40af" } }}
      >
        {abierto ? "Cerrar" : "Agente"}
      </Button>

      {/* Tabla completa a pantalla completa */}
      <Dialog fullScreen open={!!tablaCompleta} onClose={() => setTablaCompleta(null)} sx={{ zIndex: 1400 }}>
        {tablaCompleta && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 3, py: 1.5, borderBottom: `1px solid ${tinta.borde}` }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: tinta.primaria }}>{tablaCompleta.tabla.titulo ?? "Resultado"}</Typography>
                <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>{tablaCompleta.filas.length.toLocaleString("es-CL")} filas · montos netos sin IVA</Typography>
              </Box>
              <Button
                variant="contained"
                disableElevation
                startIcon={descargando === -1 ? <CircularProgress size={14} color="inherit" /> : <IconDownload size={17} />}
                onClick={() => descargar(tablaCompleta.tabla, -1)}
                disabled={descargando !== null}
                sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600, bgcolor: "#067647", "&:hover": { bgcolor: "#05603a" } }}
              >
                Descargar Excel
              </Button>
              <IconButton aria-label="Cerrar" onClick={() => setTablaCompleta(null)} sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "10px" }}>
                <IconX size={20} />
              </IconButton>
            </Box>
            <Box sx={{ p: 3, overflow: "auto" }}>
              <TablaAgente tabla={tablaCompleta.tabla} filas={tablaCompleta.filas} compacta={false} />
            </Box>
          </>
        )}
      </Dialog>
    </Box>
  );
}
