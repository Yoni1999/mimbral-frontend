// // controllers/informes/productosSinVentas.controller.js
// const { getProductosSinVentas } = require("../../models/informes/productossinventas.models");

// async function productosSinVentasController(req, res) {
//   try {
//     const {
//       minStock,
//       fechaInicio,
//       primerNivel,
//       categoria,
//       subcategoria,
//       page = "1",
//       pageSize = "50",
//       orderBy = "stockTotal",   // 'stockTotal' | 'createDate'
//       order = "asc",
//     } = req.query;

//     const result = await getProductosSinVentas({
//       minStock:      minStock !== undefined ? Number(minStock) : undefined,
//       fechaInicio:   fechaInicio || null,
//       primerNivel:   primerNivel || null,
//       categoria:     categoria || null,
//       subcategoria:  subcategoria || null,
//       page,
//       pageSize,
//       orderBy,
//       order,
//     });

//     // ✅ Formatear los datos
//     const formatted = result.data.map(item => {
//       // hierarchy limpio
//       const pn = item.PrimerNivelName || "Sin Primer Nivel";
//       const cat = item.CategoriaName || "Sin Categoria";
//       let hierarchy = "";
//       if (pn && cat) hierarchy = `${pn} / ${cat}`;
//       else if (pn)   hierarchy = pn;
//       else if (cat)  hierarchy = cat;

//       return {
//       productDetail: {
//         image: item.U_Imagen || null,
//         product: `${item.ItemName} / ${item.ItemCode}`,
//         itemCode: item.ItemCode,
//         createDate: item.CreateDate,
//       },
//         hierarchy,
//         subcategory: item.SubcategoriaName || "",
//         stock: {
//           stockTotal: item["Stock Total"],
//           warehouses: {
//             "01 Centro Comercial":          item["01 Centro Comercial"] || 0,
//             "02 Devolución":               item["02 Devolución"] || 0,
//             "03 Comercio Electronico":     item["03 Comercio Electronico"] || 0,
//             "04 Control de Perdida":       item["04 Control de Perdida"] || 0,
//             "05 Envios FULL- Mercado Libre": item["05 Envios FULL- Mercado Libre"] || 0,
//             "06  Bodega Fabrica":          item["06  Bodega Fabrica"] || 0,
//             "07 Ferreteria Balmaceda":     item["07 Ferreteria Balmaceda"] || 0,
//             "08  Bodega Lo Ovalle":        item["08  Bodega Lo Ovalle"] || 0,
//             "10  Reservado con Abono":     item["10  Reservado con Abono"] || 0,
//             "12  Productos con Falla":     item["12  Productos con Falla"] || 0,
//             "13  Reservado FULL":          item["13  Reservado FULL"] || 0,
//           },
//         },
//         purchaseOrderDetail: {
//           docNum: item.LastPO_DocNum,
//           createDate: item.LastPO_CreateDate,
//           supplier: `${item.LastPO_SupplierCode || ""} / ${item.LastPO_SupplierName || ""}`,
//           quantity: item.LastPO_Quantity,
//           createdBy: item.LastPO_CreatedBy,
//         },
//       };
//     });

//     // 👉 metadatos al comienzo del JSON
//     res.json({
//       page: result.page,
//       pageSize: result.pageSize,
//       total: result.total,
//       pages: result.pages,
//       orderBy: result.orderBy,
//       order: result.order,
//       data: formatted,
//     });
//   } catch (err) {
//     console.error("❌ Error productosSinVentasController:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// }

// module.exports = { productosSinVentasController };


// controllers/informes/productosSinVentas.controller.js

const { getProductosSinVentas, hasItemSales, getItemSalesLastMonths  } = require("../../models/informes/productossinventas.models");

async function productosSinVentasController(req, res) {
  try {
    const {
      minStock,
      fechaInicio,
      primerNivel,
      categoria,
      subcategoria,
      itemCode,                 
      page = "1",
      pageSize = "50",
      orderBy = "stockTotal",   
      order = "asc",
    } = req.query;

    const isPureItemLookup =
      !!itemCode &&
      !fechaInicio &&
      !primerNivel &&
      !categoria &&
      !subcategoria &&
      (minStock === undefined || minStock === null || minStock === "");

    if (isPureItemLookup) {
      const hadSales = await hasItemSales(itemCode);

      if (hadSales) {
        const ventas = await getItemSalesLastMonths(itemCode, 4);
        return res.json({
          mode: "lookupItemCodeWithSales",
          message: `El producto ${itemCode} SÍ tuvo ventas. Se muestran las ventas de los últimos 4 meses.`,
          itemCode,
          salesLast4Months: ventas.map(v => ({
            docNum: v.DocNum,
            docDate: v.DocDate,
            createDate: v.CreateDate,
            customer: `${v.CardCode || ""} / ${v.CardName || ""}`.trim(),
            quantity: v.Quantity,
            price: v.Price,
            currency: v.Currency,
            lineTotal: v.LineTotal,
          })),
        });
      }

      const result = await getProductosSinVentas({
        minStock: 0,
        fechaInicio: null,
        primerNivel: null,
        categoria: null,
        subcategoria: null,
        page: "1",
        pageSize: "50",
        orderBy,
        order,
      });

      const formattedAll = result.data.map(item => {
        const pn  = item.PrimerNivelName || "Sin Primer Nivel";
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
              "01 Centro Comercial":            item["01 Centro Comercial"] || 0,
              "02 Devolución":                  item["02 Devolución"] || 0,
              "03 Comercio Electronico":        item["03 Comercio Electronico"] || 0,
              "04 Control de Perdida":          item["04 Control de Perdida"] || 0,
              "05 Envios FULL- Mercado Libre":  item["05 Envios FULL- Mercado Libre"] || 0,
              "06  Bodega Fabrica":             item["06  Bodega Fabrica"] || 0,
              "07 Ferreteria Balmaceda":        item["07 Ferreteria Balmaceda"] || 0,
              "08  Bodega Lo Ovalle":           item["08  Bodega Lo Ovalle"] || 0,
              "10  Reservado con Abono":        item["10  Reservado con Abono"] || 0,
              "12  Productos con Falla":        item["12  Productos con Falla"] || 0,
              "13  Reservado FULL":             item["13  Reservado FULL"] || 0,
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

      const filtered = formattedAll.filter(x => x.productDetail.itemCode === itemCode);

      return res.json({
        mode: "lookupItemCodeNoSales",
        message: `El producto ${itemCode} NO registra ventas.`,
        page: 1,
        pageSize: filtered.length, 
        total: filtered.length,
        pages: 1,
        orderBy,
        order,
        data: filtered,
      });
    }

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

    const formatted = result.data.map(item => {
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
            "01 Centro Comercial":            item["01 Centro Comercial"] || 0,
            "02 Devolución":                  item["02 Devolución"] || 0,
            "03 Comercio Electronico":        item["03 Comercio Electronico"] || 0,
            "04 Control de Perdida":          item["04 Control de Perdida"] || 0,
            "05 Envios FULL- Mercado Libre":  item["05 Envios FULL- Mercado Libre"] || 0,
            "06  Bodega Fabrica":             item["06  Bodega Fabrica"] || 0,
            "07 Ferreteria Balmaceda":        item["07 Ferreteria Balmaceda"] || 0,
            "08  Bodega Lo Ovalle":           item["08  Bodega Lo Ovalle"] || 0,
            "10  Reservado con Abono":        item["10  Reservado con Abono"] || 0,
            "12  Productos con Falla":        item["12  Productos con Falla"] || 0,
            "13  Reservado FULL":             item["13  Reservado FULL"] || 0,
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
