const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

// Obtener todos los clientes
router.get('/clientes', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM clientes ORDER BY razon_social ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json([]); // ENVIAR ARRAY VACÍO en lugar de un string
    }
});

// Registrar nuevo cliente
router.post('/clientes', async (req, res) => {
    const { rut, razon_social, giro, direccion, telefono } = req.body;
    try {
        await pool.query(
            'INSERT INTO clientes (rut, razon_social, giro, direccion, telefono) VALUES ($1, $2, $3, $4, $5)',
            [rut, razon_social, giro, direccion, telefono]
        );
        res.json({ success: true, message: 'Cliente registrado' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'El RUT ya existe' });
        }
        res.status(500).json({ error: 'Error al registrar cliente' });
    }
});

// Buscar clientes por término (RUT o Nombre)
    router.get('/clientes/buscar', async (req, res) => {
    const termino = req.query.q; // Captura lo que escribes en el buscador
    
    if (!termino) {
        return res.json([]);
    }

    try {
        // Buscamos coincidencias en RUT o NOMBRE
        // ILIKE hace que no importe si es mayúscula o minúscula
        const { rows } = await pool.query(
            'SELECT * FROM clientes WHERE rut ILIKE $1 OR razon_social ILIKE $1 LIMIT 5',
            [`%${termino}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error en buscador:', error);
        res.status(500).json({ error: 'Error al buscar cliente' });
    }
});

// calcular deuda pendiente
router.get('/clientes/deuda/:rut', async (req, res) => {
    const { rut } = req.params;
    try {
        const query = `
            SELECT 
                c.limite_credito,
                COALESCE(SUM(v.total_final), 0) as deuda_actual
            FROM clientes c
            LEFT JOIN ventas v ON c.rut = v.rut AND v.forma_pago  = 'CREDITO' AND v.pagada = false
            WHERE c.rut = $1
            GROUP BY c.limite_credito`;
        const { rows } = await pool.query(query, [rut]);
        res.json(rows[0] || { limite_credito: 0, deuda_actual: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;