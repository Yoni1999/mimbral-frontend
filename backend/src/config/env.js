require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  host: "0.0.0.0",
  dbUser: process.env.DB_USER || "usuario_default",
  dbPass: process.env.DB_PASS || "contraseña_default",
  dbServer: process.env.DB_SERVER || "localhost",
  dbDatabase: process.env.DB_DATABASE || "SBO_INTER_MIM",
};
