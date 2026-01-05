const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.post('/productos', async (req, res) => {
  const { codigo, nombre, unidad, grupo, stock_min, precio_costo, precio_venta } = req.body;
  if (!codigo || !nombre || !unidad) {
        return res.status(400).json('Faltan datos requeridos (código, nombre o unidad).');
    }

  try { // << AÑADIR TRY
    await pool.query(
      'INSERT INTO productos (codigo, nombre, unidad, grupo, stock_min, precio_costo, precio_venta) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [codigo, nombre, unidad, grupo, stock_min, precio_costo, precio_venta]
    );

    res.status(201).json('Producto registrado correctamente'); // << Status 201 Created
  } catch (error) { // << AÑADIR CATCH
    console.error('Error al registrar producto:', error);
    // Verificar si es un error de código duplicado (ej. status 23505 en Postgres)
    if (error.code === '23505') { 
        return res.status(409).json('Error: El código de producto ya existe.');
    }
    res.status(500).json('Error interno al registrar el producto.');
  }
});
//buscar productos
router.get('/productos/buscar', async (req, res) => {
    const termino = req.query.q;

    if (!termino) {
        return res.json([]);
    }

    try {
        // Buscamos por código O por nombre usando ILIKE para ignorar mayúsculas/minúsculas
        const { rows } = await pool.query(
            'SELECT * FROM productos WHERE codigo ILIKE $1 OR nombre ILIKE $1 LIMIT 10',
            [`%${termino}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error en búsqueda de productos:', error);
        res.status(500).json({ error: 'Error interno en la búsqueda' });
    }
});

module.exports = router;
