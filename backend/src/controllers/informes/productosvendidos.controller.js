
const { obtenerProductosDetalladoDB } = require("../../models/informes/productosvendidos.models")

const obtenerProductosDetallado = async (req, res) => {
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
      limit = 100,
      offset = 0,
      sinPaginacion = 'false',
      orderBy = 'cantidadVendida',
      order = 'desc',
      sku = null,
    } = req.query;

    // Normalizar tipoEnvio
    if (tipoEnvio === '' || tipoEnvio === 'null' || tipoEnvio === 'todas') tipoEnvio = null;
    const tiposPermitidos = ['full', 'colecta', null];
    if (tipoEnvio && !tiposPermitidos.includes(tipoEnvio)) {
      return res.status(400).json({ error: "Parámetro 'tipoEnvio' inválido. Valores permitidos: 'full', 'colecta'." });
    }

    // Paginación/orden (listas blancas)
    const aplicarPaginacion = sinPaginacion !== 'true';
    const camposPermitidos = ['cantidadVendida','margenPorcentaje','margenBruto','precioPromedio','totalVentas','facturasUnicas'];
    const direccionesPermitidas = ['asc','desc'];
    const campoOrden = camposPermitidos.includes(String(orderBy)) ? String(orderBy) : 'cantidadVendida';
    const direccionOrden = direccionesPermitidas.includes(String(order).toLowerCase()) ? String(order).toLowerCase() : 'desc';

    // Canales CSV (case-insensitive)
    const CANAL_MAP = { meli:'Meli', falabella:'Falabella', balmaceda:'Balmaceda', vitex:'Vitex', chorrillo:'Chorrillo', empresas:'Empresas' };
    const canalArr = Array.isArray(canal)
      ? canal.map(s => String(s).trim().toLowerCase())
      : (typeof canal === 'string' && canal.trim() !== '' ? canal.split(',').map(s => s.trim().toLowerCase()) : []);
    const canalesNormalizados = canalArr.map(c => CANAL_MAP[c]).filter(Boolean);
    const canalesCsv = canalesNormalizados.length ? canalesNormalizados.join(',') : null;

    // SKUs CSV
    const skuArr = Array.isArray(sku)
      ? sku.map(s => String(s).trim()).filter(Boolean)
      : (typeof sku === 'string' && sku.trim() !== '' ? sku.split(',').map(s => s.trim()).filter(Boolean) : []);
    const skuCsv = skuArr.length ? skuArr.join(',') : null;

    // Numéricos
    limit = Number(limit) || 100;
    offset = Number(offset) || 0;
    const vendedorNum = vendedor ? Number(vendedor) : null;

    // ====== DB ======
    const { rows, breakdown, total } = await obtenerProductosDetalladoDB({
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

    // ====== MERGE: armar arrays porCanal ======
    const bySku = new Map();
    rows.forEach(r => bySku.set(r.sku, { ...r, _canales: [] }));

    breakdown.forEach(b => {
      const row = bySku.get(b.sku);
      if (!row) return;
      row._canales.push({
        canal           : b.Canal,
        cantidadVendida : Number(b.cantidadVendida) || 0,
        facturasUnicas  : Number(b.facturasUnicas) || 0,
        precioPromedio  : Number(b.precioPromedio) || 0,
        margenBruto     : Number(b.margenBruto) || 0,
        margenPorcentaje: Number(b.margenPorcentaje) || 0,
        stockCanal      : Number(b.stockCanal) || 0,
        totalVentas     : Number(b.totalVentas) || 0,
      });
    });

    // Transformar a estructura con { total, porCanal }
    const data = Array.from(bySku.values()).map(r => {
      const porCanal = r._canales.sort((a,b) => a.canal.localeCompare(b.canal));

      const mapMetric = (field) => porCanal.map(c => ({ canal: c.canal, valor: c[field] }));
      return {
        sku         : r.sku,
        nombre      : r.nombre,
        imagen      : r.imagen,
        primerNivel : r.primerNivel,
        categoria   : r.categoria,

        cantidadVendida: {
          total: Number(r.cantidadVendida) || 0,
          porCanal: mapMetric('cantidadVendida'),
        },
        facturasUnicas: {
          total: Number(r.facturasUnicas) || 0,
          porCanal: mapMetric('facturasUnicas'),
        },
        precioPromedio: {
          total: Number(r.precioPromedio) || 0,
          porCanal: mapMetric('precioPromedio'),
        },
        margenBruto: {
          total: Number(r.margenBruto) || 0,
          porCanal: mapMetric('margenBruto'),
        },
        margenPorcentaje: Number(r.margenPorcentaje) || 0, // total (para no confundir)

        stockCanal: {
          total: Number(r.stockCanal) || 0,  // sin doble conteo
          porCanal: mapMetric('stockCanal')  // puede repetir si comparten warehouse
        },

        // Extras intactos
        stockChorrillo: Number(r.stockChorrillo) || 0,
        stockOnOrder  : Number(r.stockOnOrder) || 0,
        totalVentas   : Number(r.totalVentas) || 0,
      };
    });

    return res.json({ data, total });
  } catch (error) {
    console.error("❌ Error al obtener productos detallados:", error);
    return res.status(500).json({ error: "Error en el servidor." });
  }
};

module.exports = { obtenerProductosDetallado };
