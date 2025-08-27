// controllers/informes/productosSinVentas.controller.js
const { getProductosSinVentas } = require("../../models/informes/productossinventas.models");

async function productosSinVentasController(req, res) {
  try {
    const {
      minStock,
      fechaInicio,
      primerNivel,
      categoria,
      subcategoria,
      page = "1",
      pageSize = "50",
      orderBy = "stockTotal",   // 'stockTotal' | 'createDate'
      order = "asc",
    } = req.query;

    const result = await getProductosSinVentas({
      minStock:      minStock !== undefined ? Number(minStock) : undefined,
      fechaInicio:   fechaInicio || null,
      primerNivel:   primerNivel || null,
      categoria:     categoria || null,
      subcategoria:  subcategoria || null,
      page,
      pageSize,
      orderBy,
      order,
    });

    // ✅ Formatear los datos
    const formatted = result.data.map(item => {
      // hierarchy limpio
      const pn = item.PrimerNivelName || "Sin Primer Nivel";
      const cat = item.CategoriaName || "Sin Categoria";
      let hierarchy = "";
      if (pn && cat) hierarchy = `${pn} / ${cat}`;
      else if (pn)   hierarchy = pn;
      else if (cat)  hierarchy = cat;

      return {
      productDetail: {
        image: item.U_Imagen || null,
        product: `${item.ItemName} / ${item.ItemCode}`,
        itemCode: item.ItemCode,
        createDate: item.CreateDate,
      },
        hierarchy,
        subcategory: item.SubcategoriaName || "",
        stock: {
          stockTotal: item["Stock Total"],
          warehouses: {
            "01 Centro Comercial":          item["01 Centro Comercial"] || 0,
            "02 Devolución":               item["02 Devolución"] || 0,
            "03 Comercio Electronico":     item["03 Comercio Electronico"] || 0,
            "04 Control de Perdida":       item["04 Control de Perdida"] || 0,
            "05 Envios FULL- Mercado Libre": item["05 Envios FULL- Mercado Libre"] || 0,
            "06  Bodega Fabrica":          item["06  Bodega Fabrica"] || 0,
            "07 Ferreteria Balmaceda":     item["07 Ferreteria Balmaceda"] || 0,
            "08  Bodega Lo Ovalle":        item["08  Bodega Lo Ovalle"] || 0,
            "10  Reservado con Abono":     item["10  Reservado con Abono"] || 0,
            "12  Productos con Falla":     item["12  Productos con Falla"] || 0,
            "13  Reservado FULL":          item["13  Reservado FULL"] || 0,
          },
        },
        purchaseOrderDetail: {
          docNum: item.LastPO_DocNum,
          createDate: item.LastPO_CreateDate,
          supplier: `${item.LastPO_SupplierCode || ""} / ${item.LastPO_SupplierName || ""}`,
          quantity: item.LastPO_Quantity,
          createdBy: item.LastPO_CreatedBy,
        },
      };
    });

    // 👉 metadatos al comienzo del JSON
    res.json({
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      pages: result.pages,
      orderBy: result.orderBy,
      order: result.order,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Error productosSinVentasController:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { productosSinVentasController };
