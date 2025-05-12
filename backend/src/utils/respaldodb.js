const sql = require("mssql");
require("dotenv").config();

console.log("🔍 Verificando conexión...");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);

const config = {
  user: process.env.DB_USER || "usuario_default",
  password: process.env.DB_PASS || "contraseña_default",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "SBO_INTER_MIM",
  options: {
    encrypt: false, 
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 2, 
    idleTimeoutMillis: 30000, 
  },
  requestTimeout: 300000, 
  connectionTimeout: 30000, 
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Conectado a SQL Server correctamente");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Error de conexión a SQL Server:", err);
    process.exit(1); 
  });

module.exports = { sql, poolPromise };
