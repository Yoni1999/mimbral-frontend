const { sql, poolPromise } = require("../models/db");
const bcrypt = require("bcrypt");

class UserModel {
  static async findByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM USUARIOS WHERE EMAIL = @email");
    return result.recordset[0];
  }

  static async createUser(email, password, nombre) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;
    await pool.request()
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, hashedPassword)
      .input("nombre", sql.NVarChar, nombre)
      .query(`
        INSERT INTO USUARIOS (EMAIL, PASSWORD_HASH, NOMBRE) 
        VALUES (@email, @password, @nombre)
      `);
  }
}

module.exports = UserModel;
