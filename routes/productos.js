const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.post('/productos', async (req, res) => {
  const { codigo, nombre, unidad, grupo, stock_min } = req.body;
  if (!codigo || !nombre || !unidad) {
        return res.status(400).json('Faltan datos requeridos (código, nombre o unidad).');
    }

  try { // << AÑADIR TRY
    await pool.query(
      'INSERT INTO productos (codigo, nombre, unidad, grupo, stock_min) VALUES ($1,$2,$3,$4,$5)',
      [codigo, nombre, unidad, grupo, stock_min]
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

router.get('/buscar', async (req, res) => {
  try { // << AÑADIR TRY
    const q = `%${req.query.q}%`;
    const { rows } = await pool.query(
      // ... (consulta SQL)
      [q]
    );
    res.json(rows);
  } catch (error) { // << AÑADIR CATCH
    console.error('Error al buscar producto:', error);
    res.status(500).json([]); // Devuelve un array vacío en caso de fallo
  }
});

module.exports = router;
