const sql = require("mssql");
const { dbUser, dbPass, dbServer, dbDatabase } = require("../config/env");

const config = {
  user: dbUser,
  password: dbPass,
  server: dbServer,
  database: dbDatabase,
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
    console.log(" Conectado a SQL Server correctamente");
    return pool;
  })
  .catch((err) => {
    console.error(" Error de conexión a SQL Server:", err);
    process.exit(1);
  });

module.exports = { sql, poolPromise };
