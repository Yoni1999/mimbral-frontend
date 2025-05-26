const sql = require('mssql');
const { poolPromise } = require('../../models/db');

// GET: obtener metas por período y canal
const obtenerMetasPorCanal = async (req, res) => {
  const { idPeriodo, idCanal } = req.query;

  if (!idPeriodo || !idCanal) {
    return res.status(400).json({ error: 'Se requiere idPeriodo e idCanal' });
  }

  try {
    const pool = await poolPromise;

    // Declaramos los slpCodes directamente
    let slpCodes = '';

    if (idCanal == 1) slpCodes = '227,250,205,138,209,228,226,137,212,225';
    else if (idCanal == 2) slpCodes = '371,305,211';
    else if (idCanal == 3) slpCodes = '355,303';
    else if (idCanal == 5) slpCodes = '401,397';

    const result = await pool.request()
      .input('ID_PERIODO', sql.Int, idPeriodo)
      .input('ID_CANAL', sql.Int, idCanal)
      .input('SLPCODES', sql.VarChar, slpCodes)
      .query(`
        SELECT 
          mp.ID_META, 
          mp.SKU,
          itm.ItemName AS NOMBRE_PRODUCTO,
          mp.ID_PERIODO,
          mp.META_CANTIDAD,
          mp.TIPO_META,
          mp.MONTO_META,
          ISNULL(SUM(i.Quantity), 0) AS TOTAL_VENDIDO,
          ISNULL(SUM(i.LineTotal), 0) AS MONTO_TOTAL
        FROM METAS_PRODUCTO_CANAL mp
        LEFT JOIN OITM itm ON mp.SKU = itm.ItemCode
        LEFT JOIN (
            SELECT i.ItemCode, i.Quantity, i.LineTotal
            FROM INV1 i
            JOIN OINV o ON o.DocEntry = i.DocEntry
            WHERE o.DocDate BETWEEN 
              (SELECT FECHA_INICIO FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
              AND 
              (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
              AND o.CANCELED = 'N'
              AND i.SlpCode IN (
                SELECT value FROM STRING_SPLIT(@SLPCODES, ',')
              )
        ) AS i ON i.ItemCode = mp.SKU
        WHERE mp.ID_PERIODO = @ID_PERIODO
          AND mp.ID_CANAL = @ID_CANAL
        GROUP BY mp.ID_META, mp.SKU, itm.ItemName, mp.ID_PERIODO, mp.META_CANTIDAD, mp.TIPO_META, mp.MONTO_META
        ORDER BY mp.META_CANTIDAD DESC;
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener metas por canal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

//MÉTODO POST PARA INSERTAR METAS
const insertarMeta = async (req, res) => {
  const {
    id_canal,
    id_periodo,
    tipo_meta,
    sku,
    meta_cantidad,
    meta_monto
  } = req.body;

  if (!id_canal || !id_periodo || !tipo_meta) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const pool = await poolPromise;


    await pool.request()
      .input('sku', sql.VarChar(50), tipo_meta === 'cantidad' ? sku : null)
      .input('id_periodo', sql.Int, id_periodo)
      .input('id_canal', sql.Int, id_canal)
      .input('meta_cantidad', sql.Int, tipo_meta === 'cantidad' ? meta_cantidad : null)
      .input('tipo_meta', sql.VarChar(20), tipo_meta)
      .input('monto_meta', sql.Decimal(18, 2), tipo_meta === 'monto' ? meta_monto : null)
      .query(`
        INSERT INTO metas_producto_canal (
          SKU,
          ID_PERIODO,
          ID_CANAL,
          META_CANTIDAD,
          FECHA_REGISTRO,
          TIPO_META,
          MONTO_META
        )
        VALUES (
          @sku,
          @id_periodo,
          @id_canal,
          @meta_cantidad,
          GETDATE(),
          @tipo_meta,
          @monto_meta
        )
      `);

    res.status(201).json({ message: 'Meta registrada con éxito' });
  } catch (error) {
    console.error('Error al registrar meta:', error);
    res.status(500).json({ error: 'Error del servidor al registrar meta' });
  }
};

// POST /api/metas-vendedor/asignar
const asignarMetasAVendedores = async (req, res) => {
  const { id_meta, asignaciones } = req.body;

  if (!id_meta || !Array.isArray(asignaciones) || asignaciones.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const pool = await poolPromise;

    // Obtener información de la meta principal
    const metaRes = await pool.request()
      .input('id_meta', sql.Int, id_meta)
      .query(`
        SELECT ID_CANAL, TIPO_META, META_CANTIDAD, MONTO_META
        FROM METAS_PRODUCTO_CANAL
        WHERE ID_META = @id_meta
      `);

    if (metaRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const { ID_CANAL: idCanalMeta, TIPO_META: tipoMeta, META_CANTIDAD, MONTO_META } = metaRes.recordset[0];

    // Validar que los vendedores pertenezcan al canal correcto
    for (const asignacion of asignaciones) {
      const vendedorRes = await pool.request()
        .input('id_vendedor', sql.Int, asignacion.id_vendedor)
        .query(`SELECT ID_CANAL FROM VENDEDORES WHERE ID_VENDEDOR = @id_vendedor`);

      if (
        vendedorRes.recordset.length === 0 ||
        vendedorRes.recordset[0].ID_CANAL !== idCanalMeta
      ) {
        return res.status(400).json({
          error: `Vendedor ID ${asignacion.id_vendedor} no pertenece al canal de la meta`,
        });
      }
    }

    // Calcular total ya asignado
    const acumuladoRes = await pool.request()
      .input('id_meta', sql.Int, id_meta)
      .query(`
        SELECT 
          SUM(ISNULL(META_CANTIDAD, 0)) AS TOTAL_CANTIDAD,
          SUM(ISNULL(META_MONTO, 0)) AS TOTAL_MONTO
        FROM METAS_VENDEDOR
        WHERE ID_META = @id_meta
      `);

    const acumulado = acumuladoRes.recordset[0];
    const totalAsignado = tipoMeta === 'cantidad' ? acumulado.TOTAL_CANTIDAD : acumulado.TOTAL_MONTO;
    const nuevaAsignacion = asignaciones.reduce((acc, a) => acc + Number(a.meta_asignada || 0), 0);
    const totalPermitido = tipoMeta === 'cantidad' ? META_CANTIDAD : MONTO_META;

    if ((totalAsignado + nuevaAsignacion) > totalPermitido) {
      return res.status(400).json({
        error: `La asignación total (${totalAsignado + nuevaAsignacion}) supera el límite de la meta (${totalPermitido})`
      });
    }

    // Insertar submetas
    for (const asignacion of asignaciones) {
      const req = pool.request()
        .input('id_meta', sql.Int, id_meta)
        .input('id_vendedor', sql.Int, asignacion.id_vendedor);

      if (tipoMeta === 'cantidad') {
        req.input('meta_cantidad', sql.Int, asignacion.meta_asignada);
        req.input('meta_monto', sql.Decimal(18, 2), null);
      } else {
        req.input('meta_cantidad', sql.Int, null);
        req.input('meta_monto', sql.Decimal(18, 2), asignacion.meta_asignada);
      }

      await req.query(`
        INSERT INTO METAS_VENDEDOR (ID_META, ID_VENDEDOR, META_CANTIDAD, META_MONTO)
        VALUES (@id_meta, @id_vendedor, @meta_cantidad, @meta_monto)
      `);
    }

    return res.status(201).json({ message: 'Submetas asignadas correctamente' });
  } catch (error) {
    console.error('Error al asignar submetas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
const obtenerVendedoresmeta = async (req, res) => {
  const { id_canal } = req.query;

  if (!id_canal) {
    return res.status(400).json({ error: 'Falta el parámetro id_canal' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id_canal', sql.Int, id_canal)
      .query(`
        SELECT ID_VENDEDOR AS id, NOMBRE 
        FROM VENDEDORES 
        WHERE ID_CANAL = @id_canal
      `);

    const vendedores = result.recordset;
  if (vendedores.length === 0) {
    return res.status(200).json({ message: 'Este canal no tiene vendedores asociados', data: [] });
  }


    return res.status(200).json(vendedores);
  } catch (error) {
    console.error('Error al obtener vendedores por canal:', error);
    return res.status(500).json({ error: 'Error al obtener los vendedores' });
  }
};
const obtenerTotalesAsignados = async (req, res) => {
  const { id_meta } = req.params;

  if (!id_meta) {
    return res.status(400).json({ error: 'Falta el parámetro id_meta' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id_meta', sql.Int, id_meta)
      .query(`
        SELECT 
          COALESCE(SUM(v.META_CANTIDAD), 0) AS TOTAL_ASIGNADA,
          COALESCE(SUM(v.META_MONTO), 0) AS TOTAL_MONTO_ASIGNADO,
          ISNULL(m.META_CANTIDAD, 0) AS META_CANTIDAD_TOTAL,
          ISNULL(m.MONTO_META, 0) AS MONTO_META_TOTAL
        FROM METAS_PRODUCTO_CANAL m
        LEFT JOIN METAS_VENDEDOR v ON v.ID_META = m.ID_META
        WHERE m.ID_META = @id_meta
        GROUP BY m.META_CANTIDAD, m.MONTO_META
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener asignaciones de la meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const editarMeta = async (req, res) => {
  const { id, metaCantidad, tipoMeta, montoMeta } = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('ID_META', sql.Int, id)
      .input('META_CANTIDAD', sql.Int, metaCantidad)
      .input('TIPO_META', sql.NVarChar, tipoMeta)
      .input('MONTO_META', sql.Decimal(18, 2), montoMeta)
      .query(`
        UPDATE METAS_PRODUCTO_CANAL
        SET 
          META_CANTIDAD = @META_CANTIDAD,
          TIPO_META = @TIPO_META,
          MONTO_META = @MONTO_META
        WHERE ID_META = @ID_META
      `);

    res.json({ success: true, message: 'Meta actualizada correctamente.' });
  } catch (error) {
    console.error('Error al editar la meta:', error);
    res.status(500).json({ success: false, message: 'Error al editar la meta.' });
  }
};

const eliminarMeta = async (req, res) => {
  const { id } = req.params;
  const forzar = req.query.force === 'true'; // Uso de query param ?force=true

  try {
    const pool = await poolPromise;

    // 1. Verificar si existen asignaciones en METAS_VENDEDORES
    const check = await pool.request()
      .input('ID_META', sql.Int, parseInt(id))
      .query(`SELECT COUNT(*) as total FROM METAS_VENDEDOR WHERE ID_META = @ID_META`);

    const totalAsignaciones = check.recordset[0].total;

    // 2. Si hay asignaciones y no se forza, responder advertencia
    if (totalAsignaciones > 0 && !forzar) {
      return res.status(409).json({
        success: false,
        requiereConfirmacion: true,
        message: 'La meta está asignada a uno o más vendedores. ¿Deseas eliminarla de todos modos?'
      });
    }

    // 3. Eliminar asignaciones si existen
    if (totalAsignaciones > 0) {
      await pool.request()
        .input('ID_META', sql.Int, parseInt(id))
        .query('DELETE FROM METAS_VENDEDOR WHERE ID_META = @ID_META');
    }

    // 4. Eliminar la meta principal
    await pool.request()
      .input('ID_META', sql.Int, parseInt(id))
      .query('DELETE FROM METAS_PRODUCTO_CANAL WHERE ID_META = @ID_META');

    return res.json({
      success: true,
      message: totalAsignaciones > 0
        ? 'Meta y asignaciones de vendedores eliminadas correctamente.'
        : 'Meta eliminada correctamente.'
    });

  } catch (error) {
    console.error('Error al eliminar la meta:', error);
    return res.status(500).json({ success: false, message: 'Error interno al eliminar la meta.' });
  }
};
module.exports = {
  obtenerMetasPorCanal, insertarMeta, asignarMetasAVendedores, obtenerVendedoresmeta, obtenerTotalesAsignados, editarMeta, eliminarMeta 
};
