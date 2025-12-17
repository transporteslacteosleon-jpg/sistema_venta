const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/dashboard', async (req, res) => {
  try {
    const totalProductos = await pool.query(
      'SELECT COUNT(*) FROM productos'
    );
    const totalMovimientos = await pool.query(
      'SELECT COUNT(*) FROM movimientos'
    );
    const sinStock = await pool.query(
      'SELECT COUNT(*) FROM productos WHERE stock_min <= 0'
    );
    const stockBajo = await pool.query(
      'SELECT COUNT(*) FROM productos WHERE stock > 0 AND stock <= stock_min'
    );

    res.json({
      totalProductos: totalProductos.rows[0].count,
      totalMovimientos: totalMovimientos.rows[0].count,
      sinStock: sinStock.rows[0].count,
      stockBajo: stockBajo.rows[0].count
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
});

module.exports = router;

