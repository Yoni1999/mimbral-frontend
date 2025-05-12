const cache = new Map();

/**
 * Obtiene los datos desde la caché si existen, o ejecuta la consulta y los guarda en caché.
 * @param {string} key - Clave única para identificar la caché.
 * @param {function} fetchFunction - Función que ejecuta la consulta a la base de datos.
 * @param {number} ttl - Tiempo en milisegundos antes de que la caché expire (por defecto, 60s).
 */
const getCachedData = async (key, fetchFunction, ttl = 60000) => {
  if (cache.has(key)) {
    console.log(`⚡ Usando caché para ${key}`);
    return cache.get(key);
  }

  console.log(`⏳ Consultando base de datos para ${key}`);
  try {
    const data = await fetchFunction(); // 🔹 Ejecuta la consulta a la BD
    cache.set(key, data);
    setTimeout(() => cache.delete(key), ttl); // 🔹 Expira después del tiempo definido
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo datos de ${key}:`, error);
    throw error;
  }
};

/**
 * Elimina una clave específica de la caché, forzando la próxima consulta a la base de datos.
 * @param {string} key - Clave a eliminar de la caché.
 */
const clearCache = (key) => {
  console.log(`🗑️ Eliminando caché para ${key}`);
  cache.delete(key);
};

module.exports = { getCachedData, clearCache };
