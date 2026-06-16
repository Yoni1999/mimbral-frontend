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

const poolPromise = new sql.ConnectionPool(config).connect();

poolPromise
  .then(() => {
    console.log(" Conectado a SQL Server correctamente");
  })
  .catch((err) => {
    console.error(" Error de conexión a SQL Server:", err);
  });

module.exports = { sql, poolPromise };
