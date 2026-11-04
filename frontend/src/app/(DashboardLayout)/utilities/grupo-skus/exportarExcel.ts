// Excel del grupo de SKUs: un libro con TODA la data de la vista, una hoja por
// tema. Las columnas de margen y costo salen solo si la respuesta las trae
// (el servidor las quita a quien no tiene el permiso de margen).
import * as XLSX from "xlsx";
import { CANALES } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { RespuestaGrupo, RespuestaInventario, fechaCorta, nombreMes } from "./tipos";

const r2 = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? null : Math.round(Number(v) * 100) / 100);
const r0 = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? null : Math.round(Number(v)));
const nombreCanal = (clave: string) => CANALES.find((c) => c.clave === clave)?.nombre ?? clave;

/** Hoja con anchos de columna según el contenido. */
function hoja(filas: Record<string, unknown>[], vacio = "Sin datos"): XLSX.WorkSheet {
  const datos = filas.length ? filas : [{ Detalle: vacio }];
  const ws = XLSX.utils.json_to_sheet(datos);
  const columnas = Object.keys(datos[0]);
  ws["!cols"] = columnas.map((c) => ({
    wch: Math.min(60, Math.max(c.length, ...datos.slice(0, 200).map((f) => String(f[c] ?? "").length)) + 2),
  }));
  return ws;
}

export interface ContextoExcel {
  canal: string;
  rango: string;
  comparacion: string;
}

