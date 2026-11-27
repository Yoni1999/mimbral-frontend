"use client";

import React from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconAlertTriangle,
  IconCalendarTime,
  IconClock,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconHistory,
  IconInbox,
  IconInfoCircle,
  IconMail,
  IconMailForward,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSend,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { BACKEND_URL } from "@/config";
import { apiJson } from "@/utils/apiClient";
import { useApiDatos } from "@/utils/useCargaDatos";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";
import { Panel, Pildoras, controlSx, estado, etiquetaControlSx, tablaSx, tarjetaSx, tinta } from "../../utilities/ventas/components/estilo";
import { Etiqueta } from "../../utilities/ventas/mercado-libre/components/TablaInforme";
import { Aviso } from "../../utilities/categorias/mercado-libre/components/comun";

// ── Tipos de la respuesta (analysis-service /api/automatizaciones) ───────────

interface OpcionInforme {
  clave: string;
  titulo: string;
  valores: { valor: string; texto: string }[];
  defecto: string;
}
interface InformeCatalogo {
  id: string;
  nombre: string;
  grupo: string;
  enlace: string;
  opciones: OpcionInforme[];
}
interface Bloque {
  informe: string;
  opciones: Record<string, string>;
  etiqueta?: string;
}
interface Destinatario {
  id: number;
  correo: string;
  esDueno: boolean;
  estado: "activo" | "baja";
  bajaEn: string | null;
  bajaOrigen: string | null;
  creadoEn: string;
}
type Frecuencia = "diaria" | "dias" | "mensual";
interface Automatizacion {
  id: number;
  nombre: string;
  bloques: Bloque[];
  frecuencia: Frecuencia;
  dias: number[];
  diaMes: number | null;
  hora: string;
  adjuntos: string[];
  activa: boolean;
  cuando: string;
  proximoEnvio: string | null;
  ultimoEnvio: string | null;
  ultimoEstado: string | null;
  ultimoError: string | null;
  pausaMotivo: string | null;
  creadoEn: string;
  destinatarios: Destinatario[];
}
interface Recibida extends Omit<Automatizacion, "destinatarios"> {
  usuarioNombre: string | null;
  usuarioCorreo: string;
  destinatario: { id: number; estado: "activo" | "baja"; bajaEn: string | null; desde: string };
}
interface Listado {
  correo: string;
  mias: Automatizacion[];
  recibidas: Recibida[];
}
interface Envio {
  id: number;
  nombre: string;
  correo: string;
  tipo: string;
  estado: string;
  error: string | null;
  enviadoEn: string;
}

const API = `${BACKEND_URL}/api/automatizaciones`;
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const NOMBRE_DIA = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const HORAS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ESTADO_ENVIO: Record<string, { texto: string; color: string; fondo: string }> = {
  enviado: { texto: "Entregado", ...estado.bien },
  parcial: { texto: "Entregado a algunos", color: "#b54708", fondo: "#fffaeb" },
  error: { texto: "Con error", ...estado.mal },
  pausada: { texto: "Pausada", color: "#b54708", fondo: "#fffaeb" },
};
const AZUL = { color: tinta.acento, fondo: "#eff4ff" };
const GRIS = { color: tinta.secundaria, fondo: "#f1f5f9" };
const AMBAR = { color: "#b54708", fondo: "#fffaeb" };

