// AÑADIR ESTA LÍNEA AL INICIO
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // Configuración necesaria para bases de datos remotas como Clever Cloud
  ssl: { rejectUnauthorized: false }
});
module.exports = pool;
