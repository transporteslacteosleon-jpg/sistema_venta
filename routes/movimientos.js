const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

// 1. OBTENER HISTORIAL DE MOVIMIENTOS (La ruta que falta)
router.get('/movimientos/historial', async (req, res) => {
  const { desde, hasta, tipo } = req.query;
  
  try {
    let query = 'SELECT * FROM movimientos WHERE 1=1';
    const params = [];

    // Filtro por fecha (si existen)
    if (desde && hasta) {
      params.push(desde, hasta);
      query += ` AND fecha BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    // Filtro por tipo
    if (tipo) {
      params.push(tipo);
      query += ` AND tipo = $${params.length}`;
    }

    query += ' ORDER BY fecha DESC LIMIT 100';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// 2. REGISTRAR NUEVO MOVIMIENTO
router.post('/movimientos', async (req, res) => {
  const { codigo, tipo, cantidad, fecha, observaciones } = req.body;

  // Lógica de signo: Salidas y ajustes negativos restan
  const signo = ['SALIDA', 'AJUSTE_NEGATIVO'].includes(tipo) ? -1 : 1;
  const cantMov = cantidad * signo;

  try {
    await pool.query('BEGIN');

    // Insertar el movimiento
    await pool.query(
      `INSERT INTO movimientos (codigo, tipo, cantidad, fecha, observaciones)
       VALUES ($1, $2, $3, $4, $5)`,
      [codigo, tipo, cantMov, fecha || new Date(), observaciones]
    );

    // Actualizar el stock en la tabla de productos (Crucial para el sistema)
    await pool.query(
      `UPDATE productos 
       SET stock = stock + $1 
       WHERE codigo = $2`,
      [cantMov, codigo]
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Movimiento registrado y stock actualizado correctamente',
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error en movimiento:', error);
    res.status(500).json({ error: 'Error al procesar el movimiento' });
  }
});

module.exports = router;