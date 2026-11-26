"use client";

import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { IconAlertTriangle, IconHistory, IconInfoCircle, IconPencil, IconPlus, IconSend, IconTrash, IconX } from "@tabler/icons-react";
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
const HORAS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ESTADO_ENVIO: Record<string, { texto: string; color: string; fondo: string }> = {
  enviado: { texto: "Entregado", ...estado.bien },
  parcial: { texto: "Entregado a algunos", color: "#b54708", fondo: "#fffaeb" },
  error: { texto: "Con error", ...estado.mal },
  pausada: { texto: "Pausada", color: "#b54708", fondo: "#fffaeb" },
};
const AZUL = { color: tinta.acento, fondo: "#eff4ff" };

const fechaHora = (v: string | null) =>
  v ? new Date(v).toLocaleString("es-CL", { timeZone: "America/Santiago", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString("es-CL", { timeZone: "America/Santiago" }) : "");
const claveBloque = (b: Bloque) => `${b.informe}|${JSON.stringify(Object.entries(b.opciones || {}).sort())}`;

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
  const grupos = React.useMemo(() => {
    const m = new Map<string, InformeCatalogo[]>();
    catalogo.forEach((i) => m.set(i.grupo, [...(m.get(i.grupo) || []), i]));
    return [...m.entries()];
  }, [catalogo]);

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
  const valido = b.nombre.trim() && b.bloques.length && (b.frecuencia !== "dias" || b.dias.length);

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

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
        {b.id ? "Editar automatización" : "Nueva automatización"}
        <IconButton onClick={onCerrar} sx={{ ml: "auto" }} aria-label="Cerrar">
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 2.5 }}>
        <Box>
          <Typography sx={etiquetaControlSx}>Nombre</Typography>
          <TextField fullWidth size="small" value={b.nombre} placeholder="Por ejemplo: Cierre diario de ventas" onChange={(e) => setB((x) => ({ ...x, nombre: e.target.value }))} InputProps={{ sx: controlSx }} inputProps={{ maxLength: 120 }} />
        </Box>

        {coincidencias.map((r) => (
          <Aviso key={r.destinatario.id} tono="neutro" icono={<IconInfoCircle size={16} />}>
            <strong>{r.usuarioNombre || r.usuarioCorreo} ya te envía {r.bloques.filter((x) => misClaves.has(claveBloque(x))).map((x) => `«${x.etiqueta}»`).join(", ")}</strong> en «{r.nombre}» ({r.cuando}).
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

        <Box>
          <Typography sx={etiquetaControlSx}>Contenido del correo</Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {b.bloques.length === 0 && <Typography sx={{ fontSize: 12.5, color: tinta.tenue }}>Agrega uno o más informes. Llegan juntos en un mismo correo, en este orden.</Typography>}
            {b.bloques.map((bl, i) => {
              const inf = porId.get(bl.informe);
              return (
                <Box key={i} sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", bgcolor: tinta.fondoSuave, px: 1.5, py: 1, display: "grid", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ color: tinta.tenue, fontWeight: 700, width: 18 }}>{i + 1}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{inf?.nombre ?? bl.informe}</Typography>
                    <Button size="small" onClick={() => quitar(i)} sx={{ ml: "auto", textTransform: "none" }}>
                      Quitar
                    </Button>
                  </Box>
                  {!inf && <Typography sx={{ fontSize: 12, color: estado.mal.color }}>Ya no tienes permiso para este informe: quítalo para guardar.</Typography>}
                  {inf?.opciones.map((o) => (
                    <Box key={o.clave} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: 12, color: tinta.secundaria, minWidth: 80 }}>{o.titulo}</Typography>
                      <Pildoras etiqueta={o.titulo} opciones={o.valores} valor={bl.opciones[o.clave] ?? o.defecto} onCambiar={(v) => cambiarOpcion(i, o.clave, v)} />
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
          <Box sx={{ border: `1px dashed ${tinta.borde}`, borderRadius: "12px", px: 1.5, py: 1, mt: 1 }}>
            <Typography sx={{ ...etiquetaControlSx, mb: 0 }}>Agregar informe</Typography>
            {grupos.map(([grupo, informes]) => (
              <Box key={grupo} sx={{ mt: 0.75 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: ".05em", mb: 0.5 }}>{grupo}</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {informes.map((i) => (
                    <Button key={i.id} size="small" variant="outlined" startIcon={<IconPlus size={14} />} onClick={() => agregarInforme(i)} sx={{ textTransform: "none", borderRadius: 999, fontWeight: 600 }}>
                      {i.nombre}
                    </Button>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

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
                    <Button key={i} size="small" variant={on ? "contained" : "outlined"} disableElevation onClick={() => alternarDia(i + 1)} aria-pressed={on} sx={{ minWidth: 34, px: 0, fontWeight: 700 }}>
                      {d}
                    </Button>
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
          <Box>
            <Typography sx={etiquetaControlSx}>Adjuntar</Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[
                { valor: "excel", texto: "Excel" },
                { valor: "pdf", texto: "PDF" },
              ].map((a) => {
                const on = b.adjuntos.includes(a.valor);
                return (
                  <Button key={a.valor} size="small" variant={on ? "contained" : "outlined"} disableElevation onClick={() => alternarAdjunto(a.valor)} aria-pressed={on} sx={{ textTransform: "none", fontWeight: 700 }}>
                    {a.texto}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Box>
          <Typography sx={etiquetaControlSx}>Se envía a</Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, border: `1px solid ${tinta.borde}`, borderRadius: "10px", px: 1.25, py: 0.75 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Tu cuenta</Typography>
              <Typography sx={{ fontSize: 12, color: tinta.tenue }}>{miCorreo} · siempre incluido</Typography>
            </Box>
            {b.destinatarios.map((c) => {
              const d = estadoDe(c);
              const deBaja = d?.estado === "baja";
              return (
                <Box key={c} sx={{ display: "flex", alignItems: "center", gap: 1, border: `1px solid ${tinta.borde}`, borderRadius: "10px", px: 1.25, py: 0.75 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, textDecoration: deBaja ? "line-through" : "none", color: deBaja ? tinta.tenue : tinta.primaria }}>{c}</Typography>
                  <Typography sx={{ fontSize: 12, color: tinta.tenue }}>
                    {deBaja ? `Se dio de baja el ${fecha(d?.bajaEn ?? null)}` : d ? `Recibe desde el ${fecha(d.creadoEn)}` : "Recibirá desde el próximo envío"}
                  </Typography>
                  <Box sx={{ ml: "auto" }}>
                    <Etiqueta texto={deBaja ? "De baja" : d ? "Recibe" : "Nuevo"} {...(deBaja ? { color: "#b54708", fondo: "#fffaeb" } : d ? estado.bien : AZUL)} />
                  </Box>
                  <Button size="small" onClick={() => setB((x) => ({ ...x, destinatarios: x.destinatarios.filter((y) => y !== c) }))} sx={{ textTransform: "none" }}>
                    Quitar
                  </Button>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Agregar otro correo"
              value={nuevoCorreo}
              onChange={(e) => setNuevoCorreo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarCorreo();
                }
              }}
              InputProps={{ sx: controlSx }}
            />
            <Button variant="outlined" onClick={agregarCorreo} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
              Agregar
            </Button>
          </Box>
          <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mt: 0.5 }}>
            Cada persona que agregues recibe un enlace para dejar de recibirlo. A quien se dio de baja no se le vuelve a enviar, aunque lo agregues de nuevo.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: "auto" }}>
          <Switch checked={b.activa} onChange={(e) => setB((x) => ({ ...x, activa: e.target.checked }))} inputProps={{ "aria-label": "Activa" }} />
          <Typography sx={{ fontSize: 13 }}>{b.activa ? "Activa" : "En pausa"}</Typography>
        </Box>
        <Button onClick={onCerrar} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button variant="contained" disableElevation disabled={!valido || guardando} onClick={guardar} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
          {guardando ? "Guardando…" : b.id ? "Guardar" : "Guardar y activar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Historial ────────────────────────────────────────────────────────────────

function Historial({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const h = useApiDatos<{ data: Envio[] }>(abierto ? `${API}/historial?limite=200` : null, { data: [] });
  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", fontWeight: 800 }}>
        Historial de envíos
        <IconButton onClick={onCerrar} sx={{ ml: "auto" }} aria-label="Cerrar">
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
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
                  <TableCell colSpan={4} sx={{ color: tinta.tenue, textAlign: "center", py: 3 }}>
                    Todavía no hay envíos.
                  </TableCell>
                </TableRow>
              ) : (
                h.datos.data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{fechaHora(e.enviadoEn)}</TableCell>
                    <TableCell>
                      {e.nombre}
                      {e.tipo === "prueba" && <Typography component="span" sx={{ fontSize: 11, color: tinta.tenue }}> · prueba</Typography>}
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
  const visibles = mias.filter((a) => filtro === "todas" || (filtro === "activas" ? a.activa : !a.activa));
  const proxima = mias.filter((a) => a.activa && a.proximoEnvio).sort((x, y) => String(x.proximoEnvio).localeCompare(String(y.proximoEnvio)))[0];
  const ultima = [...mias].filter((a) => a.ultimoEnvio).sort((x, y) => String(y.ultimoEnvio).localeCompare(String(x.ultimoEnvio)))[0];

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
    { titulo: "Próximo envío", valor: proxima ? fechaHora(proxima.proximoEnvio) : "—", pie: proxima?.nombre ?? "" },
    { titulo: "Último envío", valor: ultima ? fechaHora(ultima.ultimoEnvio) : "—", pie: ultima ? ESTADO_ENVIO[ultima.ultimoEstado ?? ""]?.texto ?? "" : "" },
    { titulo: "Te envían otras personas", valor: String((datos?.recibidas ?? []).filter((r) => r.destinatario.estado === "activo").length), pie: "automatizaciones activas a tu correo" },
  ];

  return (
    <PageContainer title="Automatizaciones" description="Informes que llegan solos por correo">
      <Box sx={{ maxWidth: 1400, mx: "auto", display: "grid", gap: 2 }}>
        <Box sx={{ ...tarjetaSx, px: { xs: 1.5, md: 2.5 }, py: 2, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800 }}>Automatizaciones</Typography>
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
              Recibe informes por correo, a la hora y los días que elijas. Llegan a {datos?.correo ?? "tu correo"} y a quien agregues.
            </Typography>
          </Box>
          <Box sx={{ ml: { md: "auto" }, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<IconHistory size={16} />} onClick={() => setHistorial(true)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
              Historial de envíos
            </Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<IconPlus size={16} />}
              onClick={() => setEditor({ abierto: true, borrador: nuevoBorrador(), existentes: [] })}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
            >
              Nueva automatización
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          {tarjetas.map((t) => (
            <Box key={t.titulo} sx={{ ...tarjetaSx, px: 1.5, py: 1.25, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: tinta.secundaria }}>{t.titulo}</Typography>
              <Typography sx={{ fontSize: 19, fontWeight: 750 }}>{listado.cargando ? "…" : t.valor}</Typography>
              <Typography noWrap sx={{ fontSize: 11.5, color: tinta.tenue }}>
                {t.pie}
              </Typography>
            </Box>
          ))}
        </Box>

        <Panel
          titulo="Mis automatizaciones"
          descripcion="Si otra persona programa el mismo informe con el mismo período, se calcula una sola vez en el día y se reutiliza. Si pierdes el permiso de un informe, la automatización se pausa y te avisamos."
          accion={
            <Pildoras
              etiqueta="Filtrar"
              opciones={[
                { valor: "todas" as const, texto: "Todas" },
                { valor: "activas" as const, texto: "Activas" },
                { valor: "pausa" as const, texto: "En pausa" },
              ]}
              valor={filtro}
              onCambiar={setFiltro}
            />
          }
          sx={{ p: 0, pt: 2.5, "& > div:first-of-type": { px: { xs: 1.5, sm: 2.5 } } }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ ...tablaSx, minWidth: 1050 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "18%" }}>Nombre</TableCell>
                  <TableCell sx={{ width: "24%" }}>Contenido</TableCell>
                  <TableCell sx={{ width: "12%" }}>Cuándo</TableCell>
                  <TableCell sx={{ width: "20%" }}>Se envía a</TableCell>
                  <TableCell sx={{ width: "8%" }}>Adjuntos</TableCell>
                  <TableCell sx={{ width: "10%" }}>Último envío</TableCell>
                  <TableCell sx={{ width: "8%" }} align="right">
                    Activa
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listado.cargando && !datos ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ) : visibles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", color: tinta.tenue, py: 4 }}>
                      {mias.length ? "No hay automatizaciones con este filtro." : "Todavía no tienes automatizaciones. Crea la primera con «Nueva automatización»."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibles.map((a) => {
                    const est = a.ultimoEstado ? ESTADO_ENVIO[a.ultimoEstado] : null;
                    return (
                      <TableRow key={a.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{a.nombre}</Typography>
                          <Box sx={{ display: "flex", gap: 0.25, mt: 0.25 }}>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => setEditor({ abierto: true, borrador: desdeAutomatizacion(a), existentes: a.destinatarios })} aria-label={`Editar ${a.nombre}`}>
                                <IconPencil size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Enviarme una prueba ahora">
                              <span>
                                <IconButton size="small" disabled={probando === a.id} onClick={() => probar(a)} aria-label={`Probar ${a.nombre}`}>
                                  <IconSend size={15} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" onClick={() => setABorrar(a)} aria-label={`Eliminar ${a.nombre}`}>
                                <IconTrash size={15} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {a.bloques.map((b, i) => (
                              <Etiqueta key={i} texto={b.etiqueta ?? b.informe} {...AZUL} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{a.cuando}</Typography>
                          {a.activa && a.proximoEnvio && <Typography sx={{ fontSize: 11, color: tinta.tenue }}>Próximo: {fechaHora(a.proximoEnvio)}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {a.destinatarios.map((d) =>
                              d.esDueno ? (
                                <Etiqueta key={d.id} texto="Tú" color={tinta.secundaria} fondo="#f1f5f9" />
                              ) : d.estado === "baja" ? (
                                <Tooltip key={d.id} title={`Usó «Dejar de recibir» el ${fecha(d.bajaEn)}`}>
                                  <span>
                                    <Etiqueta texto={`${d.correo} · se dio de baja ${fecha(d.bajaEn)}`} color="#b54708" fondo="#fffaeb" />
                                  </span>
                                </Tooltip>
                              ) : (
                                <Etiqueta key={d.id} texto={d.correo} {...estado.bien} />
                              )
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {a.adjuntos.length ? a.adjuntos.map((x) => <Etiqueta key={x} texto={x === "pdf" ? "PDF" : "Excel"} color={tinta.secundaria} fondo="#f1f5f9" />) : <Typography sx={{ fontSize: 12, color: tinta.tenue }}>Sin adjuntos</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5 }}>{fechaHora(a.ultimoEnvio)}</Typography>
                          {!a.activa ? (
                            <Tooltip title={a.pausaMotivo || ""}>
                              <span>
                                <Etiqueta texto="En pausa" color="#b54708" fondo="#fffaeb" />
                              </span>
                            </Tooltip>
                          ) : est ? (
                            <Tooltip title={a.ultimoError || ""}>
                              <span>
                                <Etiqueta texto={est.texto} color={est.color} fondo={est.fondo} />
                              </span>
                            </Tooltip>
                          ) : null}
                        </TableCell>
                        <TableCell align="right">
                          <Switch checked={a.activa} onChange={(e) => activar(a, e.target.checked)} inputProps={{ "aria-label": `Activa ${a.nombre}` }} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
          {mias.some((a) => a.pausaMotivo && !a.activa) && (
            <Box sx={{ px: 2.5, pb: 2 }}>
              <Aviso tono="mal" icono={<IconAlertTriangle size={16} />}>
                {mias.filter((a) => a.pausaMotivo && !a.activa).map((a) => `«${a.nombre}»: ${a.pausaMotivo}`).join(" · ")}
              </Aviso>
            </Box>
          )}
        </Panel>

        <Panel
          titulo="Te las envían otras personas"
          descripcion="Automatizaciones de otros que llegan a tu correo. Puedes dejar de recibir cualquiera sin afectar las demás."
          sx={{ p: 0, pt: 2.5, "& > div:first-of-type": { px: { xs: 1.5, sm: 2.5 } } }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ ...tablaSx, minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "24%" }}>Nombre</TableCell>
                  <TableCell sx={{ width: "20%" }}>La envía</TableCell>
                  <TableCell sx={{ width: "30%" }}>Contenido</TableCell>
                  <TableCell sx={{ width: "12%" }}>Cuándo</TableCell>
                  <TableCell sx={{ width: "14%" }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {(datos?.recibidas ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", color: tinta.tenue, py: 3 }}>
                      Nadie más te envía informes.
                    </TableCell>
                  </TableRow>
                ) : (
                  (datos?.recibidas ?? []).map((r) => {
                    const deBaja = r.destinatario.estado === "baja";
                    return (
                      <TableRow key={r.destinatario.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: 13, textDecoration: deBaja ? "line-through" : "none", color: deBaja ? tinta.tenue : tinta.primaria }}>{r.nombre}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>{deBaja ? `Dejaste de recibirla el ${fecha(r.destinatario.bajaEn)}` : `Desde el ${fecha(r.destinatario.desde)}`}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: 12.5 }}>{r.usuarioNombre || r.usuarioCorreo}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>{r.usuarioCorreo}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {r.bloques.map((b, i) => (
                              <Etiqueta key={i} texto={b.etiqueta ?? b.informe} {...(deBaja ? { color: tinta.secundaria, fondo: "#f1f5f9" } : AZUL)} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5 }}>{r.cuando}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant={deBaja ? "text" : "outlined"} onClick={() => cambiarRecibida(r, deBaja ? "alta" : "baja")} sx={{ textTransform: "none", fontWeight: 700 }}>
                            {deBaja ? "Volver a recibir" : "Dejar de recibir"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        </Panel>
      </Box>

      <Editor
        abierto={editor.abierto}
        inicial={editor.borrador}
        catalogo={catalogo.datos.informes}
        miCorreo={datos?.correo ?? ""}
        existentes={editor.existentes}
        recibidas={datos?.recibidas ?? []}
        onCerrar={() => setEditor((e) => ({ ...e, abierto: false }))}
        onGuardado={() => {
          setEditor((e) => ({ ...e, abierto: false }));
          recargar();
        }}
        onDejarDeRecibir={(r) => cambiarRecibida(r, "baja")}
      />
      <Historial abierto={historial} onCerrar={() => setHistorial(false)} />
      <Dialog open={!!aBorrar} onClose={() => setABorrar(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Eliminar «{aBorrar?.nombre}»?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: tinta.secundaria }}>Deja de enviarse a ti y a todos sus destinatarios. No se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setABorrar(null)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" disableElevation onClick={borrar} sx={{ textTransform: "none", fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
