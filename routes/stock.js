const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.get('/stock', async (_, res) => {
  try{
  const { rows } = await pool.query(`
    SELECT p.codigo,p.nombre,p.unidad,p.grupo,p.stock_min,
    COALESCE(SUM(m.cantidad),0) cantidad
    FROM productos p
    LEFT JOIN movimientos m ON p.codigo=m.codigo
    GROUP BY p.codigo
  `);
  res.json(rows);
  }catch (error) { // << AÑADIR CATCH
    console.error('Error al obtener stock', error);
    res.status(500).json([]); // Devuelve un array vacío en caso de fallo
  }
});

module.exports = router;
