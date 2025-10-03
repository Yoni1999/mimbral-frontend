// const { obtenerProductosPorCanalMargenDB } = require("../../models/informes/productos-por-canal-margen.models");

// const obtenerProductosPorCanalMargen = async (req, res) => {
//   try {
//     let {
//       canal = null,
//       vendedor = null,
//       periodo = null,
//       fechaInicio = null,
//       fechaFin = null,
//       proveedor = null,
//       primerNivel = null,
//       categoria = null,
//       subcategoria = null,
//       tipoEnvio = null,

//       // paginación
//       page = "1",
//       pageSize = "50",
//       sinPaginacion = "false",

//       // orden
//       orderBy = "cantidadVendida",
//       order = "desc",

//       // filtros extra
//       sku = null,
//     } = req.query;

//     // ====== normalizaciones ======
//     if (tipoEnvio === "" || tipoEnvio === "null" || tipoEnvio === "todas") tipoEnvio = null;
//     const tiposPermitidos = ["full", "colecta", null];
//     if (tipoEnvio && !tiposPermitidos.includes(tipoEnvio)) {
//       return res.status(400).json({ error: "Parámetro 'tipoEnvio' inválido. Valores permitidos: 'full', 'colecta'." });
//     }

//     // normalizar vacíos en UDFs (recomendado)
//     const norm = (v) => (v === undefined || v === null ? null : String(v).trim());
//     const normalizeNullable = (v) => {
//       const s = norm(v);
//       return (!s || s.toLowerCase() === "null" || s.toLowerCase() === "todas") ? null : s;
//     };
//     primerNivel  = normalizeNullable(primerNivel);
//     categoria    = normalizeNullable(categoria);
//     subcategoria = normalizeNullable(subcategoria);

//     const aplicarPaginacion = sinPaginacion !== "true";

//     const camposPermitidos = ["cantidadVendida", "margenBruto", "margenPorcentaje", "nombre", "sku"];
//     const direccionesPermitidas = ["asc", "desc"];
//     const campoOrden = camposPermitidos.includes(String(orderBy)) ? String(orderBy) : "cantidadVendida";
//     const direccionOrden = direccionesPermitidas.includes(String(order).toLowerCase()) ? String(order).toLowerCase() : "desc";

//     const CANAL_MAP = { meli:"Meli", falabella:"Falabella", balmaceda:"Balmaceda", vitex:"Vitex", chorrillo:"Chorrillo", empresas:"Empresas" };
//     const canalArr = Array.isArray(canal)
//       ? canal.map(s => String(s).trim().toLowerCase())
//       : (typeof canal === "string" && canal.trim() !== "" ? canal.split(",").map(s => s.trim().toLowerCase()) : []);
//     const canalesCsv = canalArr.map(c => CANAL_MAP[c]).filter(Boolean).join(",") || null;

//     const skuArr = Array.isArray(sku)
//       ? sku.map(s => String(s).trim()).filter(Boolean)
//       : (typeof sku === "string" && sku.trim() !== "" ? sku.split(",").map(s => s.trim()).filter(Boolean) : []);
//     const skuCsv = skuArr.length ? skuArr.join(",") : null;

//     const pageNum = Math.max(1, parseInt(page, 10) || 1);
//     const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 50);
//     const limit = pageSizeNum; 
//     const offset = aplicarPaginacion ? (pageNum - 1) * pageSizeNum : 0;

//     // numéricos
//     const vendedorNum = vendedor ? Number(vendedor) : null;

//     // ====== DB ======
//     const { rows, breakdown, total } = await obtenerProductosPorCanalMargenDB({
//       canalesCsv,
//       skuCsv,
//       vendedor: vendedorNum,
//       periodo,
//       fechaInicio,
//       fechaFin,
//       proveedor,
//       primerNivel,
//       categoria,
//       subcategoria,
//       tipoEnvio,
//       limit,
//       offset,
//       aplicarPaginacion,
//       campoOrden,
//       direccionOrden,
//     });

//     // ====== merge por SKU ======
//     const bySku = new Map();

//     // Totales por SKU (incluye costoTotal y margenPorcentaje del model)
//     rows.forEach(r => {
//       const cantidadVendida  = Number(r.cantidadVendida) || 0;
//       const margenBruto      = Number(r.margenBruto) || 0;
//       const costoTotal       = Number(r.costoTotal) || 0;
//       const margenPorcentaje = Number(r.margenPorcentaje) || (costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0);

