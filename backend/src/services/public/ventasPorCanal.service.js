const { obtenerProductosPorCanalMargenDB } = require("../../models/informes/productos-por-canal-margen.models");

const CANAL_MAP = {
  meli: "Meli",
  falabella: "Falabella",
  balmaceda: "Balmaceda",
  vitex: "Vitex",
  chorrillo: "Chorrillo",
  empresas: "Empresas",
};

const normalizeNullable = (value) => {
  const normalized = value === undefined || value === null ? null : String(value).trim();
  return !normalized || normalized.toLowerCase() === "null" || normalized.toLowerCase() === "todas"
    ? null
    : normalized;
};

const sanitizeFilters = (source = {}) => ({
  canal: source.canal ?? null,
  vendedor: source.vendedor ?? null,
  periodo: source.periodo ?? null,
  fechaInicio: source.fechaInicio ?? null,
  fechaFin: source.fechaFin ?? null,
  proveedor: source.proveedor ?? null,
  primerNivel: source.primerNivel ?? null,
  categoria: source.categoria ?? null,
  subcategoria: source.subcategoria ?? null,
  tipoEnvio: source.tipoEnvio ?? null,
  sku: source.sku ?? null,
  familia: source.familia ?? null,
  subfamilia: source.subfamilia ?? null,
  orderBy: source.orderBy ?? "cantidadVendida",
  order: source.order ?? "desc",
});

