// controllers/reportesController.js
const { obtenerProductosDetallado } = require('../../models/informes/productosmenosrentables.models');

async function getProductosDetallado(req, res) {
  try {
    const {
      canal = null,
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
    if (!canal) {
      return res.status(400).json({
        error: "El parámetro 'canal' es obligatorio."
      });
    }

    if (!periodo && !(fechaInicio && fechaFin)) {
      return res.status(400).json({
        error: "Debe enviar 'periodo' o el rango de fechas ('fechaInicio' y 'fechaFin')."
      });
    }

    const data = await obtenerProductosDetallado({
      canal,
      vendedor: vendedor ? Number(vendedor) : null,
      periodo,
      fechaInicio,
      fechaFin,
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
    });
  } catch (err) {
    console.error('❌ Error getProductosDetallado:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
}
module.exports = { getProductosDetallado };
