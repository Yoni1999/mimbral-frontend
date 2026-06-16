const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  port: process.env.PORT || 3001,
  host: "0.0.0.0",
  dbUser: process.env.DB_USER || "usuario_default",
  dbPass: process.env.DB_PASS || "contraseña_default",
  dbServer: process.env.DB_SERVER || "localhost",
  dbDatabase: process.env.DB_DATABASE || "SBO_INTER_MIM",
};
