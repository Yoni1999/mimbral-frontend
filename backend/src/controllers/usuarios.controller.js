const { sql, poolPromise } = require("../models/db");

const getUsuarios = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ID, EMAIL, NOMBRE, ROL, ESTADO, FECHA_CREACION, TELEFONO FROM USUARIOS
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const updateUsuario = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { nombre, email, rol, estado, telefono } = req.body;

  try {
    const pool = await poolPromise;

    // 🔎 Obtener los datos actuales del usuario
    const result = await pool.request()
      .input("Id", sql.Int, userId)
      .query("SELECT * FROM USUARIOS WHERE ID = @Id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const current = result.recordset[0];

    // 👇 Usar los valores nuevos si existen, si no, usar los actuales
    const newNombre = nombre ?? current.NOMBRE;
    const newEmail = email ?? current.EMAIL;
    const newRol = rol ?? current.ROL;
    const newEstado = estado ?? current.ESTADO;
    const newTelefono = telefono ?? current.TELEFONO;

    await pool.request()
      .input("Id", sql.Int, userId)
      .input("Nombre", sql.NVarChar, newNombre)
      .input("Email", sql.NVarChar, newEmail)
      .input("Rol", sql.NVarChar, newRol)
      .input("Estado", sql.Int, estado)
      .input("Telefono", sql.NVarChar, newTelefono)
      .query(`
        UPDATE USUARIOS
        SET NOMBRE = @Nombre,
            EMAIL = @Email,
            ROL = @Rol,
            ESTADO = @Estado,
            TELEFONO = @Telefono
        WHERE ID = @Id
      `);

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};


const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM USUARIOS WHERE ID = @Id");
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getUsuarios,
  updateUsuario,
  deleteUsuario,
};
