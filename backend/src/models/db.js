const sql = require("mssql");
const {
  dbUser,
  dbPass,
  dbServer,
  dbDatabase,
  dbRequestTimeout,
} = require("../config/env");

const requestTimeout = Number(process.env.DB_REQUEST_TIMEOUT_MS || 1800000);
const connectionTimeout = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 60000);

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
    idleTimeoutMillis: 60000,
  },
  requestTimeout,
  connectionTimeout,
};

const poolPromise = new sql.ConnectionPool(config).connect();

poolPromise
  .then(() => {
    console.log("Conectado a SQL Server correctamente");
  })
  .catch((err) => {
    console.error("Error de conexion a SQL Server:", err);
  });

module.exports = { sql, poolPromise };