const fechaHora = (v: string | null) =>
  v ? new Date(v).toLocaleString("es-CL", { timeZone: "America/Santiago", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) : "—";
const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString("es-CL", { timeZone: "America/Santiago" }) : "");
const claveBloque = (b: Bloque) => `${b.informe}|${JSON.stringify(Object.entries(b.opciones || {}).sort())}`;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Mismo texto que arma el back ("Lunes a sábado, 08:00"), para el resumen de la ventana. */
function textoCuando(b: { frecuencia: Frecuencia; dias: number[]; diaMes: number | null; hora: string }) {
  if (b.frecuencia === "diaria") return `Todos los días, ${b.hora}`;
  if (b.frecuencia === "mensual") return `Día ${b.diaMes} de cada mes, ${b.hora}`;
  const dias = [...b.dias].sort((x, y) => x - y);
  if (!dias.length) return "Elige al menos un día";
  const seguidos = dias.length > 2 && dias.every((x, i) => i === 0 || x === dias[i - 1] + 1);
  const texto = seguidos ? `${NOMBRE_DIA[dias[0]]} a ${NOMBRE_DIA[dias[dias.length - 1]]}` : dias.map((x) => NOMBRE_DIA[x]).join(", ");
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}, ${b.hora}`;
}

/** Lo que se edita en la ventana. */
interface Borrador {
  id: number | null;
  nombre: string;
  bloques: Bloque[];
  frecuencia: Frecuencia;
  dias: number[];
  diaMes: number;
  hora: string;
  adjuntos: string[];
  destinatarios: string[];
  activa: boolean;
}
const nuevoBorrador = (): Borrador => ({ id: null, nombre: "", bloques: [], frecuencia: "dias", dias: [1, 2, 3, 4, 5, 6], diaMes: 1, hora: "08:00", adjuntos: ["excel", "pdf"], destinatarios: [], activa: true });
const desdeAutomatizacion = (a: Automatizacion): Borrador => ({
  id: a.id,
  nombre: a.nombre,
  bloques: a.bloques.map((b) => ({ informe: b.informe, opciones: { ...b.opciones } })),
  frecuencia: a.frecuencia,
  dias: a.dias.length ? a.dias : [1, 2, 3, 4, 5],
  diaMes: a.diaMes || 1,
  hora: a.hora,
  adjuntos: a.adjuntos,
  destinatarios: a.destinatarios.filter((d) => !d.esDueno).map((d) => d.correo),
  activa: a.activa,
});

// ── Piezas chicas ────────────────────────────────────────────────────────────

/** Dato con ícono: "🗓 Lunes a sábado, 09:00". */
function Dato({ icono, children, tono = tinta.secundaria }: { icono: React.ReactNode; children: React.ReactNode; tono?: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, color: tono, fontSize: 12.5, minWidth: 0 }}>
      <Box sx={{ display: "flex", color: tinta.tenue, flexShrink: 0 }}>{icono}</Box>
      <Box component="span" sx={{ minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

function Adjuntos({ adjuntos }: { adjuntos: string[] }) {
  if (!adjuntos.length) return <Dato icono={<IconMail size={15} />}>Solo en el correo</Dato>;
  return (
    <Box sx={{ display: "inline-flex", gap: 1.25 }}>
      {adjuntos.includes("excel") && <Dato icono={<IconFileSpreadsheet size={15} />}>Excel</Dato>}
      {adjuntos.includes("pdf") && <Dato icono={<IconFileTypePdf size={15} />}>PDF</Dato>}
    </Box>
  );
}

/** Rótulo de sección de la ventana: número del paso y título. */
function Paso({ numero, titulo, ayuda, children }: { numero: number; titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "#eff4ff", color: tinta.acento, fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{numero}</Box>
        <Typography sx={{ fontSize: 14, fontWeight: 750, color: tinta.primaria }}>{titulo}</Typography>
      </Box>
      {ayuda && <Typography sx={{ fontSize: 12, color: tinta.tenue, mt: -0.75, ml: 3.75 }}>{ayuda}</Typography>}
      <Box sx={{ ml: { xs: 0, sm: 3.75 } }}>{children}</Box>
    </Box>
  );
}

// ── Ventana: crear / editar ──────────────────────────────────────────────────

function Editor({
  abierto,
  inicial,
  catalogo,
  miCorreo,
  existentes,
  recibidas,
  onCerrar,
  onGuardado,
  onDejarDeRecibir,
}: {
  abierto: boolean;
  inicial: Borrador;
  catalogo: InformeCatalogo[];
  miCorreo: string;
  existentes: Destinatario[];
  recibidas: Recibida[];
  onCerrar: () => void;
  onGuardado: () => void;
  onDejarDeRecibir: (r: Recibida) => Promise<void>;
}) {
  const [b, setB] = React.useState<Borrador>(inicial);
  const [nuevoCorreo, setNuevoCorreo] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [ignorar, setIgnorar] = React.useState<number[]>([]);
  React.useEffect(() => {
    setB(inicial);
    setNuevoCorreo("");
    setIgnorar([]);
  }, [inicial]);

  const porId = React.useMemo(() => new Map(catalogo.map((i) => [i.id, i])), [catalogo]);
  const ordenados = React.useMemo(() => [...catalogo].sort((x, y) => x.grupo.localeCompare(y.grupo) || x.nombre.localeCompare(y.nombre)), [catalogo]);

  const agregarInforme = (i: InformeCatalogo) =>
    setB((x) => ({ ...x, bloques: [...x.bloques, { informe: i.id, opciones: Object.fromEntries(i.opciones.map((o) => [o.clave, o.defecto])) }] }));
  const cambiarOpcion = (indice: number, clave: string, valor: string) =>
    setB((x) => ({ ...x, bloques: x.bloques.map((bl, j) => (j === indice ? { ...bl, opciones: { ...bl.opciones, [clave]: valor } } : bl)) }));
  const quitar = (indice: number) => setB((x) => ({ ...x, bloques: x.bloques.filter((_, j) => j !== indice) }));
  const alternarDia = (d: number) => setB((x) => ({ ...x, dias: x.dias.includes(d) ? x.dias.filter((y) => y !== d) : [...x.dias, d].sort() }));
  const alternarAdjunto = (a: string) => setB((x) => ({ ...x, adjuntos: x.adjuntos.includes(a) ? x.adjuntos.filter((y) => y !== a) : [...x.adjuntos, a] }));
  const agregarCorreo = () => {
    const c = nuevoCorreo.trim().toLowerCase();
    if (!CORREO.test(c)) return notifyError("Escribe un correo válido.");
    if (c === miCorreo || b.destinatarios.includes(c)) return setNuevoCorreo("");
    setB((x) => ({ ...x, destinatarios: [...x.destinatarios, c] }));
    setNuevoCorreo("");
  };

  // Otra persona ya te envía alguno de los informes elegidos, con el mismo período.
  const misClaves = new Set(b.bloques.map(claveBloque));
  const coincidencias = recibidas.filter((r) => r.destinatario.estado === "activo" && !ignorar.includes(r.destinatario.id) && r.bloques.some((x) => misClaves.has(claveBloque(x))));

  const estadoDe = (correo: string) => existentes.find((d) => d.correo === correo);
  const faltaNombre = !b.nombre.trim();
  const faltaInforme = !b.bloques.length;
  const faltaDia = b.frecuencia === "dias" && !b.dias.length;
  const valido = !faltaNombre && !faltaInforme && !faltaDia && b.bloques.every((bl) => porId.has(bl.informe));
  const destinosActivos = 1 + b.destinatarios.filter((c) => estadoDe(c)?.estado !== "baja").length;

  const guardar = async () => {
    setGuardando(true);
    try {
      const cuerpo = JSON.stringify({ ...b, nombre: b.nombre.trim() });
      if (b.id) await apiJson(`${API}/${b.id}`, { method: "PUT", body: cuerpo });
      else await apiJson(API, { method: "POST", body: cuerpo });
      notifySuccess(b.id ? "Automatización guardada" : "Automatización creada", { description: b.activa ? "Llegará en el próximo horario elegido." : "Quedó en pausa." });
      onGuardado();
    } catch (e) {
      notifyError("No se pudo guardar", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setGuardando(false);
    }
  };

  const filaResumen = (titulo: string, valor: React.ReactNode) => (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: ".05em" }}>{titulo}</Typography>
      <Box sx={{ fontSize: 13, color: tinta.primaria, mt: 0.25 }}>{valor}</Box>
    </Box>
  );

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1.75, borderBottom: `1px solid ${tinta.borde}` }}>
        <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "#eff4ff", color: tinta.acento, display: "grid", placeItems: "center" }}>
          <IconMailForward size={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 800 }}>{b.id ? "Editar automatización" : "Nueva automatización"}</Typography>
          <Typography sx={{ fontSize: 12, color: tinta.secundaria }}>Elige qué informes llegan, cuándo y a quién.</Typography>
        </Box>
        <IconButton onClick={onCerrar} sx={{ ml: "auto" }} aria-label="Cerrar">
          <IconX size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 300px" } }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, display: "grid", gap: 3, alignContent: "start", minWidth: 0 }}>
          <Box>
            <Typography sx={etiquetaControlSx}>Nombre</Typography>
            <TextField
              fullWidth
              size="small"
              value={b.nombre}
              placeholder="Por ejemplo: Cierre diario de ventas"
              onChange={(e) => setB((x) => ({ ...x, nombre: e.target.value }))}
              InputProps={{ sx: { ...controlSx, height: 38, fontSize: 14 } }}
              inputProps={{ maxLength: 120 }}
            />
          </Box>

          {coincidencias.map((r) => (
            <Aviso key={r.destinatario.id} tono="neutro" icono={<IconInfoCircle size={16} />}>
              <strong>
                {r.usuarioNombre || r.usuarioCorreo} ya te envía {r.bloques.filter((x) => misClaves.has(claveBloque(x))).map((x) => `«${x.etiqueta}»`).join(", ")}
              </strong>{" "}
              en «{r.nombre}» ({r.cuando}).
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" onClick={() => onDejarDeRecibir(r)} sx={{ textTransform: "none", fontWeight: 700 }}>
                  Dejar de recibir el de {r.usuarioNombre || r.usuarioCorreo}
                </Button>
                <Button size="small" onClick={() => setIgnorar((x) => [...x, r.destinatario.id])} sx={{ textTransform: "none" }}>
                  Recibir los dos
                </Button>
              </Box>
            </Aviso>
          ))}

          <Paso numero={1} titulo="Informes" ayuda="Llegan juntos en un mismo correo, en este orden.">
            <Box sx={{ display: "grid", gap: 1 }}>
              {b.bloques.map((bl, i) => {
                const inf = porId.get(bl.informe);
                return (
                  <Box key={i} sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", bgcolor: "#fff", px: 1.75, py: 1.25, display: "grid", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Typography sx={{ color: tinta.tenue, fontWeight: 800, fontSize: 12, width: 16 }}>{i + 1}</Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{inf?.nombre ?? bl.informe}</Typography>
                        {inf && <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>{inf.grupo}</Typography>}
                      </Box>
                      <Tooltip title="Quitar del correo">
                        <IconButton size="small" onClick={() => quitar(i)} sx={{ ml: "auto" }} aria-label={`Quitar ${inf?.nombre ?? bl.informe}`}>
                          <IconTrash size={15} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {!inf && <Typography sx={{ fontSize: 12, color: estado.mal.color }}>Ya no tienes permiso para este informe: quítalo para guardar.</Typography>}
                    {inf?.opciones.map((o) => (
                      <Box key={o.clave} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", ml: 3 }}>
                        <Typography sx={{ fontSize: 12, color: tinta.secundaria, minWidth: 96 }}>{o.titulo}</Typography>
                        <Pildoras etiqueta={o.titulo} opciones={o.valores} valor={bl.opciones[o.clave] ?? o.defecto} onCambiar={(v) => cambiarOpcion(i, o.clave, v)} />
                      </Box>
                    ))}
                  </Box>
                );
              })}
              <Autocomplete
                size="small"
                options={ordenados}
                groupBy={(i) => i.grupo}
                getOptionLabel={(i) => i.nombre}
                value={null}
                blurOnSelect
                clearOnBlur
                onChange={(_, i) => i && agregarInforme(i)}
                noOptionsText="No hay informes con ese nombre"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={b.bloques.length ? "Agregar otro informe…" : `Buscar entre ${catalogo.length} informes…`}
                    InputProps={{
                      ...params.InputProps,
                      sx: { ...controlSx, height: "auto", minHeight: 38 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={16} color={tinta.tenue} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Paso>

          <Paso numero={2} titulo="Cuándo llega">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, alignItems: "flex-end" }}>
              <Box>
                <Typography sx={etiquetaControlSx}>Frecuencia</Typography>
                <Pildoras
                  etiqueta="Frecuencia"
                  opciones={[
                    { valor: "diaria" as Frecuencia, texto: "Todos los días" },
                    { valor: "dias" as Frecuencia, texto: "Días elegidos" },
                    { valor: "mensual" as Frecuencia, texto: "Una vez al mes" },
                  ]}
                  valor={b.frecuencia}
                  onCambiar={(f) => setB((x) => ({ ...x, frecuencia: f }))}
                />
              </Box>
              {b.frecuencia === "dias" && (
                <Box>
                  <Typography sx={etiquetaControlSx}>Días</Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {DIAS.map((d, i) => {
                      const on = b.dias.includes(i + 1);
                      return (
                        <Tooltip key={i} title={NOMBRE_DIA[i + 1]}>
                          <Button size="small" variant={on ? "contained" : "outlined"} disableElevation onClick={() => alternarDia(i + 1)} aria-pressed={on} aria-label={NOMBRE_DIA[i + 1]} sx={{ minWidth: 34, px: 0, fontWeight: 700, borderRadius: "9px" }}>
                            {d}
                          </Button>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              )}
              {b.frecuencia === "mensual" && (
                <Box>
                  <Typography sx={etiquetaControlSx}>Día del mes</Typography>
                  <Select size="small" value={b.diaMes} onChange={(e) => setB((x) => ({ ...x, diaMes: Number(e.target.value) }))} sx={{ ...controlSx, width: 90 }}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
              <Box>
                <Typography sx={etiquetaControlSx}>Hora</Typography>
                <Select size="small" value={b.hora} onChange={(e) => setB((x) => ({ ...x, hora: String(e.target.value) }))} sx={{ ...controlSx, width: 110 }}>
                  {HORAS.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          </Paso>

          <Paso numero={3} titulo="Archivos adjuntos" ayuda="El resumen siempre va en el cuerpo del correo.">
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {[
                { valor: "excel", texto: "Excel", icono: <IconFileSpreadsheet size={16} />, ayuda: "todas las filas" },
                { valor: "pdf", texto: "PDF", icono: <IconFileTypePdf size={16} />, ayuda: "para imprimir o reenviar" },
              ].map((a) => {
                const on = b.adjuntos.includes(a.valor);
                return (
                  <Box
                    key={a.valor}
                    component="button"
                    type="button"
                    onClick={() => alternarAdjunto(a.valor)}
                    aria-pressed={on}
                    sx={{
                      font: "inherit",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: "10px",
                      border: `1px solid ${on ? tinta.acento : tinta.borde}`,
                      bgcolor: on ? "#eff4ff" : "#fff",
                      color: on ? tinta.acento : tinta.secundaria,
                      textAlign: "left",
                      "&:focus-visible": { outline: `2px solid ${tinta.acento}`, outlineOffset: 2 },
                    }}
                  >
                    {a.icono}
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "inherit" }}>{a.texto}</Typography>
                      <Typography sx={{ fontSize: 11, color: tinta.tenue }}>{a.ayuda}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paso>

          <Paso numero={4} titulo="Quién lo recibe" ayuda="Cada persona que agregues recibe un enlace para dejar de recibirlo.">
            <Box sx={{ display: "grid", gap: 0.75 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, border: `1px solid ${tinta.borde}`, borderRadius: "10px", px: 1.5, py: 1, bgcolor: tinta.fondoSuave }}>
                <IconMail size={16} color={tinta.tenue} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Tu cuenta</Typography>
                  <Typography sx={{ fontSize: 12, color: tinta.tenue, overflowWrap: "anywhere" }}>{miCorreo} · siempre incluido</Typography>
                </Box>
              </Box>
              {b.destinatarios.map((c) => {
                const d = estadoDe(c);
                const deBaja = d?.estado === "baja";
                return (
                  <Box key={c} sx={{ display: "flex", alignItems: "center", gap: 1.25, border: `1px solid ${tinta.borde}`, borderRadius: "10px", px: 1.5, py: 1, flexWrap: "wrap" }}>
                    <IconMail size={16} color={tinta.tenue} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, overflowWrap: "anywhere", textDecoration: deBaja ? "line-through" : "none", color: deBaja ? tinta.tenue : tinta.primaria }}>{c}</Typography>
                      <Typography sx={{ fontSize: 12, color: tinta.tenue }}>
                        {deBaja ? `Se dio de baja el ${fecha(d?.bajaEn ?? null)}` : d ? `Recibe desde el ${fecha(d.creadoEn)}` : "Recibirá desde el próximo envío"}
                      </Typography>
                    </Box>
                    <Etiqueta texto={deBaja ? "De baja" : d ? "Recibe" : "Nuevo"} {...(deBaja ? AMBAR : d ? estado.bien : AZUL)} />
                    <Tooltip title="Quitar">
                      <IconButton size="small" onClick={() => setB((x) => ({ ...x, destinatarios: x.destinatarios.filter((y) => y !== c) }))} aria-label={`Quitar ${c}`}>
                        <IconX size={15} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="nombre@empresa.cl"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarCorreo();
                    }
                  }}
                  InputProps={{ sx: { ...controlSx, height: 38 } }}
                  inputProps={{ "aria-label": "Agregar otro correo" }}
                />
                <Button variant="outlined" startIcon={<IconPlus size={15} />} onClick={agregarCorreo} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", whiteSpace: "nowrap" }}>
                  Agregar
                </Button>
              </Box>
              <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>A quien se dio de baja no se le vuelve a enviar, aunque lo agregues de nuevo.</Typography>
            </Box>
          </Paso>
        </Box>

        <Box sx={{ bgcolor: tinta.fondoSuave, borderLeft: { md: `1px solid ${tinta.borde}` }, borderTop: { xs: `1px solid ${tinta.borde}`, md: 0 }, p: { xs: 2, sm: 2.5 }, display: "grid", gap: 2, alignContent: "start" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: tinta.primaria }}>Resumen</Typography>
          {filaResumen("Nombre", b.nombre.trim() || <Box component="span" sx={{ color: tinta.tenue }}>Sin nombre</Box>)}
          {filaResumen(
            "Contenido",
            b.bloques.length ? (
              <Box component="ol" sx={{ m: 0, pl: 2.25, display: "grid", gap: 0.25 }}>
                {b.bloques.map((bl, i) => (
                  <li key={i}>{porId.get(bl.informe)?.nombre ?? bl.informe}</li>
                ))}
              </Box>
            ) : (
              <Box component="span" sx={{ color: tinta.tenue }}>Todavía sin informes</Box>
            )
          )}
          {filaResumen("Cuándo", <Dato icono={<IconCalendarTime size={15} />} tono={tinta.primaria}>{textoCuando(b)}</Dato>)}
          {filaResumen("Adjuntos", <Adjuntos adjuntos={b.adjuntos} />)}
          {filaResumen("Destinatarios", <Dato icono={<IconUsers size={15} />} tono={tinta.primaria}>{plural(destinosActivos, "persona", "personas")}</Dato>)}
          {(faltaNombre || faltaInforme || faltaDia) && (
            <Box sx={{ fontSize: 12, color: AMBAR.color, bgcolor: AMBAR.fondo, borderRadius: "10px", px: 1.25, py: 1 }}>
              Para guardar falta: {[faltaNombre && "el nombre", faltaInforme && "al menos un informe", faltaDia && "un día"].filter(Boolean).join(", ")}.
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, gap: 1, borderTop: `1px solid ${tinta.borde}` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mr: "auto" }}>
          <Switch checked={b.activa} onChange={(e) => setB((x) => ({ ...x, activa: e.target.checked }))} inputProps={{ "aria-label": "Activa" }} />
          <Typography sx={{ fontSize: 13, color: tinta.secundaria }}>{b.activa ? "Activa: se envía en su horario" : "En pausa: no se envía"}</Typography>
        </Box>
        <Button onClick={onCerrar} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button variant="contained" disableElevation disabled={!valido || guardando} onClick={guardar} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 2.5 }}>
          {guardando ? "Guardando…" : b.id ? "Guardar cambios" : "Crear automatización"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Historial ────────────────────────────────────────────────────────────────

function Historial({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const h = useApiDatos<{ data: Envio[] }>(abierto ? `${API}/historial?limite=200` : null, { data: [] });
  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800, borderBottom: `1px solid ${tinta.borde}` }}>
        <IconHistory size={18} color={tinta.tenue} />
        Historial de envíos
        <IconButton onClick={onCerrar} sx={{ ml: "auto" }} aria-label="Cerrar">
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ ...tablaSx, minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Automatización</TableCell>
                <TableCell>Para</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {h.cargando ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ) : h.datos.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: tinta.tenue, textAlign: "center", py: 4 }}>
                    Todavía no hay envíos.
                  </TableCell>
                </TableRow>
              ) : (
                h.datos.data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{fechaHora(e.enviadoEn)}</TableCell>
                    <TableCell>
                      {e.nombre}
                      {e.tipo === "prueba" && (
                        <Typography component="span" sx={{ fontSize: 11, color: tinta.tenue }}>
                          {" "}
                          · prueba
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{e.correo}</TableCell>
                    <TableCell>
                      <Tooltip title={e.error || ""}>
                        <span>
                          <Etiqueta texto={e.estado === "enviado" ? "Entregado" : "Con error"} {...(e.estado === "enviado" ? estado.bien : estado.mal)} />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Tarjeta de una automatización propia ─────────────────────────────────────

function TarjetaAutomatizacion({
  a,
  probando,
  onEditar,
  onProbar,
  onBorrar,
  onActivar,
}: {
  a: Automatizacion;
  probando: boolean;
  onEditar: () => void;
  onProbar: () => void;
  onBorrar: () => void;
  onActivar: (activa: boolean) => void;
}) {
  const est = a.ultimoEstado ? ESTADO_ENVIO[a.ultimoEstado] : null;
  const otros = a.destinatarios.filter((d) => !d.esDueno);
  const activos = 1 + otros.filter((d) => d.estado === "activo").length;
  return (
    <Box
      sx={{
        ...tarjetaSx,
        p: { xs: 1.75, sm: 2 },
        display: "grid",
        gap: 1.5,
        opacity: a.activa ? 1 : 0.85,
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: "#cbd5e1", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: tinta.primaria }}>{a.nombre}</Typography>
            <Etiqueta texto={a.activa ? "Activa" : "En pausa"} {...(a.activa ? estado.bien : AMBAR)} />
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.5, mt: 0.75 }}>
            <Dato icono={<IconCalendarTime size={15} />}>{a.cuando}</Dato>
            {a.activa && a.proximoEnvio && <Dato icono={<IconClock size={15} />}>Próximo: {fechaHora(a.proximoEnvio)}</Dato>}
            <Dato icono={<IconUsers size={15} />}>{plural(activos, "destinatario", "destinatarios")}</Dato>
            <Adjuntos adjuntos={a.adjuntos} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <Tooltip title="Enviarme una prueba ahora">
            <span>
              <IconButton size="small" disabled={probando} onClick={onProbar} aria-label={`Probar ${a.nombre}`}>
                <IconSend size={17} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={onEditar} aria-label={`Editar ${a.nombre}`}>
              <IconPencil size={17} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={onBorrar} aria-label={`Eliminar ${a.nombre}`}>
              <IconTrash size={17} />
            </IconButton>
          </Tooltip>
          <Tooltip title={a.activa ? "Pausar" : "Activar"}>
            <Switch checked={a.activa} onChange={(e) => onActivar(e.target.checked)} inputProps={{ "aria-label": `Activa ${a.nombre}` }} />
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {a.bloques.map((b, i) => (
          <Etiqueta key={i} texto={b.etiqueta ?? b.informe} {...AZUL} />
        ))}
      </Box>

      {otros.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
          <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mr: 0.25 }}>También a:</Typography>
          {otros.map((d) =>
            d.estado === "baja" ? (
              <Tooltip key={d.id} title={`Usó «Dejar de recibir» el ${fecha(d.bajaEn)}`}>
                <span>
                  <Etiqueta texto={`${d.correo} · se dio de baja`} {...AMBAR} />
                </span>
              </Tooltip>
            ) : (
              <Etiqueta key={d.id} texto={d.correo} {...GRIS} />
            )
          )}
        </Box>
      )}

      {!a.activa && a.pausaMotivo && (
        <Aviso tono="mal" icono={<IconAlertTriangle size={16} />}>
          {a.pausaMotivo}
        </Aviso>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1.25, borderTop: `1px solid ${tinta.borde}`, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 12, color: tinta.tenue }}>Último envío</Typography>
        <Typography sx={{ fontSize: 12, color: tinta.secundaria, fontWeight: 600 }}>{a.ultimoEnvio ? fechaHora(a.ultimoEnvio) : "Todavía no se envía"}</Typography>
        {est && (
          <Tooltip title={a.ultimoError || ""}>
            <span>
              <Etiqueta texto={est.texto} color={est.color} fondo={est.fondo} />
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

/**
 * Ajustes → Automatizaciones: informes que llegan solos por correo. Cada
 * persona arma las suyas (uno o varios informes en un correo, días, hora,
 * Excel y/o PDF, y a quién más se envían) y ve las que otros le envían.
 */
export default function Automatizaciones() {
  const [version, setVersion] = React.useState(0);
  const recargar = () => setVersion((v) => v + 1);
  const listado = useApiDatos<Listado | null>(`${API}?v=${version}`, null);
  const catalogo = useApiDatos<{ informes: InformeCatalogo[] }>(`${API}/catalogo`, { informes: [] });
  const [filtro, setFiltro] = React.useState<"todas" | "activas" | "pausa">("todas");
  const [editor, setEditor] = React.useState<{ abierto: boolean; borrador: Borrador; existentes: Destinatario[] }>({ abierto: false, borrador: nuevoBorrador(), existentes: [] });
  const [historial, setHistorial] = React.useState(false);
  const [aBorrar, setABorrar] = React.useState<Automatizacion | null>(null);
  const [probando, setProbando] = React.useState<number | null>(null);

  const datos = listado.datos;
  const mias = datos?.mias ?? [];
  const recibidas = datos?.recibidas ?? [];
  const visibles = mias.filter((a) => filtro === "todas" || (filtro === "activas" ? a.activa : !a.activa));
  const proxima = mias.filter((a) => a.activa && a.proximoEnvio).sort((x, y) => String(x.proximoEnvio).localeCompare(String(y.proximoEnvio)))[0];
  const ultima = [...mias].filter((a) => a.ultimoEnvio).sort((x, y) => String(y.ultimoEnvio).localeCompare(String(x.ultimoEnvio)))[0];
  const nueva = () => setEditor({ abierto: true, borrador: nuevoBorrador(), existentes: [] });

  const llamar = async (url: string, metodo: string, cuerpo?: unknown) => apiJson(url, { method: metodo, ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}) });

  const activar = async (a: Automatizacion, activa: boolean) => {
    try {
      await llamar(`${API}/${a.id}/activa`, "POST", { activa });
      notifySuccess(activa ? "Automatización activada" : "Automatización en pausa");
      recargar();
    } catch (e) {
      notifyError("No se pudo cambiar", { description: e instanceof Error ? e.message : undefined });
    }
  };
  const probar = async (a: Automatizacion) => {
    setProbando(a.id);
    try {
      const r = await llamar(`${API}/${a.id}/prueba`, "POST", {});
      notifySuccess("Prueba enviada", { description: `Revisa ${r.enviadoA}.` });
    } catch (e) {
      notifyError("No se pudo enviar la prueba", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setProbando(null);
    }
  };
  const borrar = async () => {
    if (!aBorrar) return;
    try {
      await llamar(`${API}/${aBorrar.id}`, "DELETE");
      notifySuccess("Automatización eliminada");
      setABorrar(null);
      recargar();
    } catch (e) {
      notifyError("No se pudo eliminar", { description: e instanceof Error ? e.message : undefined });
    }
  };
  const cambiarRecibida = async (r: Recibida, accion: "baja" | "alta") => {
    try {
      await llamar(`${API}/recibidas/${r.destinatario.id}/${accion}`, "POST", {});
      notifySuccess(accion === "baja" ? `Dejaste de recibir «${r.nombre}»` : `Vuelves a recibir «${r.nombre}»`);
      recargar();
    } catch (e) {
      notifyError("No se pudo cambiar", { description: e instanceof Error ? e.message : undefined });
    }
  };

  const tarjetas = [
    { titulo: "Mis automatizaciones", valor: String(mias.length), pie: `${mias.filter((a) => a.activa).length} activas · ${mias.filter((a) => !a.activa).length} en pausa` },
    { titulo: "Próximo envío", valor: proxima ? fechaHora(proxima.proximoEnvio) : "—", pie: proxima?.nombre ?? "Nada programado" },
    { titulo: "Último envío", valor: ultima ? fechaHora(ultima.ultimoEnvio) : "—", pie: ultima ? ESTADO_ENVIO[ultima.ultimoEstado ?? ""]?.texto ?? "" : "Todavía no se envía" },
    { titulo: "Te envían otras personas", valor: String(recibidas.filter((r) => r.destinatario.estado === "activo").length), pie: "automatizaciones activas a tu correo" },
  ];

  return (
    <PageContainer title="Automatizaciones" description="Informes que llegan solos por correo">
      <Box sx={{ maxWidth: 1240, mx: "auto", display: "grid", gap: 2 }}>
        <Box sx={{ ...tarjetaSx, px: { xs: 1.75, md: 2.5 }, py: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#eff4ff", color: tinta.acento, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <IconMailForward size={22} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>Automatizaciones</Typography>
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
              Informes que llegan solos por correo, a la hora y los días que elijas. Llegan a {datos?.correo ?? "tu correo"} y a quien agregues.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<IconHistory size={16} />} onClick={() => setHistorial(true)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
              Historial de envíos
            </Button>
            <Button variant="contained" disableElevation startIcon={<IconPlus size={16} />} onClick={nueva} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
              Nueva automatización
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          {tarjetas.map((t) => (
            <Box key={t.titulo} sx={{ ...tarjetaSx, px: 1.75, py: 1.5, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: tinta.secundaria }}>{t.titulo}</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 800, mt: 0.25, fontVariantNumeric: "tabular-nums" }}>{listado.cargando && !datos ? "…" : t.valor}</Typography>
              <Typography noWrap sx={{ fontSize: 11.5, color: tinta.tenue }}>
                {t.pie}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mt: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 800 }}>Mis automatizaciones</Typography>
            <Typography sx={{ fontSize: 12, color: tinta.tenue }}>Si alguien programa el mismo informe con el mismo período, se calcula una sola vez en el día.</Typography>
          </Box>
          {mias.length > 0 && (
            <Box sx={{ ml: "auto" }}>
              <Pildoras
                etiqueta="Filtrar"
                opciones={[
                  { valor: "todas" as const, texto: `Todas (${mias.length})` },
                  { valor: "activas" as const, texto: "Activas" },
                  { valor: "pausa" as const, texto: "En pausa" },
                ]}
                valor={filtro}
                onCambiar={setFiltro}
              />
            </Box>
          )}
        </Box>

        {listado.cargando && !datos ? (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {[0, 1].map((i) => (
              <Box key={i} sx={{ ...tarjetaSx, p: 2 }}>
                <Skeleton width="40%" height={26} />
                <Skeleton width="70%" />
                <Skeleton width="55%" />
              </Box>
            ))}
          </Box>
        ) : mias.length === 0 ? (
          <Box sx={{ ...tarjetaSx, py: 6, px: 2, display: "grid", justifyItems: "center", textAlign: "center", gap: 1 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: "16px", bgcolor: "#eff4ff", color: tinta.acento, display: "grid", placeItems: "center" }}>
              <IconInbox size={26} />
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 0.5 }}>Todavía no tienes automatizaciones</Typography>
            <Typography sx={{ fontSize: 13, color: tinta.secundaria, maxWidth: 460 }}>
              Elige uno o varios informes y recíbelos por correo cada día, en días elegidos o una vez al mes, con su Excel y PDF.
            </Typography>
            <Button variant="contained" disableElevation startIcon={<IconPlus size={16} />} onClick={nueva} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", mt: 1 }}>
              Crear la primera
            </Button>
          </Box>
        ) : visibles.length === 0 ? (
          <Box sx={{ ...tarjetaSx, py: 4, textAlign: "center", color: tinta.tenue, fontSize: 13 }}>No hay automatizaciones con este filtro.</Box>
        ) : (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {visibles.map((a) => (
              <TarjetaAutomatizacion
                key={a.id}
                a={a}
                probando={probando === a.id}
                onEditar={() => setEditor({ abierto: true, borrador: desdeAutomatizacion(a), existentes: a.destinatarios })}
                onProbar={() => probar(a)}
                onBorrar={() => setABorrar(a)}
                onActivar={(activa) => activar(a, activa)}
              />
            ))}
          </Box>
        )}

        <Panel
          titulo="Te las envían otras personas"
          descripcion="Automatizaciones de otros que llegan a tu correo. Puedes dejar de recibir cualquiera sin afectar las demás."
          sx={{ mt: 1, p: 0, pt: 2.5, "& > div:first-of-type": { px: { xs: 1.75, sm: 2.5 } } }}
        >
          {recibidas.length === 0 ? (
            <Typography sx={{ px: 2.5, pb: 2.5, fontSize: 13, color: tinta.tenue }}>Nadie más te envía informes.</Typography>
          ) : (
            <Box sx={{ display: "grid" }}>
              {recibidas.map((r) => {
                const deBaja = r.destinatario.estado === "baja";
                return (
                  <Box key={r.destinatario.id} sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", px: { xs: 1.75, sm: 2.5 }, py: 1.5, borderTop: `1px solid ${tinta.borde}` }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13.5, textDecoration: deBaja ? "line-through" : "none", color: deBaja ? tinta.tenue : tinta.primaria }}>{r.nombre}</Typography>
                        {deBaja && <Etiqueta texto={`Dejaste de recibirla el ${fecha(r.destinatario.bajaEn)}`} {...GRIS} />}
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.5, mt: 0.5 }}>
                        <Dato icono={<IconMail size={15} />}>{r.usuarioNombre || r.usuarioCorreo}</Dato>
                        <Dato icono={<IconCalendarTime size={15} />}>{r.cuando}</Dato>
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                        {r.bloques.map((b, i) => (
                          <Etiqueta key={i} texto={b.etiqueta ?? b.informe} {...(deBaja ? GRIS : AZUL)} />
                        ))}
                      </Box>
                    </Box>
                    <Button size="small" variant={deBaja ? "text" : "outlined"} onClick={() => cambiarRecibida(r, deBaja ? "alta" : "baja")} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
                      {deBaja ? "Volver a recibir" : "Dejar de recibir"}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Panel>
      </Box>

      <Editor
        abierto={editor.abierto}
        inicial={editor.borrador}
        catalogo={catalogo.datos.informes}
        miCorreo={datos?.correo ?? ""}
        existentes={editor.existentes}
        recibidas={recibidas}
        onCerrar={() => setEditor((e) => ({ ...e, abierto: false }))}
        onGuardado={() => {
          setEditor((e) => ({ ...e, abierto: false }));
          recargar();
        }}
        onDejarDeRecibir={(r) => cambiarRecibida(r, "baja")}
      />
      <Historial abierto={historial} onCerrar={() => setHistorial(false)} />
      <Dialog open={!!aBorrar} onClose={() => setABorrar(null)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Eliminar «{aBorrar?.nombre}»?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: tinta.secundaria }}>Deja de enviarse a ti y a todos sus destinatarios. No se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setABorrar(null)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" disableElevation onClick={borrar} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
