const jwt = require("jsonwebtoken");
const { buildVentasPorCanalSnapshot } = require("../services/public/ventasPorCanal.service");

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";
const SHARE_SCOPE = "ventas-productos-por-canal";

const pickFilters = (source = {}) => ({
  canal: source.canal ?? null,
  vendedor: source.vendedor ?? null,
  periodo: source.periodo ?? null,
  fechaInicio: source.fechaInicio ?? null,
  fechaFin: source.fechaFin ?? null,
  proveedor: source.proveedor ?? null,
  primerNivel: source.primerNivel ?? null,
  categoria: source.categoria ?? null,
  subcategoria: source.subcategoria ?? null,
  tipoEnvio: source.tipoEnvio ?? null,
  sku: source.sku ?? null,
  familia: source.familia ?? null,
  subfamilia: source.subfamilia ?? null,
  orderBy: source.orderBy ?? "cantidadVendida",
  order: source.order ?? "desc",
});

async function crearLinkCompartibleVentasPorCanal(req, res) {
  try {
    const bodyFilters = req.body?.filters || req.body || {};
    const filters = pickFilters(bodyFilters);
    const token = jwt.sign(
      {
        scope: SHARE_SCOPE,
        filters,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return res.status(201).json({
      token,
      expiresAt,
      scope: SHARE_SCOPE,
    });
  } catch (error) {
    console.error("Error creando link compartible:", error);
    return res.status(500).json({ error: "No se pudo generar el enlace compartible." });
  }
}

async function obtenerDashboardCompartidoVentasPorCanal(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: "Token no proporcionado." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.scope !== SHARE_SCOPE) {
      return res.status(403).json({ error: "Token no valido para este recurso." });
    }

    const result = await buildVentasPorCanalSnapshot(decoded.filters || {});

    return res.json({
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
      scope: SHARE_SCOPE,
      ...result,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "El enlace compartido expiro." });
    }

    console.error("Error obteniendo dashboard compartido:", error);
    return res.status(500).json({ error: "No se pudo cargar el enlace compartido." });
  }
}

module.exports = {
  crearLinkCompartibleVentasPorCanal,
  obtenerDashboardCompartidoVentasPorCanal,
};
