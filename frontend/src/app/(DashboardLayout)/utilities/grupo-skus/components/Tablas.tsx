"use client";

import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import {
  BarraParticipacion,
  CANALES,
  ChipMargen,
  ChipVariacion,
  Columnas,
  Panel,
  TextoCelda,
  estado,
  formatoMonto,
  formatoPesos,
  formatoPorcentaje,
  tablaSx,
  tinta,
} from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { Buscador, Encabezado, FilasCargando } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/piezas";
import { InventarioProducto, MesProducto, ProductoGrupo, RespuestaInventario, fechaCorta, nombreMes } from "../tipos";

const SIN_IMAGEN = "https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg";
const unidades = (v: number | null | undefined) => Number(v ?? 0).toLocaleString("es-CL", { maximumFractionDigits: 2 });

type Orden = { orden: string; direccion: "asc" | "desc" };

/** Orden y búsqueda en el navegador (son hasta 100 filas). */
function useOrden<T>(filas: T[], valor: (fila: T, columna: string) => number | string | null | undefined, inicial: Orden, texto: (f: T) => string) {
  const [orden, setOrden] = React.useState<Orden>(inicial);
  const [buscar, setBuscar] = React.useState("");
  const ordenarPor = (columna: string) =>
    setOrden((o) => (o.orden === columna ? { orden: columna, direccion: o.direccion === "asc" ? "desc" : "asc" } : { orden: columna, direccion: "desc" }));
  const visibles = React.useMemo(() => {
    const q = buscar.trim().toLowerCase();
    const lista = q ? filas.filter((f) => texto(f).toLowerCase().includes(q)) : [...filas];
    const signo = orden.direccion === "asc" ? 1 : -1;
    return lista.sort((a, b) => {
      const x = valor(a, orden.orden);
      const y = valor(b, orden.orden);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === "string" ? x.localeCompare(String(y)) : Number(x) - Number(y)) * signo;
    });
  }, [filas, buscar, orden, valor, texto]);
  return { orden, ordenarPor, buscar, setBuscar, visibles };
}

function Foto({ src }: { src?: string | null }) {
  return (
    <Box
      component="img"
      src={src || SIN_IMAGEN}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.onerror = null;
        img.src = SIN_IMAGEN;
      }}
      alt=""
      sx={{ width: 30, height: 30, objectFit: "contain", borderRadius: "8px", border: `1px solid ${tinta.borde}`, bgcolor: "#fff", flexShrink: 0 }}
    />
  );
}

/** Celda del producto: foto, nombre y SKU (lleva a su análisis individual). */
function CeldaProducto({ p }: { p: { sku: string; nombre?: string | null; imagen?: string | null; existe?: boolean } }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <Foto src={p.imagen} />
      <TextoCelda texto={p.existe === false ? "No existe en el catálogo" : p.nombre || p.sku} secundario={`SKU ${p.sku}`} />
    </Box>
  );
}

