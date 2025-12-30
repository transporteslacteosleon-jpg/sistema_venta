const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.post('/ventas/grabar', async (req, res) => {
    const { nro_documento, cliente, productos, totales, condiciones } = req.body;

    try {
        await pool.query('BEGIN'); // Iniciar transacción

        // 1. Insertar Cabecera
        const ventaRes = await pool.query(
            `INSERT INTO ventas (nro_documento, rut, razon_social, neto_total, iva_total, total_final, condiciones) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [nro_documento, cliente.rut, cliente.razon_social, totales.neto, totales.iva, totales.total, condiciones]
        );
        const ventaId = ventaRes.rows[0].id;

        // 2. Insertar cada producto y descontar stock
        for (let prod of productos) {
            // Guardar detalle
            await pool.query(
                `INSERT INTO venta_detalles (venta_id, producto_codigo, cantidad, precio_unitario, neto_linea) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [ventaId, prod.codigo, prod.cantidad, prod.precioUnitario, prod.neto]
            );

            // Descontar stock en tabla productos
            await pool.query(
                `UPDATE productos SET stock = stock - $1 WHERE codigo = $2`,
                [prod.cantidad, prod.codigo]
            );

            // Registrar en historial de movimientos
            await pool.query(
                `INSERT INTO movimientos (codigo, tipo, cantidad, observaciones) 
                 VALUES ($1, 'SALIDA', $2, $3)`,
                [prod.codigo, prod.cantidad * -1, `Venta Boleta N° ${nro_documento}`]
            );
        }

        await pool.query('COMMIT'); // Confirmar todo
        res.json({ success: true, message: "Venta grabada con éxito" });

    } catch (error) {
        await pool.query('ROLLBACK'); // Cancelar todo en caso de error
        console.error(error);
        res.status(500).json({ error: "No se pudo grabar la venta" });
    }
});

router.get('/ventas/proximo-numero', async (req, res) => {
    try {
        // Ejecutamos la consulta para obtener el máximo
        const result = await pool.query('SELECT MAX(CAST(nro_documento AS INTEGER)) AS ultimo FROM ventas');
        
        const ultimo = result.rows[0].ultimo;
        
        // Si es NULL (tabla vacía), empezamos en 1, sino sumamos 1
        const proximo = (ultimo === null) ? 1 : ultimo + 1;
        
        res.json({ proximo });
    } catch (error) {
        console.error('Error al generar correlativo:', error);
        res.status(500).json({ error: 'No se pudo generar el número de boleta' });
    }
});

module.exports = router;