const sql = require("mssql");
const { poolPromise } = require("../models/db");
const { getCachedData } = require("../utils/cache");

// 🔹 Obtener TODAS las categorías con la cantidad de subcategorías en quiebre (solo productos activos)
const obtenerCategorias = async (req, res) => {
    try {
      const pool = await poolPromise;
      const proveedor = req.query.proveedor || null; // 🔹 Obtener el parámetro desde el frontend
  
      const query = `
        DECLARE @Proveedor NVARCHAR(20) = @ProveedorParam; -- Permitir NULL si no se especifica
        
        WITH ProductosEnQuiebre AS (
            -- Obtener los productos en quiebre en los almacenes 1, 3, 7 (solo productos activos)
            SELECT DISTINCT 
                I.ItemCode,
                I.U_CATEGORIA,
                I.U_SubCategoria
            FROM OITM I
            JOIN OITW W ON I.ItemCode = W.ItemCode
            JOIN OSCN S ON I.ItemCode = S.ItemCode  -- 🔹 Asociar productos con proveedores
            WHERE W.WhsCode IN (1, 3, 7)
              AND I.PrchseItem = 'Y'  -- ✅ Filtrar solo productos activos
              AND (@Proveedor IS NULL OR S.CardCode = @Proveedor)  -- ✅ Si @Proveedor es NULL, se muestran todos
            GROUP BY I.ItemCode, I.U_CATEGORIA, I.U_SubCategoria
            HAVING SUM(W.OnHand) = 0  -- ✅ Filtrar solo los productos con stock 0
        )
        SELECT 
            C.Name AS categoria, 
            C.Code AS Codigo,
            COUNT(DISTINCT P.U_SubCategoria) AS subcategorias_en_quiebre
        FROM [@CATEGORIA] C  
        LEFT JOIN ProductosEnQuiebre P ON C.Code = P.U_CATEGORIA  
        GROUP BY C.Code, C.Name
        ORDER BY C.Name;
      `;
  
      const request = pool.request();
      request.input("ProveedorParam", sql.NVarChar, proveedor); // 🔹 Pasar el parámetro de proveedor
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener categorías con subcategorías en quiebre:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
// 🔹 Obtener SUBCATEGORÍAS en quiebre de una categoría específica (solo productos activos)
const obtenerSubcategoriasEnQuiebre = async (req, res) => {
    try {
      const { codigo_categoria } = req.params; 
      const proveedor = req.query.proveedor || null; // 🔹 Se recibe como parámetro en la URL
  
      const pool = await poolPromise;
      const query = `
        DECLARE @Proveedor NVARCHAR(20) = @proveedorInput;
        DECLARE @Categoria NVARCHAR(50) = @codigo_categoria;
    
        WITH ProductosEnQuiebre AS (
            -- 🔹 Obtener productos en quiebre en almacenes 1, 3, 7 (solo productos activos)
            SELECT DISTINCT 
                I.ItemCode,
                I.U_SubCategoria
            FROM OITM I
            JOIN OITW W ON I.ItemCode = W.ItemCode
            JOIN OSCN S ON I.ItemCode = S.ItemCode  -- 🔹 Relación con proveedores
            WHERE W.WhsCode IN (1, 3, 7)  
            AND I.PrchseItem = 'Y'  -- ✅ Solo productos activos
            AND (@Proveedor IS NULL OR S.CardCode = @Proveedor)  -- ✅ Filtrar por proveedor si se especifica
            GROUP BY I.ItemCode, I.U_SubCategoria
            HAVING SUM(W.OnHand) = 0  -- ✅ Solo productos con stock 0 (quiebre)
        )
        SELECT 
            C.Code AS codigo_categoria,
            S.Code AS codigo_subcategoria,
            ISNULL(S.Name, 'Sin Subcategoría') AS nombre_subcategoria, 
            COUNT(DISTINCT P.ItemCode) AS productos_en_quiebre
        FROM [@CATEGORIA] C  
        LEFT JOIN [@SUBCATEGORIA] S ON C.Code = S.U_CATEGORIA  
        LEFT JOIN OITM I ON S.Code = I.U_SubCategoria  -- 🔹 Vincular con los productos
        LEFT JOIN OSCN S2 ON I.ItemCode = S2.ItemCode -- 🔹 Relación con proveedor
        LEFT JOIN ProductosEnQuiebre P ON S.Code = P.U_SubCategoria
        WHERE C.Code = @Categoria
        AND (@Proveedor IS NULL OR S2.CardCode = @Proveedor)  -- ✅ Incluir todas las subcategorías del proveedor
        GROUP BY C.Code, S.Code, S.Name
        ORDER BY C.Code, S.Code;

      `;
  
      const result = await pool.request()
        .input("proveedorInput", sql.NVarChar, proveedor)
        .input("codigo_categoria", sql.NVarChar, codigo_categoria)
        .query(query);
  
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener subcategorías en quiebre:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  

const getVentasPorCategoria = async (req, res) => {
  try {
      const pool = await poolPromise;
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null; // Nuevo filtro
      const periodo = req.query.periodo || "1D"; // Por defecto, hoy
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;

      const query = `
          DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
          DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
          DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
          DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
          DECLARE @FechaFinCustom DATE = @FechaFinInput;

          DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
          DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;

          -- Si hay fechas personalizadas, usarlas
          IF (@FechaInicioCustom IS NOT NULL AND @FechaFinCustom IS NOT NULL)
          BEGIN
              SET @FechaInicioActual = @FechaInicioCustom;
              SET @FechaFinActual = @FechaFinCustom;
          END
          ELSE
          BEGIN
              -- Definir el período según la opción seleccionada
              SET @FechaFinActual = CAST(GETDATE() AS DATE);
              SET @FechaInicioActual =
                  CASE 
                      WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
                      WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                      WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                      WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                      WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                      ELSE @FechaFinActual -- Si es '1D', solo hoy
                  END;
          END

          -- Definir el período anterior para comparación
          DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
          SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
          SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);

          -- 🔹 Ventas por categoría en el período actual
          WITH VentasActual AS (
              SELECT 
                  C.Name AS Categoria,
                  SUM(I.LineTotal) AS Ventas_Actual
              FROM INV1 I
              INNER JOIN OITM O ON I.ItemCode = O.ItemCode
              INNER JOIN [@categoria] C ON O.U_Categoria = C.Code -- 🔥 Unir con la tabla correcta de categorías
              INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
              WHERE 
                  T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                  AND T0.CANCELED = 'N'
                  AND (
                      @CanalParam IS NULL
                      OR (
                          (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                              OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                          OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                          OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                          OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                          OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                              AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 225, 250, 205, 138, 209, 228, 226, 137, 212))
                          OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                              AND I.SlpCode IN (227, 250, 225, 205, 138, 209, 228, 226, 137, 212))
                      )
                  )
                  AND (@VendedorEmpresaParam IS NULL OR I.SlpCode = @VendedorEmpresaParam) -- 🔥 Filtro por vendedor empresa
              GROUP BY C.Name
          ),
          -- 🔹 Ventas por categoría en el período anterior
          VentasAnterior AS (
              SELECT 
                  C.Name AS Categoria,
                  SUM(I.LineTotal) AS Ventas_Anterior
              FROM INV1 I
              INNER JOIN OITM O ON I.ItemCode = O.ItemCode
              INNER JOIN [@categoria] C ON O.U_Categoria = C.Code
              INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
              WHERE 
                  T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                  AND T0.CANCELED = 'N'
                  AND (
                      @CanalParam IS NULL
                      OR (
                          (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                              OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                          OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                          OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                          OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                          OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                              AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                          OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                              AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                      )
                  )
                  AND (@VendedorEmpresaParam IS NULL OR I.SlpCode = @VendedorEmpresaParam) -- 🔥 Filtro por vendedor empresa
              GROUP BY C.Name
          )
          -- 🔹 Resultado final con comparación de períodos
          SELECT 
              VA.Categoria,
              VA.Ventas_Actual,
              COALESCE(VAnt.Ventas_Anterior, 0) AS Ventas_Anterior,
              CASE 
                  WHEN VAnt.Ventas_Anterior = 0 THEN NULL
                  ELSE CAST(((VA.Ventas_Actual - VAnt.Ventas_Anterior) * 100.0 / VAnt.Ventas_Anterior) AS DECIMAL(18, 2))
              END AS PorcentajeCambio
          FROM VentasActual VA
          LEFT JOIN VentasAnterior VAnt ON VA.Categoria = VAnt.Categoria
          ORDER BY VA.Ventas_Actual DESC;
      `;

      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);

      const result = await request.query(query);
      res.json(result.recordset);
  } catch (error) {
      console.error("❌ Error al obtener ventas por categoría:", error);
      res.status(500).json({ error: "Error en el servidor." });
  }
};



module.exports = { obtenerCategorias,obtenerSubcategoriasEnQuiebre, getVentasPorCategoria};