const textoProducto = (p: { sku: string; nombre?: string | null }) => `${p.sku} ${p.nombre ?? ""}`;
const irAProducto = (router: ReturnType<typeof useRouter>, sku: string) => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(sku)}`);

const contenedorSx = { mx: -2.5, width: "auto", overflowX: "hidden" } as const;

// ── 1) Productos ────────────────────────────────────────────────────────────

const valorProducto = (p: ProductoGrupo, c: string) =>
  c === "nombre" ? p.nombre ?? p.sku : (p as unknown as Record<string, number | null>)[c];

export function TablaProductos({ productos, cargando, conComparacion }: { productos: ProductoGrupo[]; cargando: boolean; conComparacion: boolean }) {
  const router = useRouter();
  const conMargen = productos.some((p) => p.margen !== undefined);
  const t = useOrden(productos, valorProducto, { orden: "venta", direccion: "desc" }, textoProducto);
  const maxVenta = Math.max(0, ...productos.map((p) => p.venta));

  const anchos = conMargen ? [30, 11, 21, 9, 9, 9, 11] : [36, 12, 24, 10, 8, 10];

  return (
    <Panel
      titulo="Productos del grupo"
      descripcion="Cada SKU en el período. Pulsa uno para ver su análisis individual."
      accion={<Buscador valor={t.buscar} onCambiar={t.setBuscar} placeholder="Buscar SKU o nombre" />}
    >
      {cargando ? (
        <FilasCargando />
      ) : (
        <TableContainer sx={contenedorSx}>
          <Table size="small" sx={tablaSx}>
            <Columnas anchos={anchos} />
            <TableHead>
              <TableRow>
                <Encabezado columna="nombre" texto="Producto" orden={t.orden} onOrdenar={t.ordenarPor} />
                <Encabezado columna="unidades" texto="Unidades" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="venta" texto="Venta · % del grupo" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                {conMargen && <Encabezado columna="margenPorcentaje" texto="% Margen" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />}
                <Encabezado columna="documentos" texto="Ventas" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="clientes" texto="Clientes" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="ncMonto" texto="Notas de crédito" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {t.visibles.map((p) => (
                <TableRow key={p.sku} hover onClick={() => p.existe && irAProducto(router, p.sku)} sx={{ cursor: p.existe ? "pointer" : "default", opacity: p.existe ? 1 : 0.6 }}>
                  <TableCell>
                    <CeldaProducto p={p} />
                  </TableCell>
                  <TableCell align="right">
                    <Box>{unidades(p.unidades)}</Box>
                    {conComparacion && (
                      <Box sx={{ mt: 0.25 }}>
                        <ChipVariacion valor={p.variacionUnidades} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 0.75 }} title={formatoPesos(p.venta)}>
                      {conComparacion && <ChipVariacion valor={p.variacionVenta} />}
                      <strong>{formatoMonto(p.venta)}</strong>
                      <Typography component="span" sx={{ fontSize: 11, color: tinta.tenue }}>
                        {formatoPorcentaje(p.participacion)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <BarraParticipacion valor={p.venta} maximo={maxVenta} />
                    </Box>
                  </TableCell>
                  {conMargen && <TableCell align="right">{p.venta ? <ChipMargen valor={p.margenPorcentaje} /> : "—"}</TableCell>}
                  <TableCell align="right">{p.documentos.toLocaleString("es-CL")}</TableCell>
                  <TableCell align="right">{p.clientes.toLocaleString("es-CL")}</TableCell>
                  <TableCell align="right" sx={{ color: p.ncMonto ? `${estado.mal.color} !important` : undefined }}>
                    {p.ncMonto ? (
                      <Tooltip title={`${p.ncDocumentos} NC · ${unidades(p.ncUnidades)} unidades devueltas`}>
                        <span>{formatoMonto(p.ncMonto)}</span>
                      </Tooltip>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
}

// ── 2) Por canal: SKU × canal ─────────────────────────────────────────────

export function TablaCanales({ productos, cargando, ver }: { productos: ProductoGrupo[]; cargando: boolean; ver: "venta" | "unidades" }) {
  const router = useRouter();
  const valor = React.useCallback(
    (p: ProductoGrupo, c: string) => (c === "nombre" ? p.nombre ?? p.sku : c === "total" ? p[ver] : p.canales.find((x) => x.canal === c)?.[ver] ?? 0),
    [ver]
  );
  const t = useOrden(productos, valor, { orden: "total", direccion: "desc" }, textoProducto);
  const fmt = (v: number) => (ver === "venta" ? formatoMonto(v) : unidades(v));
  const totales = CANALES.map((c) => productos.reduce((s, p) => s + (p.canales.find((x) => x.canal === c.clave)?.[ver] ?? 0), 0));

  return (
    <Panel titulo={ver === "venta" ? "Venta por canal" : "Unidades por canal"} descripcion="Cada SKU repartido en los canales de venta." accion={<Buscador valor={t.buscar} onCambiar={t.setBuscar} placeholder="Buscar SKU o nombre" />}>
      {cargando ? (
        <FilasCargando />
      ) : (
        <TableContainer sx={contenedorSx}>
          <Table size="small" sx={tablaSx}>
            <Columnas anchos={[28, ...CANALES.map(() => 10), 12]} />
            <TableHead>
              <TableRow>
                <Encabezado columna="nombre" texto="Producto" orden={t.orden} onOrdenar={t.ordenarPor} />
                {CANALES.map((c) => (
                  <Encabezado key={c.clave} columna={c.clave} texto={c.nombre} orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                ))}
                <Encabezado columna="total" texto="Total" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total del grupo</TableCell>
                {totales.map((v, i) => (
                  <TableCell key={CANALES[i].clave} align="right" sx={{ fontWeight: 700 }}>
                    {v ? fmt(v) : "—"}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {fmt(totales.reduce((s, v) => s + v, 0))}
                </TableCell>
              </TableRow>
              {t.visibles.map((p) => (
                <TableRow key={p.sku} hover onClick={() => p.existe && irAProducto(router, p.sku)} sx={{ cursor: p.existe ? "pointer" : "default" }}>
                  <TableCell>
                    <CeldaProducto p={p} />
                  </TableCell>
                  {CANALES.map((c) => {
                    const v = p.canales.find((x) => x.canal === c.clave)?.[ver] ?? 0;
                    return (
                      <TableCell key={c.clave} align="right" sx={{ color: v ? undefined : `${tinta.tenue} !important` }}>
                        {v ? fmt(v) : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {fmt(p[ver])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
}

// ── 3) Mensual: SKU × mes ─────────────────────────────────────────────────

export function TablaMensual({
  productos,
  mensual,
  cargando,
  ver,
}: {
  productos: ProductoGrupo[];
  mensual: MesProducto[];
  cargando: boolean;
  ver: "venta" | "unidades";
}) {
  const router = useRouter();
  const meses = React.useMemo(() => [...new Set(mensual.map((m) => m.mes))].sort(), [mensual]);
  const porSku = React.useMemo(() => {
    const mapa = new Map<string, Record<string, number>>();
    for (const m of mensual) {
      if (!mapa.has(m.sku)) mapa.set(m.sku, {});
      mapa.get(m.sku)![m.mes] = m[ver];
    }
    return mapa;
  }, [mensual, ver]);
  const valor = React.useCallback(
    (p: ProductoGrupo, c: string) => (c === "nombre" ? p.nombre ?? p.sku : c === "total" ? p[ver] : porSku.get(p.sku)?.[c] ?? 0),
    [porSku, ver]
  );
  const t = useOrden(productos, valor, { orden: "total", direccion: "desc" }, textoProducto);
  const fmt = (v: number) => (ver === "venta" ? formatoMonto(v) : unidades(v));
  // Con muchos meses la tabla se desplaza a lo ancho, con el producto fijo.
  const anchoMes = 96;

  return (
    <Panel titulo={ver === "venta" ? "Venta por mes" : "Unidades por mes"} descripcion="Cómo se movió cada SKU mes a mes dentro del período." accion={<Buscador valor={t.buscar} onCambiar={t.setBuscar} placeholder="Buscar SKU o nombre" />}>
      {cargando ? (
        <FilasCargando />
      ) : !meses.length ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>Sin ventas en el período.</Typography>
      ) : (
        <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "auto" }}>
          <Table size="small" sx={{ ...tablaSx, minWidth: 300 + (meses.length + 1) * anchoMes }}>
            <colgroup>
              <col style={{ width: 300 }} />
              {meses.map((m) => (
                <col key={m} style={{ width: anchoMes }} />
              ))}
              <col style={{ width: anchoMes }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <Encabezado columna="nombre" texto="Producto" orden={t.orden} onOrdenar={t.ordenarPor} />
                {meses.map((m) => (
                  <Encabezado key={m} columna={m} texto={nombreMes(m)} orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                ))}
                <Encabezado columna="total" texto="Total" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {t.visibles.map((p) => (
                <TableRow key={p.sku} hover onClick={() => p.existe && irAProducto(router, p.sku)} sx={{ cursor: p.existe ? "pointer" : "default" }}>
                  <TableCell>
                    <CeldaProducto p={p} />
                  </TableCell>
                  {meses.map((m) => {
                    const v = porSku.get(p.sku)?.[m] ?? 0;
                    return (
                      <TableCell key={m} align="right" sx={{ color: v ? undefined : `${tinta.tenue} !important` }}>
                        {v ? fmt(v) : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {fmt(p[ver])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
}

// ── 4) Inventario y abastecimiento ─────────────────────────────────────────

const valorInventario = (fila: InventarioProducto & { nombre?: string | null }, c: string) => {
  if (c === "nombre") return fila.nombre ?? fila.sku;
  if (c === "ultimaOc") return fila.ultimaOc?.fecha ?? null;
  if (c === "ultimaVenta") return fila.ultimaVenta;
  return (fila as unknown as Record<string, number | null>)[c];
};

/** Cobertura en chip: rojo si alcanza para menos de 15 días, ámbar bajo 30. */
function ChipCobertura({ dias, stock }: { dias: number | null; stock: number }) {
  if (dias == null) return <span style={{ color: tinta.tenue }}>{stock > 0 ? "Sin venta 30 d" : "—"}</span>;
  const tono = dias < 15 ? estado.mal : dias < 30 ? { color: "#b54708", fondo: "#fffaeb" } : estado.bien;
  return (
    <Box component="span" sx={{ px: 0.75, py: 0.25, borderRadius: 999, bgcolor: tono.fondo, color: tono.color, fontSize: 12, fontWeight: 700 }}>
      {Math.round(dias).toLocaleString("es-CL")} días
    </Box>
  );
}

export function TablaInventario({
  inventario,
  productos,
  cargando,
  error,
}: {
  inventario: RespuestaInventario | null;
  productos: ProductoGrupo[];
  cargando: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const nombres = React.useMemo(() => new Map(productos.map((p) => [p.sku, p])), [productos]);
  const filas = React.useMemo(
    () => (inventario?.productos ?? []).map((i) => ({ ...i, nombre: nombres.get(i.sku)?.nombre, imagen: nombres.get(i.sku)?.imagen, existe: nombres.get(i.sku)?.existe })),
    [inventario, nombres]
  );
  const t = useOrden(filas, valorInventario, { orden: "stockVenta", direccion: "desc" }, textoProducto);
  const bodegasConStock = (i: InventarioProducto) =>
    (inventario?.bodegas ?? [])
      .filter((b) => i.bodegas[b]?.stock)
      .map((b) => `${b}: ${unidades(i.bodegas[b].stock)}`)
      .join(" · ");

  return (
    <Panel
      titulo="Inventario y abastecimiento"
      descripcion={`Stock de venta: bodegas ${(inventario?.bodegasVenta ?? []).join(", ")}. Cobertura = stock de venta ÷ venta diaria de los últimos 30 días (todos los canales).`}
      accion={<Buscador valor={t.buscar} onCambiar={t.setBuscar} placeholder="Buscar SKU o nombre" />}
    >
      {error ? (
        <Typography sx={{ color: tinta.secundaria, fontSize: 13, py: 4, textAlign: "center" }}>
          No se pudo mostrar el inventario: {error}
        </Typography>
      ) : cargando ? (
        <FilasCargando />
      ) : (
        <TableContainer sx={contenedorSx}>
          <Table size="small" sx={tablaSx}>
            <Columnas anchos={[26, 9, 9, 9, 9, 10, 9, 19]} />
            <TableHead>
              <TableRow>
                <Encabezado columna="nombre" texto="Producto" orden={t.orden} onOrdenar={t.ordenarPor} />
                <Encabezado columna="stockVenta" texto="Stock venta" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="comprometido" texto="Comprometido" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="disponible" texto="Disponible" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="unidades30" texto="Vendido 30 d" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="coberturaDias" texto="Cobertura" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="pendienteOc" texto="En OC" orden={t.orden} onOrdenar={t.ordenarPor} align="right" />
                <Encabezado columna="ultimaOc" texto="Última OC · proveedor" orden={t.orden} onOrdenar={t.ordenarPor} />
              </TableRow>
            </TableHead>
            <TableBody>
              {t.visibles.map((i) => (
                <TableRow key={i.sku} hover onClick={() => i.existe && irAProducto(router, i.sku)} sx={{ cursor: i.existe ? "pointer" : "default" }}>
                  <TableCell>
                    <CeldaProducto p={i} />
                  </TableCell>
                  <TableCell align="right" title={bodegasConStock(i) || "Sin stock"}>
                    {unidades(i.stockVenta)}
                    <Typography noWrap sx={{ fontSize: 10.5, color: tinta.tenue }}>
                      {bodegasConStock(i) || " "}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{unidades(i.comprometido)}</TableCell>
                  <TableCell align="right" sx={{ color: i.disponible < 0 ? `${estado.mal.color} !important` : undefined, fontWeight: 600 }}>
                    {unidades(i.disponible)}
                  </TableCell>
                  <TableCell align="right" title={`${unidades(i.unidades90)} en 90 días`}>
                    {unidades(i.unidades30)}
                  </TableCell>
                  <TableCell align="right">
                    <ChipCobertura dias={i.coberturaDias} stock={i.stockVenta} />
                  </TableCell>
                  <TableCell align="right" title={i.proximaEntrega ? `Próxima entrega ${fechaCorta(i.proximaEntrega)}` : undefined}>
                    {i.pendienteOc ? unidades(i.pendienteOc) : "—"}
                  </TableCell>
                  <TableCell>
                    {i.ultimaOc ? (
                      <TextoCelda texto={i.ultimaOc.proveedorNombre} secundario={`${fechaCorta(i.ultimaOc.fecha)} · ${unidades(i.ultimaOc.cantidad)} u`} fuerte={false} />
                    ) : (
                      <span style={{ color: tinta.tenue }}>Sin OC</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
}
