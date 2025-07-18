require("dotenv").config();
const express = require("express");
const cors = require("cors");
const os = require("os");
const authMiddleware = require("./src/middleware/authMiddleware");

// ✅ Rutas
const ventasRoutes = require("./src/routes/ventascanal.routes");
const authRoutes = require("./src/routes/auth.routes");
const quiebresRoutes = require("./src/routes/quiebres.routes");
const margenRoutes = require("./src/routes/margen.routes");
const categoriasRoutes = require("./src/routes/categorias.routes");
const ventasHoyRoutes = require("./src/routes/ventashoy.routes");
const actualizarDatosRoutes = require("./src/routes/actualizarDatos.routes");
const vendedoresRoutes = require("./src/routes/vendedores.routes");
const canalVendedorRoutes = require("./src/routes/canalVendedor.routes");
const usuariosAdminRoutes = require("./src/routes/usuarios.routes");
const adminRoutes = require("./src/routes/admin.routes");
const sugerenciasRoutes = require("./src/routes/sugerencias.routes");
const periodosRoutes = require("./src/routes/metas/periodos.routes");
const metasRoutes = require("./src/routes/metas/metas.routes");
const filtrosmetasRoutes = require("./src/routes/metas/filtrosmetas.routes");
const resumenCategoriaRoutes = require("./src/routes/resumen-categoria/resumenCategoria.routes");
const categoria3nivelRoutes = require("./src/routes/resumen-categoria/categoria3nivel.routes");
const categoria1nivelRoutes = require("./src/routes/resumen-categoria/categoria1nivel.routes");
const productosvendedorRoutes = require("./src/routes/productosvendedor/productosvendedor.routes");
const obtenervendedorescanalRoutes = require("./src/routes/productosvendedor/obtenervendedorescanal.routes");
const obtenerProductosDetenidos = require("./src/routes/informes/productosdetenidos.routes");
const obtenerproveedoresRoutes = require("./src/routes/informes/filtrosdetenidos.routes");
const productoRoutes = require("./src/routes/productos/producto.routes");
const top10clientesRoutes = require("./src/routes/ventas-canal/ventascanal.routes"); 
const omcRoutes = require("./src/routes/OMC/templace.routes");
const creditoRoutes = require("./src/routes/lineacredito/credito.routes")
const renovarSesionRoutes = require("./src/routes/renovarSesion.routes");

const app = express();
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 🔐 Middleware de autenticación
app.use((req, res, next) => {
  const publicRoutes = ["/api/auth", "/api/entradas", "/api/templace"];
  const isPublic = publicRoutes.some((route) => req.path.startsWith(route));
  if (isPublic) return next();
  authMiddleware(req, res, next);
});

// Rutas públicas
app.use("/api/auth", authRoutes);
app.use("/api/templace", omcRoutes);

// Rutas protegidas
app.use("/api", ventasRoutes);
app.use("/api/quiebres", quiebresRoutes);
app.use("/api/margen", margenRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api", ventasHoyRoutes);
app.use("/api", actualizarDatosRoutes);
app.use("/api", vendedoresRoutes);
app.use("/api", canalVendedorRoutes);
app.use("/api/admin/usuarios", usuariosAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sugerencias", sugerenciasRoutes);
app.use('/api/periodos', periodosRoutes);
app.use('/api/metas', metasRoutes);
app.use("/api/metas", filtrosmetasRoutes)
app.use("/api/resumen-categoria", resumenCategoriaRoutes);
app.use("/api/tercer-nivel", categoria3nivelRoutes);
app.use("/api/primer-nivel", categoria1nivelRoutes);
app.use("/api/pv", productosvendedorRoutes);
app.use("/api/oc", obtenervendedorescanalRoutes);
app.use("/api", obtenerProductosDetenidos);
app.use("/api/",obtenerproveedoresRoutes);
app.use("/api/", productoRoutes);
app.use("/api", top10clientesRoutes);
app.use("/api", creditoRoutes);
app.use("/api", renovarSesionRoutes);

// Obtener IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "127.0.0.1";
}

const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const localIP = getLocalIP();
//Jobs automático
require("./src/cron/cronJobs");
// Iniciar servidor 
app.listen(PORT, HOST, async () => {
  console.log(`Servidor corriendo en:`);
  console.log(`Local:     http://localhost:${PORT}`);
  console.log(`Red local: http://${localIP}:${PORT}`);

});