async function buildVentasPorCanalSnapshot(sourceFilters = {}) {
  let {
    canal = null,
    vendedor = null,
    periodo = null,
    fechaInicio = null,
    fechaFin = null,
    proveedor = null,
    primerNivel = null,
    categoria = null,
    subcategoria = null,
    tipoEnvio = null,
    page = "1",
    pageSize = "50",
    sinPaginacion = "false",
    orderBy = "cantidadVendida",
    order = "desc",
    sku = null,
    familia = null,
    subfamilia = null,
  } = sourceFilters;

  if (tipoEnvio === "" || tipoEnvio === "null" || tipoEnvio === "todas") tipoEnvio = null;
  const tiposPermitidos = ["full", "colecta", null];
  if (tipoEnvio && !tiposPermitidos.includes(tipoEnvio)) {
    const error = new Error("Parametro 'tipoEnvio' invalido. Valores permitidos: 'full', 'colecta'.");
    error.statusCode = 400;
    throw error;
  }

  primerNivel = normalizeNullable(primerNivel);
  categoria = normalizeNullable(categoria);
  subcategoria = normalizeNullable(subcategoria);
  familia = normalizeNullable(familia);
  subfamilia = normalizeNullable(subfamilia);
  sku = normalizeNullable(sku);
  periodo = normalizeNullable(periodo);
  periodo = periodo ? String(periodo).toUpperCase() : null;

  const aplicarPaginacion = String(sinPaginacion) !== "true";
  const camposPermitidos = ["cantidadVendida", "margenBruto", "margenPorcentaje", "nombre", "sku"];
  const direccionesPermitidas = ["asc", "desc"];
  const campoOrden = camposPermitidos.includes(String(orderBy)) ? String(orderBy) : "cantidadVendida";
  const direccionOrden = direccionesPermitidas.includes(String(order).toLowerCase()) ? String(order).toLowerCase() : "desc";

  const canalArr = Array.isArray(canal)
    ? canal.map((item) => String(item).trim().toLowerCase())
    : typeof canal === "string" && canal.trim() !== ""
      ? canal.split(",").map((item) => item.trim().toLowerCase())
      : [];
  const canalesCsv = canalArr.map((item) => CANAL_MAP[item]).filter(Boolean).join(",") || null;

  const skuParam = typeof sku === "string" && sku.trim() !== "" ? sku.trim() : null;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 50);
  const limit = pageSizeNum;
  const offset = aplicarPaginacion ? (pageNum - 1) * pageSizeNum : 0;
  const vendedorNum = vendedor ? Number(vendedor) : null;

  const { rows, breakdown, total, detalles, stock } = await obtenerProductosPorCanalMargenDB({
    canalesCsv,
    skuCsv: null,
    sku: skuParam,
    vendedor: vendedorNum,
    periodo,
    fechaInicio,
    fechaFin,
    proveedor,
    primerNivel,
    categoria,
    subcategoria,
    familia,
    subfamilia,
    tipoEnvio,
    limit,
    offset,
    aplicarPaginacion,
    campoOrden,
    direccionOrden,
  });

  const bySku = new Map();
  const stockBySku = new Map();

  (stock || []).forEach((item) => {
    if (!stockBySku.has(item.sku)) {
      stockBySku.set(item.sku, []);
    }

    stockBySku.get(item.sku).push({
      bodega: item.bodega,
      stock: Number(item.stock) || 0,
    });
  });

  rows.forEach((row) => {
    const cantidadVendida = Number(row.cantidadVendida) || 0;
    const margenBruto = Number(row.margenBruto) || 0;
    const costoTotal = Number(row.costoTotal) || 0;
    const margenPorcentaje = Number(row.margenPorcentaje) || (costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0);

    bySku.set(row.sku, {
      sku: row.sku,
      nombre: row.nombre,
      imagen: row.imagen ?? null,
      cantidadVendida,
      margenBruto: Number(margenBruto.toFixed(2)),
      margenPorcentaje: Number(margenPorcentaje.toFixed(2)),
      costoTotal: Number(costoTotal.toFixed(2)),
      stock: (stockBySku.get(row.sku) || []).sort((a, b) => a.bodega.localeCompare(b.bodega)),
      _canales: new Map(),
    });
  });

  breakdown.forEach((item) => {
    const row = bySku.get(item.sku);
    if (!row) return;

    const cantidadVendida = Number(item.cantidadVendida) || 0;
    const margenBruto = Number(item.margenBruto) || 0;
    const costoTotal = Number(item.costoTotal) || 0;
    const margenPorcentaje = Number(item.margenPorcentaje) || (costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0);

    row._canales.set(item.canal, {
      canal: item.canal,
      cantidadVendida,
      margenBruto: Number(margenBruto.toFixed(2)),
      margenPorcentaje: Number(margenPorcentaje.toFixed(2)),
      costoTotal: Number(costoTotal.toFixed(2)),
      detalles: [],
    });
  });

  (detalles || []).forEach((item) => {
    const row = bySku.get(item.sku);
    if (!row) return;

    const canalObj = row._canales.get(item.canal);
    if (!canalObj) return;

    canalObj.detalles.push({
      folioNum: item.folioNum,
      fecha: item.fecha,
      vendedorCodigo: item.vendedorCodigo,
      vendedor: item.vendedor,
      cantidad: Number(item.cantidad) || 0,
      venta: Number(item.venta) || 0,
      margenBrutoLinea: Number(item.margenBrutoLinea) || 0,
      costoLinea: Number(item.costoLinea) || 0,
    });
  });

  const data = Array.from(bySku.values()).map((row) => {
    const porCanal = Array.from(row._canales.values()).sort((a, b) => a.canal.localeCompare(b.canal));
    const { _canales, ...rest } = row;
    return { ...rest, porCanal };
  });

  const totalPages = aplicarPaginacion ? Math.ceil((total || 0) / pageSizeNum) : 1;

  return {
    filters: sanitizeFilters({
      canal,
      vendedor,
      periodo,
      fechaInicio,
      fechaFin,
      proveedor,
      primerNivel,
      categoria,
      subcategoria,
      tipoEnvio,
      sku,
      familia,
      subfamilia,
      orderBy: campoOrden,
      order: direccionOrden,
    }),
    data,
    meta: {
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages,
      orderBy: campoOrden,
      order: direccionOrden,
    },
  };
}

module.exports = {
  buildVentasPorCanalSnapshot,
};
