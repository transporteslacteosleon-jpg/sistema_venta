const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.get('/listas', async (req, res) => {
  try {
    const unidades = await pool.query(
      'SELECT nombre FROM unidades ORDER BY nombre'
    );

    const grupos = await pool.query(
      'SELECT nombre FROM grupos ORDER BY nombre'
    );

    res.json({
      unidades: unidades.rows.map(r => r.nombre),
      grupos: grupos.rows.map(r => r.nombre)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo listas' });
  }
});

module.exports = router;

