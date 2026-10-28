"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, InputAdornment, Pagination, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import { IconDownload, IconSearch } from "@tabler/icons-react";
import { Columnas, TextoCelda, controlSx, tablaSx, tarjetaSx, tinta } from "../../components/estilo";
import { descargarExcel } from "../../components/detalle/comun";

/** Una columna de un informe de Mercado Libre. */
export interface ColumnaInforme<F> {
  clave: string;
  titulo: string;
  /** Ancho en % (las columnas de la tabla suman 100). */
  ancho: number;
  alinear?: "left" | "right";
  /** Contenido de la celda; sin él se muestra `valor` tal cual. */
  celda?: (f: F) => React.ReactNode;
  /** Valor para ordenar y para el Excel. */
  valor?: (f: F) => string | number | null | undefined;
  /** Nombre de la columna en el Excel (por defecto, el título). Sin `valor` no va al Excel. */
  excel?: string;
  ordenable?: boolean;
}

interface Props<F> {
  filas: F[];
  cargando: boolean;
  columnas: ColumnaInforme<F>[];
  /** Clave única de una fila. */
  clave: (f: F) => string;
  /** Texto donde busca el buscador (SKU, nombre…). */
  textoBusqueda: (f: F) => string;
  ordenInicial: { clave: string; direccion: "asc" | "desc" };
  nombreExcel: string;
  vacio?: string;
  /** Texto a la derecha del buscador (criterio, fuentes). */
  nota?: React.ReactNode;
  /** Columnas extra solo para el Excel. */
  extraExcel?: { titulo: string; valor: (f: F) => string | number | null | undefined }[];
  porPagina?: number;
  /** Ancho mínimo en celular (la tabla se desplaza de lado). */
  anchoMinimo?: number;
}

/**
 * Tabla común de los informes de Mercado Libre: buscador, orden por columna,
 * paginación y descarga a Excel con todas las filas filtradas.
 */
