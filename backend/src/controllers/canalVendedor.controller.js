const { sql, poolPromise } = require("../models/db");

const obtenerVendedoresPorCanal = async (req, res) => {
    try {
      const { canal, periodo, fechaInicio, fechaFin, itemCode } = req.query;
      const pool = await poolPromise;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
  
        IF (@FechaInicioCustom IS NOT NULL AND @FechaFinCustom IS NOT NULL)
        BEGIN
            SET @FechaInicioActual = @FechaInicioCustom;
            SET @FechaFinActual = @FechaFinCustom;
        END
        ELSE
        BEGIN
            SET @FechaFinActual = CAST(GETDATE() AS DATE);
            SET @FechaInicioActual =
                CASE 
                    WHEN @Periodo = '1D'  THEN @FechaFinActual
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -7, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -14, @FechaFinActual)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        ;WITH VentasVendedores AS (
            SELECT 
                S.SlpName AS Nombre_Vendedor,
                S.SlpCode AS Codigo_Vendedor,
                SUM(I.LineTotal) AS Ventas
            FROM INV1 I
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            INNER JOIN OSLP S ON I.SlpCode = S.SlpCode
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR I.ItemCode = @ItemCodeParam)
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
            GROUP BY S.SlpName, S.SlpCode
        ),
        TotalVentas AS (
            SELECT SUM(Ventas) AS Total FROM VentasVendedores
        )
        SELECT 
            V.Codigo_Vendedor,
            V.Nombre_Vendedor,
            ROUND((V.Ventas / NULLIF(T.Total, 0)) * 100, 2) AS Porcentaje
        FROM VentasVendedores V
        CROSS JOIN TotalVentas T
        ORDER BY Porcentaje DESC;`;
  
      const result = await pool.request()
        .input("CanalParamInput", sql.VarChar, canal)
        .input("PeriodoParam", sql.VarChar, periodo)
        .input("FechaInicioInput", sql.Date, fechaInicio || null)
        .input("FechaFinInput", sql.Date, fechaFin || null)
        .input("ItemCodeInput", sql.VarChar, itemCode || null)
        .query(query);
  
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error en obtenerVendedoresPorCanal:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  };
  

module.exports = { obtenerVendedoresPorCanal };