//       bySku.set(r.sku, {
//         sku: r.sku,
//         nombre: r.nombre,
//         cantidadVendida,
//         margenBruto: Number(margenBruto.toFixed(2)),          // monto
//         margenPorcentaje: Number(margenPorcentaje.toFixed(2)),// % sobre costo
//         costoTotal: Number(costoTotal.toFixed(2)),           
//         porCanal: []
//       });
//     });

//     // Breakdown por canal (incluye costoTotal y margenPorcentaje del model)
//     breakdown.forEach(b => {
//       const row = bySku.get(b.sku);
//       if (!row) return;

//       const cantidadVendida  = Number(b.cantidadVendida) || 0;
//       const margenBruto      = Number(b.margenBruto) || 0;
//       const costoTotal       = Number(b.costoTotal) || 0;
//       const margenPorcentaje = Number(b.margenPorcentaje) || (costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0);

//       row.porCanal.push({
//         canal: b.canal,
//         cantidadVendida,
//         margenBruto: Number(margenBruto.toFixed(2)),           // monto
//         margenPorcentaje: Number(margenPorcentaje.toFixed(2)), // % sobre costo del canal
//         costoTotal: Number(costoTotal.toFixed(2)),
//       });
//     });

//     const data = Array.from(bySku.values()).map(r => ({
//       ...r,
//       porCanal: r.porCanal.sort((a, b) => a.canal.localeCompare(b.canal)),
//     }));

//     // ✅ metadatos de paginación
//     const totalPages = aplicarPaginacion ? Math.ceil((total || 0) / pageSizeNum) : 1;

//     return res.json({
//       data,
//       meta: {
//         page: pageNum,
//         pageSize: pageSizeNum,
//         total,
//         totalPages
//       }
//     });
//   } catch (error) {
//     console.error("❌ Error en informe productos-por-canal-margen (page/pageSize):", error);
//     return res.status(500).json({ error: "Error en el servidor." });
//   }
// };

// module.exports = { obtenerProductosPorCanalMargen };


// controllers/informes/productos-por-canal-margen.controller.js
const { obtenerProductosPorCanalMargenDB } = require("../../models/informes/productos-por-canal-margen.models");