export default function TablaInforme<F>({
  filas,
  cargando,
  columnas,
  clave,
  textoBusqueda,
  ordenInicial,
  nombreExcel,
  vacio = "Sin datos para los filtros elegidos.",
  nota,
  extraExcel = [],
  porPagina = 50,
  anchoMinimo = 900,
}: Props<F>) {
  const [buscar, setBuscar] = React.useState("");
  const [orden, setOrden] = React.useState(ordenInicial);
  const [pagina, setPagina] = React.useState(1);
  const [descargando, setDescargando] = React.useState(false);
  React.useEffect(() => setPagina(1), [filas, buscar, orden]);

  const q = buscar.trim().toLowerCase();
  const col = columnas.find((c) => c.clave === orden.clave);
  const ordenadas = filas
    .filter((f) => !q || textoBusqueda(f).toLowerCase().includes(q))
    .sort((a, b) => {
      if (!col?.valor) return 0;
      const va = col.valor(a);
      const vb = col.valor(b);
      // Los vacíos van siempre al final.
      if (va == null || va === "") return 1;
      if (vb == null || vb === "") return -1;
      const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
      return orden.direccion === "asc" ? r : -r;
    });
  const paginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  const visibles = ordenadas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const exportar = async () => {
    setDescargando(true);
    try {
      await descargarExcel(nombreExcel, [
        {
          nombre: "Informe",
          filas: ordenadas.map((f) =>
            Object.fromEntries([
              ...columnas.filter((c) => c.valor).map((c) => [c.excel ?? c.titulo, c.valor!(f) ?? ""]),
              ...extraExcel.map((e) => [e.titulo, e.valor(f) ?? ""]),
            ])
          ),
        },
      ]);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Box sx={{ ...tarjetaSx, pt: 2, pb: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, px: 2.5, mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar SKU o producto"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          InputProps={{
            sx: controlSx,
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={16} color={tinta.tenue} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />
        <Typography sx={{ fontSize: 12, color: tinta.tenue, flex: 1, minWidth: 200 }}>
          {cargando ? "Cargando…" : `${ordenadas.length.toLocaleString("es-CL")} filas`}
          {nota ? <> · {nota}</> : null}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          startIcon={<IconDownload size={16} />}
          disabled={descargando || cargando || ordenadas.length === 0}
          onClick={exportar}
          sx={{ textTransform: "none", borderRadius: "10px", height: 34, fontWeight: 700, whiteSpace: "nowrap" }}
        >
          {descargando ? "Generando…" : "Excel"}
        </Button>
      </Box>

      <TableContainer sx={{ overflowX: { xs: "auto", lg: "hidden" } }}>
        <Table size="small" sx={{ ...tablaSx, minWidth: { xs: anchoMinimo, lg: 0 } }}>
          <Columnas anchos={columnas.map((c) => c.ancho)} />
          <TableHead>
            <TableRow>
              {columnas.map((c) => (
                <TableCell key={c.clave} align={c.alinear ?? "left"}>
                  {c.ordenable !== false && c.valor ? (
                    <TableSortLabel
                      active={orden.clave === c.clave}
                      direction={orden.clave === c.clave ? orden.direccion : "desc"}
                      onClick={() =>
                        setOrden((o) => ({ clave: c.clave, direccion: o.clave === c.clave && o.direccion === "desc" ? "asc" : "desc" }))
                      }
                    >
                      {c.titulo}
                    </TableSortLabel>
                  ) : (
                    c.titulo
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columnas.length}>
                    <Skeleton height={30} />
                  </TableCell>
                </TableRow>
              ))
            ) : visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas.length}>
                  <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>{q ? "Ningún producto coincide con la búsqueda." : vacio}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibles.map((f) => (
                <TableRow key={clave(f)}>
                  {columnas.map((c) => (
                    <TableCell key={c.clave} align={c.alinear ?? "left"}>
                      {c.celda ? c.celda(f) : (c.valor?.(f) ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {paginas > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
          <Pagination count={paginas} page={pagina} onChange={(_, p) => setPagina(p)} shape="rounded" size="small" />
        </Box>
      )}
    </Box>
  );
}

/** Celda de producto: nombre y SKU; el nombre abre la ficha del producto. */
export function CeldaProducto({ sku, nombre, secundario }: { sku: string; nombre: string | null; secundario?: string }) {
  const router = useRouter();
  const ir = () => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(sku)}`);
  return (
    <Box role="link" tabIndex={0} onClick={ir} onKeyDown={(e) => e.key === "Enter" && ir()} sx={{ cursor: "pointer", "&:hover p:first-of-type": { color: tinta.acento } }}>
      <TextoCelda texto={nombre ?? "Sin nombre en SAP"} secundario={[sku, secundario].filter(Boolean).join(" · ")} />
    </Box>
  );
}

/** Píldora de color con texto (estados, sugerencias). */
export function Etiqueta({ texto, color, fondo }: { texto: string; color: string; fondo: string }) {
  return (
    <Box component="span" sx={{ px: 0.85, py: 0.2, borderRadius: 999, bgcolor: fondo, color, fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>
      {texto}
    </Box>
  );
}

/**
 * Encabezado de un informe sin rango de fechas (foto del día): título,
 * descripción y los filtros propios debajo. Misma tarjeta que HeaderMl.
 */
export function EncabezadoInforme({ titulo, descripcion, children }: { titulo: string; descripcion: string; children?: React.ReactNode }) {
  return (
    <Box sx={{ ...tarjetaSx, mb: 2, px: { xs: 1.5, md: 2 }, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{titulo}</Typography>
        <Typography sx={{ fontSize: 12, color: tinta.secundaria, mt: 0.25 }}>{descripcion}</Typography>
      </Box>
      {children && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}>{children}</Box>}
    </Box>
  );
}

/** Un filtro con su etiqueta encima. */
export function Filtro({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: tinta.secundaria, mb: 0.5 }}>{etiqueta}</Typography>
      {children}
    </Box>
  );
}
