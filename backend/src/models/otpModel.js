const { sql, poolPromise } = require("../models/db");

class OTPModel {
  static async generateOTP(userId, otpCode) {
    const pool = await poolPromise;
    await pool.request()
      .input("userId", sql.Int, userId)
      .input("otp", sql.NVarChar, otpCode)
      .input("expiraEn", sql.DateTime, new Date(Date.now() + 10 * 60000)) // Expira en 10 min
      .query(`
        INSERT INTO OTP_CODES (USUARIO_ID, OTP, EXPIRA_EN, USADO) 
        VALUES (@userId, @otp, @expiraEn, 0)
      `);
  }

  static async verifyOTP(userId, otpCode) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .input("otp", sql.NVarChar, otpCode)
      .query(`
        SELECT * FROM OTP_CODES 
        WHERE USUARIO_ID = @userId AND OTP = @otp 
          AND USADO = 0 AND EXPIRA_EN > GETDATE()
      `);
    
    return result.recordset[0];
  }

  static async markOTPUsed(userId, otpCode) {
    const pool = await poolPromise;
    await pool.request()
      .input("userId", sql.Int, userId)
      .input("otp", sql.NVarChar, otpCode)
      .query(`
        UPDATE OTP_CODES SET USADO = 1 
        WHERE USUARIO_ID = @userId AND OTP = @otp
      `);
  }
}

module.exports = OTPModel;
