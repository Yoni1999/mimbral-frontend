"use client";

import React from "react";
import { Alert, Box, Button, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { IconDownload } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { BACKEND_URL } from "@/config";
import { apiJson } from "@/utils/apiClient";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { conPeriodoRapido, etiquetaRango, rangoInicial, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { Columnas, Panel, Pildoras, cifraSx, formatoMonto, formatoPesos, formatoPorcentaje, tablaSx, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { descargarExcel } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/comun";
import HeaderMl, { RangoMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";

// ── Tipos de la respuesta (analysis-service /api/pagos) ──────────────────────

type Doc = "boleta" | "factura" | "sin_documento";
interface Cifra {
  ventas: number;
  monto: number;
}
interface Medio {
  medio: string;
  nombre: string;
  pagos: number;
  monto: number;
}
interface CanalPagos {
  canal: string;
  nombre: string;
  grupo: string;
  ventas: number;
  total: number;
  ticketPromedio: number;
  documentos: Record<Doc, Cifra>;
  medios: Medio[];
  pagos: number;
  pagosMonto: number;
  diferenciaRedondeo: number;
  pagosDivididos: number;
  condicionesCredito: { condicion: string; ventas: number; monto: number }[];
}
interface Observacion {
  canal: string;
  ref: string;
  folio: string | null;
  monto: number;
  tipo: string;
  texto: string;
}
interface ResumenPagos {
  periodo: { desde: string; hasta: string; dias: number };
  medios: { medio: string; nombre: string }[];
  canales: CanalPagos[];
  total: { ventas: number; total: number; documentos: Record<Doc, Cifra>; medios: Medio[] };
  observaciones: Observacion[];
}
interface FilaDetalle {
  fecha: string;
  canal: string;
  pedido: string;
  folio: string | null;
  documento: Doc;
  total: number;
  medios: { medio: string; monto: number }[];
  condicion: string | null;
  estadoFinanzas: string | null;
}

// Columnas del resumen: los medios que pide el informe; el resto va en "Otros medios".
const COLUMNAS_MEDIO = ["credito", "debito", "efectivo", "transferencia", "cuenta_corriente", "cheque"];
const NOMBRE_DOC: Record<Doc, string> = { boleta: "Boleta", factura: "Factura", sin_documento: "Sin documento" };
const MAX_DIAS = 31;
const DIA = 86_400_000;

type Filtros = RangoMl & { canal: string };
const inicial = (): Filtros => ({ canal: "todos", ...rangoInicial() });
const urlPagos = (endpoint: "resumen" | "detalle", q: Record<string, string>) => `${BACKEND_URL}/api/pagos/${endpoint}?${new URLSearchParams(q).toString()}`;
const cantidad = (v: number) => v.toLocaleString("es-CL");
const fechaCorta = (f: string) => f.split("-").reverse().join("-");
const diasDe = (r: RangoMl) => Math.round((Date.parse(r.fechaFin) - Date.parse(r.fechaInicio)) / DIA) + 1;
const montoMedio = (c: { medios: Medio[] }, id: string) => c.medios.find((m) => m.medio === id)?.monto ?? 0;
const otrosMedios = (c: { medios: Medio[] }) => c.medios.filter((m) => !COLUMNAS_MEDIO.includes(m.medio)).reduce((s, m) => s + m.monto, 0);
const nombreCorto = (c: CanalPagos) => c.nombre.replace(" · Cajas de tienda (POS)", "").replace("Retail Pro · ", "").replace(" (tienda web)", "");

function Tarjetas({ items, cargando }: { items: { titulo: string; valor: React.ReactNode; pie: React.ReactNode }[]; cargando: boolean }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: `repeat(${items.length}, 1fr)` }, gap: 1.5, mb: 2 }}>
      {items.map((r) => (
        <Box key={r.titulo} sx={{ ...tarjetaSx, px: 1.5, py: 1.25, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: tinta.secundaria }}>{r.titulo}</Typography>
          <Typography component="div" sx={{ fontSize: 20, fontWeight: 750, color: tinta.primaria, ...cifraSx }}>
            {cargando ? "…" : r.valor}
          </Typography>
          <Typography component="div" noWrap sx={{ fontSize: 11.5, color: tinta.tenue }}>
            {r.pie}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/** Tabla de cuatro columnas: concepto, cantidad, monto y % del total. */
function TablaCifras({ filas, total, etiqueta, unidad, cargando }: { filas: { nombre: string; n: number; monto: number }[]; total: { n: number; monto: number }; etiqueta: string; unidad: string; cargando: boolean }) {
  const base = total.monto || 1;
  return (
    <Table size="small" sx={tablaSx}>
      <Columnas anchos={[46, 16, 24, 14]} />
      <TableHead>
        <TableRow>
          <TableCell>{etiqueta}</TableCell>
          <TableCell align="right">{unidad}</TableCell>
          <TableCell align="right">Monto</TableCell>
          <TableCell align="right">%</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={4}>
                  <Skeleton width="90%" />
                </TableCell>
              </TableRow>
            ))
          : filas.map((f) => (
              <TableRow key={f.nombre} sx={f.n === 0 ? { "& td": { color: tinta.tenue } } : undefined}>
                <TableCell>{f.nombre}</TableCell>
                <TableCell align="right" sx={cifraSx}>{cantidad(f.n)}</TableCell>
                <TableCell align="right" sx={cifraSx}>{formatoPesos(f.monto)}</TableCell>
                <TableCell align="right" sx={cifraSx}>{f.monto ? formatoPorcentaje((100 * f.monto) / base) : "–"}</TableCell>
              </TableRow>
            ))}
        {!cargando && (
          <TableRow sx={{ "& td": { fontWeight: 750, borderTop: `1.5px solid ${tinta.secundaria}` } }}>
            <TableCell>Total</TableCell>
            <TableCell align="right" sx={cifraSx}>{cantidad(total.n)}</TableCell>
            <TableCell align="right" sx={cifraSx}>{formatoPesos(total.monto)}</TableCell>
            <TableCell />
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

const filasDocs = (d: Record<Doc, Cifra>) =>
  (Object.keys(NOMBRE_DOC) as Doc[]).filter((k) => k !== "sin_documento" || d[k].ventas > 0).map((k) => ({ nombre: NOMBRE_DOC[k], n: d[k].ventas, monto: d[k].monto }));
const filasMedios = (m: Medio[]) => m.map((x) => ({ nombre: x.nombre, n: x.pagos, monto: x.monto }));

function SeccionCanal({ c, observaciones }: { c: CanalPagos; observaciones: Observacion[] }) {
  const notas: React.ReactNode[] = observaciones.map((o) => o.texto);
  if (c.pagosDivididos > 0) notas.push(`${cantidad(c.pagosDivididos)} ventas se pagaron con más de un medio: hay ${cantidad(c.pagos)} pagos para ${cantidad(c.ventas)} ventas.`);
  if (c.diferenciaRedondeo !== 0) notas.push(`Los pagos suman ${formatoPesos(c.pagosMonto)} y los documentos ${formatoPesos(c.total)} (diferencia de ${formatoPesos(c.diferenciaRedondeo)} por redondeo).`);
  return (
    <Panel titulo={c.nombre} descripcion={`${cantidad(c.ventas)} ventas · ${formatoPesos(c.total)} · ticket promedio ${formatoPesos(c.ticketPromedio)}`} sx={{ mb: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" }, gap: 2, alignItems: "start" }}>
        <Box sx={{ overflowX: "auto" }}>
          <TablaCifras etiqueta="Documento" unidad="Ventas" filas={filasDocs(c.documentos)} total={{ n: c.ventas, monto: c.total }} cargando={false} />
          {c.condicionesCredito.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tinta.secundaria, mb: 0.5 }}>Ventas a crédito según condición</Typography>
              <TablaCifras
                etiqueta="Condición"
                unidad="Ventas"
                filas={c.condicionesCredito.map((x) => ({ nombre: x.condicion, n: x.ventas, monto: x.monto }))}
                total={{ n: c.condicionesCredito.reduce((s, x) => s + x.ventas, 0), monto: c.condicionesCredito.reduce((s, x) => s + x.monto, 0) }}
                cargando={false}
              />
            </Box>
          )}
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <TablaCifras etiqueta="Medio de pago" unidad="Pagos" filas={filasMedios(c.medios)} total={{ n: c.pagos, monto: c.pagosMonto }} cargando={false} />
        </Box>
      </Box>
      {notas.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 2.5, color: tinta.secundaria, fontSize: 12.5 }}>
          {notas.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </Box>
      )}
    </Panel>
  );
}

/**
 * Ventas por canal y medio de pago: por cada canal (cajas de tienda, los dos de
 * Retail Pro, Mercado Libre, Falabella y VTEX) cuántas ventas fueron con boleta
 * o factura y cómo se pagaron (tarjeta de crédito o débito, efectivo,
 * transferencia, crédito, cheque…), con el total de todo lo vendido. Fuente:
 * pedidos del OMS y pagos que finanzas lleva a SAP.
 */
export default function InformePagos() {
  const [filtros, setFiltros] = useEstadoVista<Filtros>("informe-pagos", inicial, {
    serializar: conPeriodoRapido,
    restaurar: (g) => ({ ...inicial(), ...resolverPeriodoRapido<Filtros>(g) }),
  });
  const [descargando, setDescargando] = React.useState(false);
  const dias = filtros.fechaInicio && filtros.fechaFin ? diasDe(filtros) : 0;
  const rangoValido = dias > 0 && dias <= MAX_DIAS;
  const consulta = { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin };
  const resumen = useApiDatos<ResumenPagos | null>(rangoValido ? urlPagos("resumen", consulta) : null, null);
  const r = resumen.datos;

  const opcionesCanal = [{ valor: "todos", texto: "Todos" }, ...(r?.canales ?? []).map((c) => ({ valor: c.canal, texto: nombreCorto(c) }))];
  const visibles = (r?.canales ?? []).filter((c) => filtros.canal === "todos" || c.canal === filtros.canal);
  const vista = filtros.canal === "todos" ? r?.total : visibles[0] ? { ...visibles[0], documentos: visibles[0].documentos } : undefined;
  const cargando = resumen.cargando;

  const tarjetas = [
    { titulo: "Total vendido", valor: formatoMonto(vista?.total), pie: "IVA incluido" },
    { titulo: "Ventas", valor: cantidad(vista?.ventas ?? 0), pie: vista?.ventas ? `ticket promedio ${formatoPesos(Math.round((vista.total || 0) / vista.ventas))}` : "" },
    { titulo: "Boletas", valor: cantidad(vista?.documentos.boleta.ventas ?? 0), pie: formatoPesos(vista?.documentos.boleta.monto) },
    { titulo: "Facturas", valor: cantidad(vista?.documentos.factura.ventas ?? 0), pie: formatoPesos(vista?.documentos.factura.monto) },
    { titulo: "Con tarjeta", valor: formatoMonto(vista ? montoMedio(vista, "credito") + montoMedio(vista, "debito") : 0), pie: vista ? `crédito ${formatoMonto(montoMedio(vista, "credito"))} · débito ${formatoMonto(montoMedio(vista, "debito"))}` : "" },
  ];

  const exportar = async () => {
    if (!r) return;
    setDescargando(true);
    try {
      const nombre = new Map(r.medios.map((m) => [m.medio, m.nombre]));
      const det: { data: FilaDetalle[] } = await apiJson(urlPagos("detalle", { ...consulta, ...(filtros.canal !== "todos" ? { canal: filtros.canal } : {}) }));
      const resumenFilas = [...visibles, ...(filtros.canal === "todos" ? [{ ...r.total, canal: "TOTAL", nombre: "Total" } as unknown as CanalPagos] : [])].map((c) => ({
        Canal: c.nombre,
        Ventas: c.ventas,
        Boletas: c.documentos.boleta.ventas,
        "Monto boletas": c.documentos.boleta.monto,
        Facturas: c.documentos.factura.ventas,
        "Monto facturas": c.documentos.factura.monto,
        ...Object.fromEntries(r.medios.map((m) => [m.nombre, montoMedio(c, m.medio)])),
        "Total vendido": c.total,
      }));
      await descargarExcel(`ventas_por_medio_de_pago_${filtros.fechaInicio}_${filtros.fechaFin}${filtros.canal !== "todos" ? `_${filtros.canal}` : ""}`, [
        { nombre: "Resumen", filas: resumenFilas },
        {
          nombre: "Ventas",
          filas: det.data.map((f) => ({
            Fecha: fechaCorta(f.fecha),
            Canal: f.canal,
            Pedido: f.pedido,
            Folio: f.folio ?? "",
            Documento: NOMBRE_DOC[f.documento],
            Total: f.total,
            "Medio de pago": f.medios.map((m) => nombre.get(m.medio) ?? m.medio).join(" + "),
            "Detalle de pagos": f.medios.map((m) => `${nombre.get(m.medio) ?? m.medio} ${m.monto}`).join(" · "),
            "Condición crédito": f.condicion ?? "",
            "Estado en finanzas": f.estadoFinanzas ?? "",
          })),
        },
        { nombre: "Observaciones", filas: r.observaciones.map((o) => ({ Canal: o.canal, Pedido: o.ref, Folio: o.folio ?? "", Monto: o.monto, Observación: o.texto })) },
      ]);
    } finally {
      setDescargando(false);
    }
  };

  const enEstadoInicial = filtros.canal === "todos" && etiquetaRango(filtros.fechaInicio, filtros.fechaFin) === "Ayer";

  return (
    <PageContainer title="Ventas por medio de pago" description="Ventas por canal, documento y medio de pago">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Ventas por canal y medio de pago"
          contexto={filtros.canal === "todos" ? "Todos los canales" : opcionesCanal.find((o) => o.valor === filtros.canal)?.texto}
          rango={filtros}
          onRango={(x) => setFiltros((f) => ({ ...f, ...x }))}
          enEstadoInicial={enEstadoInicial}
          onLimpiar={() => setFiltros(inicial())}
          acciones={
            <Button
              variant="contained"
              disableElevation
              startIcon={<IconDownload size={16} />}
              disabled={descargando || cargando || !r || r.total.ventas === 0}
              onClick={exportar}
              sx={{ textTransform: "none", borderRadius: "10px", height: 34, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              <span className="boton-texto">{descargando ? "Generando…" : "Excel"}</span>
            </Button>
          }
        >
          <Pildoras etiqueta="Canal" opciones={opcionesCanal} valor={filtros.canal} onCambiar={(c) => setFiltros((f) => ({ ...f, canal: c }))} />
        </HeaderMl>

        {!rangoValido ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Elige un rango de hasta {MAX_DIAS} días.
          </Alert>
        ) : resumen.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {resumen.error instanceof Error ? resumen.error.message : "No se pudo cargar el informe."}
          </Alert>
        ) : null}

        <Typography sx={{ fontSize: 12, color: tinta.secundaria, mb: 1.5 }}>
          {r ? (
            <>
              Ventas del <strong>{fechaCorta(r.periodo.desde)}</strong> al <strong>{fechaCorta(r.periodo.hasta)}</strong>.{" "}
            </>
          ) : null}
          Montos con IVA. Medio de pago según los pagos que finanzas lleva a SAP; las facturas sin pago se cuentan como crédito. No descuenta notas de crédito.
        </Typography>

        <Tarjetas items={tarjetas} cargando={cargando} />

        {filtros.canal === "todos" && (
          <Panel titulo="Resumen por canal" descripcion="Ventas, documentos y monto por medio de pago de cada canal" sx={{ mb: 2 }}>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ ...tablaSx, minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Canal</TableCell>
                    <TableCell align="right">Ventas</TableCell>
                    <TableCell align="right">Boletas</TableCell>
                    <TableCell align="right">Facturas</TableCell>
                    {COLUMNAS_MEDIO.map((m) => (
                      <TableCell key={m} align="right">
                        {r?.medios.find((x) => x.medio === m)?.nombre ?? m}
                      </TableCell>
                    ))}
                    <TableCell align="right">Otros medios</TableCell>
                    <TableCell align="right">Total vendido</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargando || !r ? (
                    <TableRow>
                      <TableCell colSpan={COLUMNAS_MEDIO.length + 6}>
                        <Skeleton width="90%" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...r.canales.map((c) => ({ clave: c.canal, nombre: nombreCorto(c), c })), { clave: "TOTAL", nombre: "Total", c: r.total }].map(({ clave, nombre, c }) => (
                      <TableRow key={clave} hover={clave !== "TOTAL"} onClick={clave !== "TOTAL" ? () => setFiltros((f) => ({ ...f, canal: clave })) : undefined} sx={clave === "TOTAL" ? { "& td": { fontWeight: 750, borderTop: `1.5px solid ${tinta.secundaria}` } } : { cursor: "pointer" }}>
                        <TableCell>{nombre}</TableCell>
                        <TableCell align="right" sx={cifraSx}>{cantidad(c.ventas)}</TableCell>
                        <TableCell align="right" sx={cifraSx}>{cantidad(c.documentos.boleta.ventas)}</TableCell>
                        <TableCell align="right" sx={cifraSx}>{cantidad(c.documentos.factura.ventas)}</TableCell>
                        {COLUMNAS_MEDIO.map((m) => (
                          <TableCell key={m} align="right" sx={cifraSx}>
                            {montoMedio(c, m) ? formatoPesos(montoMedio(c, m)) : "–"}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={cifraSx}>{otrosMedios(c) ? formatoPesos(otrosMedios(c)) : "–"}</TableCell>
                        <TableCell align="right" sx={{ ...cifraSx, fontWeight: 750 }}>{formatoPesos(c.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1 }}>
              Otros medios: Mercado Pago, pagos cobrados por Falabella, nota de crédito y pagos sin registrar en finanzas. Pulsa un canal para ver su detalle.
            </Typography>
          </Panel>
        )}

        {!cargando && r && visibles.map((c) => <SeccionCanal key={c.canal} c={c} observaciones={r.observaciones.filter((o) => o.canal === c.canal)} />)}

        {filtros.canal === "todos" && r && !cargando && (
          <Panel titulo="Total general" descripcion={`${cantidad(r.total.ventas)} ventas · ${formatoPesos(r.total.total)}`} sx={{ mb: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" }, gap: 2, alignItems: "start" }}>
              <Box sx={{ overflowX: "auto" }}>
                <TablaCifras etiqueta="Canal" unidad="Ventas" filas={r.canales.map((c) => ({ nombre: c.nombre, n: c.ventas, monto: c.total }))} total={{ n: r.total.ventas, monto: r.total.total }} cargando={false} />
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <TablaCifras
                  etiqueta="Medio de pago"
                  unidad="Pagos"
                  filas={filasMedios(r.total.medios)}
                  total={{ n: r.total.medios.reduce((s, m) => s + m.pagos, 0), monto: r.total.medios.reduce((s, m) => s + m.monto, 0) }}
                  cargando={false}
                />
              </Box>
            </Box>
          </Panel>
        )}
      </Box>
    </PageContainer>
  );
}
