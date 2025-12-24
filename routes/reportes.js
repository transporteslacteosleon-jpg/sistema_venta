const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.get('/reportes', async (req, res) => {
  try{
  const { desde, hasta } = req.query;
  const { rows } = await pool.query(
    'SELECT * FROM movimientos WHERE fecha BETWEEN $1 AND $2',
    [desde, hasta]
  );
  res.json(rows);
}catch (error) { // << AÑADIR CATCH
    console.error('Error al generar reporte', error);
    res.status(500).json([]); // Devuelve un array vacío en caso de fallo
  }
});

module.exports = router;