export function descargarExcelGrupo(datos: RespuestaGrupo, inventario: RespuestaInventario | null, ctx: ContextoExcel) {
  const conMargen = datos.resumen.margen !== undefined;
  const r = datos.resumen;
  const libro = XLSX.utils.book_new();
  const ant = datos.periodo.anterior;

  // 1) Resumen: filtros y cifras del grupo.
  const resumen: [string, unknown][] = [
    ["Análisis de grupo de SKUs", ""],
    ["Período", `${fechaCorta(datos.periodo.inicio)} al ${fechaCorta(datos.periodo.fin)} (${ctx.rango})`],
    ["Comparado con", ant ? `${fechaCorta(ant.inicio)} al ${fechaCorta(ant.fin)} (${ctx.comparacion})` : "Sin comparación"],
    ["Canal", ctx.canal],
    ["SKUs pedidos", datos.skus.length],
    ["SKUs con venta en el período", r.conVentas],
    ["SKUs no encontrados en el catálogo", datos.noEncontrados.length],
    ["", ""],
    ["Venta neta", r0(r.venta)],
    ["Venta período anterior", r0(r.ventaAnterior)],
    ["Variación venta %", r2(r.variacionVenta)],
    ["Unidades", r2(r.unidades)],
    ["Unidades período anterior", r2(r.unidadesAnterior)],
    ["Variación unidades %", r2(r.variacionUnidades)],
    ["Documentos (ventas)", r.documentos],
    ["Documentos período anterior", r.documentosAnterior],
    ["Clientes distintos", r.clientes],
    ["Ticket promedio", r0(r.ticketPromedio)],
    ...((conMargen
      ? [
          ["Costo", r0(r.costo)],
          ["Margen bruto", r0(r.margen)],
          ["% Margen", r2(r.margenPorcentaje)],
          ["% Margen período anterior", r2(r.margenPorcentajeAnterior)],
        ]
      : []) as [string, unknown][]),
    ["Notas de crédito (documentos)", r.ncDocumentos],
    ["Unidades devueltas", r2(r.ncUnidades)],
    ["Monto notas de crédito", r0(r.ncMonto)],
    ["Venta descontadas las NC", r0(r.ventaNeta)],
    ["", ""],
    ["Generado", new Date().toLocaleString("es-CL")],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet([["Concepto", "Valor"], ...resumen]);
  wsResumen["!cols"] = [{ wch: 38 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(libro, wsResumen, "Resumen");

  // 2) Productos: una fila por SKU con todo lo que hay.
  const inv = new Map((inventario?.productos ?? []).map((p) => [p.sku, p]));
  const productos = datos.productos.map((p) => {
    const i = inv.get(p.sku);
    const fila: Record<string, unknown> = {
      SKU: p.sku,
      Producto: p.nombre ?? "(no existe en el catálogo)",
      Marca: p.marca ?? "",
      "Primer nivel": p.primerNivel ?? "",
      Categoría: p.categoria ?? "",
      Subcategoría: p.subcategoria ?? "",
      Activo: p.existe ? (p.activo ? "Sí" : "No") : "",
      "Precio lista (neto)": r0(p.precioLista),
      "Venta neta": r0(p.venta),
      "Venta anterior": r0(p.ventaAnterior),
      "Variación venta %": r2(p.variacionVenta),
      "% del grupo": r2(p.participacion),
      Unidades: r2(p.unidades),
      "Unidades anterior": r2(p.unidadesAnterior),
      "Variación unidades %": r2(p.variacionUnidades),
      Documentos: p.documentos,
      "Documentos anterior": p.documentosAnterior,
      Clientes: p.clientes,
      "Precio promedio venta": r0(p.precioPromedio),
      "Ticket promedio": r0(p.ticketPromedio),
    };
    if (conMargen) {
      fila["Costo"] = r0(p.costo);
      fila["Margen bruto"] = r0(p.margen);
      fila["% Margen"] = r2(p.margenPorcentaje);
      fila["Margen anterior"] = r0(p.margenAnterior);
    }
    Object.assign(fila, {
      "NC (documentos)": p.ncDocumentos,
      "NC unidades": r2(p.ncUnidades),
      "NC monto": r0(p.ncMonto),
      "Venta descontadas NC": r0(p.ventaNeta),
      "Primera venta del período": fechaCorta(p.primeraVenta),
      "Última venta del período": fechaCorta(p.ultimaVenta),
    });
    for (const c of p.canales) {
      fila[`Venta ${nombreCanal(c.canal)}`] = r0(c.venta);
      fila[`Unidades ${nombreCanal(c.canal)}`] = r2(c.unidades);
    }
    if (inventario) {
      Object.assign(fila, {
        "Stock de venta": i ? r2(i.stockVenta) : null,
        "Stock total": i ? r2(i.stockTotal) : null,
        Comprometido: i ? r2(i.comprometido) : null,
        Disponible: i ? r2(i.disponible) : null,
        "Unidades últimos 30 días": i ? r2(i.unidades30) : null,
        "Cobertura (días)": i?.coberturaDias != null ? r0(i.coberturaDias) : null,
        "Pendiente en OC": i ? r2(i.pendienteOc) : null,
        "Última venta (cualquier fecha)": fechaCorta(i?.ultimaVenta),
        "Proveedor última OC": i?.ultimaOc?.proveedorNombre ?? "",
        "Fecha última OC": fechaCorta(i?.ultimaOc?.fecha),
      });
    }
    return fila;
  });
  XLSX.utils.book_append_sheet(libro, hoja(productos), "Productos");

  // 3) Por canal: SKU × canal en filas (fácil de filtrar y de usar en tablas dinámicas).
  const porCanal = datos.productos.flatMap((p) =>
    p.canales
      .filter((c) => c.venta !== 0 || c.unidades !== 0)
      .map((c) => {
        const fila: Record<string, unknown> = {
          SKU: p.sku,
          Producto: p.nombre ?? "",
          Canal: nombreCanal(c.canal),
          "Venta neta": r0(c.venta),
          Unidades: r2(c.unidades),
          "% de la venta del SKU": p.venta ? r2((c.venta / p.venta) * 100) : null,
        };
        if (conMargen && c.costo !== undefined) {
          fila["Costo"] = r0(c.costo);
          fila["Margen bruto"] = r0(c.venta - (c.costo ?? 0));
          fila["% Margen"] = c.venta ? r2(((c.venta - (c.costo ?? 0)) / c.venta) * 100) : null;
        }
        return fila;
      })
  );
  XLSX.utils.book_append_sheet(libro, hoja(porCanal, "Sin ventas en el período"), "Por canal");

  // 4) Mensual: SKU × mes.
  const nombres = new Map(datos.productos.map((p) => [p.sku, p.nombre ?? ""]));
  const mensual = [...datos.mensual]
    .sort((a, b) => a.sku.localeCompare(b.sku) || a.mes.localeCompare(b.mes))
    .map((m) => {
      const fila: Record<string, unknown> = {
        SKU: m.sku,
        Producto: nombres.get(m.sku) ?? "",
        Mes: nombreMes(m.mes),
        "Mes (aaaa-mm)": m.mes,
        "Venta neta": r0(m.venta),
        Unidades: r2(m.unidades),
        Documentos: m.documentos,
      };
      if (conMargen && m.margen !== undefined) {
        fila["Margen bruto"] = r0(m.margen);
        fila["% Margen"] = m.venta ? r2(((m.margen ?? 0) / m.venta) * 100) : null;
      }
      return fila;
    });
  XLSX.utils.book_append_sheet(libro, hoja(mensual, "Sin ventas en el período"), "Mensual");

  // 5) Diario por canal (lo del gráfico de tendencia).
  const diario = datos.diario.map((d) => {
    const fila: Record<string, unknown> = { Fecha: fechaCorta(String(d.Fecha)) };
    let total = 0;
    for (const c of CANALES) {
      const v = Number(d[c.clave]) || 0;
      fila[c.nombre] = r0(v);
      total += v;
    }
    fila["Total"] = r0(total);
    return fila;
  });
  XLSX.utils.book_append_sheet(libro, hoja(diario, "Sin ventas en el período"), "Diario por canal");

  // 6) Inventario y abastecimiento (si el perfil lo ve).
  if (inventario) {
    const filasInv = inventario.productos.map((i) => {
      const fila: Record<string, unknown> = {
        SKU: i.sku,
        Producto: nombres.get(i.sku) ?? "",
        "Stock de venta": r2(i.stockVenta),
        "Stock total": r2(i.stockTotal),
        Comprometido: r2(i.comprometido),
        Disponible: r2(i.disponible),
        "Unidades últimos 30 días": r2(i.unidades30),
        "Unidades últimos 90 días": r2(i.unidades90),
        "Venta diaria promedio (30 días)": r2(i.promedioDiario30),
        "Cobertura (días)": i.coberturaDias != null ? r0(i.coberturaDias) : null,
        "Última venta": fechaCorta(i.ultimaVenta),
        "Pendiente en OC": r2(i.pendienteOc),
        "OC abiertas": i.ocAbiertas,
        "Próxima entrega": fechaCorta(i.proximaEntrega),
        "Última OC N°": i.ultimaOc?.numero ?? "",
        "Fecha última OC": fechaCorta(i.ultimaOc?.fecha),
        "Cantidad última OC": r2(i.ultimaOc?.cantidad),
      };
      if (i.ultimaOc?.costoUnitario !== undefined) fila["Costo unitario última OC"] = r2(i.ultimaOc?.costoUnitario);
      Object.assign(fila, {
        "Proveedor última OC": i.ultimaOc?.proveedorNombre ?? "",
        "RUT proveedor": i.ultimaOc?.proveedorCodigo ?? "",
        "Última recepción": fechaCorta(i.ultimaRecepcion?.fecha),
        "Cantidad última recepción": r2(i.ultimaRecepcion?.cantidad),
      });
      return fila;
    });
    XLSX.utils.book_append_sheet(libro, hoja(filasInv), "Inventario");

    const filasBodega = inventario.productos.flatMap((i) =>
      inventario.bodegas
        .map((b) => ({ b, s: i.bodegas[b] }))
        .filter(({ s }) => s && (s.stock || s.comprometido || s.enOc))
        .map(({ b, s }) => ({
          SKU: i.sku,
          Producto: nombres.get(i.sku) ?? "",
          Bodega: b,
          "Cuenta como stock de venta": inventario.bodegasVenta.includes(b) ? "Sí" : "No",
          Stock: r2(s.stock),
          Comprometido: r2(s.comprometido),
          "En OC": r2(s.enOc),
        }))
    );
    XLSX.utils.book_append_sheet(libro, hoja(filasBodega, "Sin stock en ninguna bodega"), "Stock por bodega");
  }

  // 7) SKUs que no están en el catálogo.
  if (datos.noEncontrados.length) {
    XLSX.utils.book_append_sheet(
      libro,
      hoja(datos.noEncontrados.map((s) => ({ SKU: s, Detalle: "No existe en el catálogo de SAP" }))),
      "No encontrados"
    );
  }

  const hoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `grupo-skus_${datos.periodo.inicio}_${datos.periodo.fin}_${hoy}.xlsx`);
}

/** Plantilla para cargar SKUs: una columna "SKU" y una hoja de instrucciones. */
export function descargarPlantillaSkus() {
  const libro = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["SKU"], ["004042020"], ["555222274"], ["125003074"]]);
  ws["!cols"] = [{ wch: 18 }];
  XLSX.utils.book_append_sheet(libro, ws, "SKUs");
  const instrucciones = XLSX.utils.aoa_to_sheet([
    ["Cómo llenar la plantilla"],
    ["1. Escribe un SKU por fila en la columna SKU de la hoja \"SKUs\" (reemplaza los de ejemplo)."],
    ["2. Hasta 100 SKUs. Los repetidos se cuentan una sola vez."],
    ["3. Usa el código SAP del producto (por ejemplo 004042020). Si Excel le quita los ceros a la izquierda, da formato de Texto a la columna."],
    ["4. Guarda el archivo y súbelo en Productos › Grupo de SKUs › Cargar Excel."],
  ]);
  instrucciones["!cols"] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(libro, instrucciones, "Instrucciones");
  XLSX.writeFile(libro, "plantilla-grupo-skus.xlsx");
}

/** SKUs de un Excel o CSV: la columna con encabezado SKU (o código/referencia);
 *  si no hay encabezado reconocible, la primera columna. */
export async function leerSkusDeArchivo(archivo: File): Promise<string[]> {
  const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
  const ws = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false });
  if (!filas.length) return [];
  const encabezados = (filas[0] as unknown[]).map((c) => String(c ?? "").trim().toLowerCase());
  const candidatos = ["sku", "skus", "código", "codigo", "código sap", "codigo sap", "itemcode", "referencia"];
  const col = encabezados.findIndex((h) => candidatos.includes(h));
  const indice = col >= 0 ? col : 0;
  const desde = col >= 0 ? 1 : 0;
  return filas.slice(desde).map((f) => String((f as unknown[])[indice] ?? "").trim()).filter(Boolean);
}
