// controllers/reportesController.js
const { obtenerProductosDetallado } = require('../../models/informes/productosmenosrentables.models');

function parseDateMaybe(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function getProductosDetallado(req, res) {
  try {
    const {
      canal = null,              // ahora único param; puede venir "Meli, Chorrillo,Empresas"
      vendedor = null,
      periodo = null,
      fechaInicio = null,
      fechaFin = null,
      proveedor = null,
      primerNivel = null,
      categoria = null,
      subcategoria = null,
      page = '1',
      pageSize = '50',
      orderBy = 'Rentabilidad_Total',
      order = 'asc',
    } = req.query;

    // 🔎 Validaciones obligatorias
    if (!canal || !String(canal).trim()) {
      return res.status(400).json({
        error: "Debe enviar 'canal'. Ej: ?canal=Meli o ?canal=Meli,Chorrillo,Empresas",
      });
    }

    if (!periodo && !(fechaInicio && fechaFin)) {
      return res.status(400).json({
        error: "Debe enviar 'periodo' o el rango de fechas ('fechaInicio' y 'fechaFin').",
      });
    }

    // 👉 Pasamos 'canal' tal cual (puede ser CSV). El model ya lo convierte a CSV para SQL.
    const data = await obtenerProductosDetallado({
      canal: String(canal),                        // puede ser "Meli,Chorrillo,Empresas"
      vendedor: vendedor ? Number(vendedor) : null,
      periodo,
      fechaInicio: parseDateMaybe(fechaInicio),
      fechaFin: parseDateMaybe(fechaFin),
      proveedor,
      primerNivel,
      categoria,
      subcategoria,
      page,
      pageSize,
      orderBy,
      order,
    });

    const formatted = data.rows.map(item => ({
      product: `${item.Codigo_Producto} / ${item.Nombre_Producto}`,
      hierarchy: `${item.primerNivel || ''} / ${item.Categoria || ''}`,
      image: item.IMAGE,
      totalStock: item.STOCK,
      chorrilloStock: item.Stock_Chorrillo,
      onOrderStock: item.stockOnOrder,
      soldQuantity: item.Cantidad_Vendida,
      avgPrice: item.Precio_Venta_Promedio,
      avgCost: item.Costo_Promedio,
      totalProfit: item.Rentabilidad_Total,
      profitMargin: item.Margen_Porcentaje !== null
        ? `${parseFloat(item.Margen_Porcentaje).toFixed(2)}%`
        : null
    }));

    res.json({
      data: formatted,
      page: data.page,
      pageSize: data.pageSize,
      total: data.total,
      pages: data.pages,
      orderBy,
      order: (String(order).toLowerCase() === 'asc') ? 'asc' : 'desc',
      filters: {
        canal: String(canal),   // aquí queda el CSV que se aplicó
        periodo,
        fechaInicio,
        fechaFin,
        proveedor,
        primerNivel,
        categoria,
        subcategoria,
        vendedor: vendedor ? Number(vendedor) : null,
      }
    });
  } catch (err) {
    console.error('❌ Error getProductosDetallado:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
}

module.exports = { getProductosDetallado };
