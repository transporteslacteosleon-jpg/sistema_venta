const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
  // CONFIGURACIÓN PARA EVITAR EL ERROR:
  max: 4, // Máximo de conexiones simultáneas (Clever Cloud suele dar 5)
  idleTimeoutMillis: 10000, // Cerrar conexiones inactivas tras 10 seg
  connectionTimeoutMillis: 2000, // Tiempo máximo para esperar una conexión
});

module.exports = pool;