const obtenerProductosPorCanalMargen = async (req, res) => {
  try {
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

      // paginación
      page = "1",
      pageSize = "50",
      sinPaginacion = "false",

      // orden
      orderBy = "cantidadVendida",
      order = "desc",

      // filtros extra
      sku = null,
    } = req.query;

    // ====== normalizaciones ======
    if (tipoEnvio === "" || tipoEnvio === "null" || tipoEnvio === "todas") tipoEnvio = null;
    const tiposPermitidos = ["full", "colecta", null];
    if (tipoEnvio && !tiposPermitidos.includes(tipoEnvio)) {
      return res.status(400).json({ error: "Parámetro 'tipoEnvio' inválido. Valores permitidos: 'full', 'colecta'." });
    }

    // normalizar vacíos en UDFs
    const norm = (v) => (v === undefined || v === null ? null : String(v).trim());
    const normalizeNullable = (v) => {
      const s = norm(v);
      return (!s || s.toLowerCase() === "null" || s.toLowerCase() === "todas") ? null : s;
    };
    primerNivel  = normalizeNullable(primerNivel);
    categoria    = normalizeNullable(categoria);
    subcategoria = normalizeNullable(subcategoria);

    const aplicarPaginacion = sinPaginacion !== "true";

    const camposPermitidos = ["cantidadVendida", "margenBruto", "margenPorcentaje", "nombre", "sku"];
    const direccionesPermitidas = ["asc", "desc"];
    const campoOrden = camposPermitidos.includes(String(orderBy)) ? String(orderBy) : "cantidadVendida";
    const direccionOrden = direccionesPermitidas.includes(String(order).toLowerCase()) ? String(order).toLowerCase() : "desc";

    // canales CSV
    const CANAL_MAP = { meli:"Meli", falabella:"Falabella", balmaceda:"Balmaceda", vitex:"Vitex", chorrillo:"Chorrillo", empresas:"Empresas" };
    const canalArr = Array.isArray(canal)
      ? canal.map(s => String(s).trim().toLowerCase())
      : (typeof canal === "string" && canal.trim() !== "" ? canal.split(",").map(s => s.trim().toLowerCase()) : []);
    const canalesCsv = canalArr.map(c => CANAL_MAP[c]).filter(Boolean).join(",") || null;

    // skus CSV
    const skuArr = Array.isArray(sku)
      ? sku.map(s => String(s).trim()).filter(Boolean)
      : (typeof sku === "string" && sku.trim() !== "" ? sku.split(",").map(s => s.trim()).filter(Boolean) : []);
    const skuCsv = skuArr.length ? skuArr.join(",") : null;

    // page/pageSize → limit/offset
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize, 10) || 50);
    const limit = pageSizeNum;
    const offset = aplicarPaginacion ? (pageNum - 1) * pageSizeNum : 0;

    // numéricos
    const vendedorNum = vendedor ? Number(vendedor) : null;

    // ====== DB ======
    const { rows, breakdown, total, detalles } = await obtenerProductosPorCanalMargenDB({
      canalesCsv,
      skuCsv,
      vendedor: vendedorNum,
      periodo,
      fechaInicio,
      fechaFin,
      proveedor,
      primerNivel,
      categoria,
      subcategoria,
      tipoEnvio,
      limit,
      offset,
      aplicarPaginacion,
      campoOrden,
      direccionOrden,
    });

    // ====== merge por SKU y Canal ======
    const bySku = new Map();

    // 1) Totales por SKU
    rows.forEach(r => {
      const cantidadVendida  = Number(r.cantidadVendida) || 0;
      const margenBruto      = Number(r.margenBruto) || 0;
      const costoTotal       = Number(r.costoTotal) || 0;
      const margenPorcentaje = Number(r.margenPorcentaje) || (costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0);

      bySku.set(r.sku, {
        sku: r.sku,
        nombre: r.nombre,
        imagen: r.imagen ?? null,
        cantidadVendida,
        margenBruto: Number(margenBruto.toFixed(2)),
        margenPorcentaje: Number(margenPorcentaje.toFixed(2)),
        costoTotal: Number(costoTotal.toFixed(2)),
        _canales: new Map(), // mapa temporal canal -> objeto canal
      });
    });

    // 2) Agregados por canal
    breakdown.forEach(b => {
      const row = bySku.get(b.sku);
      if (!row) return;

      const cantidadVendida  = Number(b.cantidadVendida) || 0;
      const margenBruto      = Number(b.margenBruto) || 0;
      const costoTotal       = Number(b.costoTotal) || 0;
      const margenPorcentaje = Number(b.margenPorcentaje) || (costoTotal > 0 ? (margenBruto / costoTotal) * 100 : 0);

      row._canales.set(b.canal, {
        canal: b.canal,
        cantidadVendida,
        margenBruto: Number(margenBruto.toFixed(2)),
        margenPorcentaje: Number(margenPorcentaje.toFixed(2)),
        costoTotal: Number(costoTotal.toFixed(2)),
        detalles: [], // se llenará en el paso 3
      });
    });

    // 3) Detalle de líneas por canal
    (detalles || []).forEach(d => {
      const row = bySku.get(d.sku);
      if (!row) return;
      const canalObj = row._canales.get(d.canal);
      if (!canalObj) return;

      canalObj.detalles.push({
        folioNum: d.folioNum,
        fecha: d.fecha, // ya viene como DATE (YYYY-MM-DD)
        vendedorCodigo: d.vendedorCodigo,
        vendedor: d.vendedor,
        cantidad: Number(d.cantidad) || 0,
        venta: Number(d.venta) || 0,
        margenBrutoLinea: Number(d.margenBrutoLinea) || 0,
        costoLinea: Number(d.costoLinea) || 0,
      });
    });

    // 4) Construir salida final
    const data = Array.from(bySku.values()).map(r => {
      const porCanal = Array.from(r._canales.values()).sort((a, b) => a.canal.localeCompare(b.canal));
      const { _canales, ...rest } = r;
      return { ...rest, porCanal };
    });

    // metadatos de paginación
    const totalPages = aplicarPaginacion ? Math.ceil((total || 0) / pageSizeNum) : 1;

    return res.json({
      data,
      meta: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error("❌ Error en informe productos-por-canal-margen (page/pageSize + detalles):", error);
    return res.status(500).json({ error: "Error en el servidor." });
  }
};

module.exports = { obtenerProductosPorCanalMargen };
