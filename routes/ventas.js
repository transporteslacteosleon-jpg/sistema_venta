const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.post('/ventas/grabar', async (req, res) => {

    
    const { nro_documento, cliente, productos, totales, condiciones, forma_pago } = req.body;
    const esPagada = forma_pago === 'CONTADO';
    
    try {
        await pool.query('BEGIN'); // Iniciar transacció
        // 1. Insertar Cabecera
        const ventaRes = await pool.query(
            `INSERT INTO ventas (nro_documento, rut, razon_social, neto_total, iva_total, total_final, tipo_documento,forma_pago,pagada) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [nro_documento, cliente.rut, cliente.razon_social, totales.neto, totales.iva, totales.total, condiciones, forma_pago, esPagada]
        );
        const ventaId = ventaRes.rows[0].id;

        // 2. Insertar cada producto y descontar stock
        for (let prod of productos) {
            // Guardar detalle
            await pool.query(
                `INSERT INTO venta_detalles (venta_id, producto_codigo, descuento, cantidad, precio_unitario, neto, iva, total) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    ventaId, 
                    prod.codigo, 
                    prod.precioDescuento, 
                    prod.cantidad, 
                    prod.precioUnitario, 
                    prod.neto, 
                    prod.iva, 
                    prod.total
                ]
            );

            // 2. CORRECCIÓN: Solo descontar stock si NO es Nota de Venta
    // Usamos el campo 'condiciones' o 'tipo_documento' según guardes el tipo
            if (condiciones !== 'NOTA DE VENTA') {
                await pool.query(
                    'UPDATE productos SET stock = stock - $1 WHERE codigo = $2',
                    [prod.cantidad, prod.codigo]
                );
                
                // Registrar movimiento de salida solo si hubo descuento de stock
                await pool.query(
                    `INSERT INTO movimientos_stock (producto_codigo, tipo_movimiento, cantidad, motivo) 
                    VALUES ($1, 'SALIDA', $2, $3)`,
                    [prod.codigo, prod.cantidad, `Venta ${condiciones} Nro: ${nro_documento}`]
                );
            } else {
                console.log(`Producto ${prod.codigo} no descuenta stock por ser NOTA DE VENTA`);
            }
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
        console.log(proximo);
        res.json({ proximo });
    } catch (error) {
        console.error('Error al generar correlativo:', error);
        res.status(500).json({ error: 'No se pudo generar el número de boleta' });
    }
});


// Obtener historial de ventas por fecha
router.get('/ventas/reporte', async (req, res) => {
    const { fecha } = req.query; // Formato esperado: 'YYYY-MM-DD'
    try {
        const { rows } = await pool.query(
            `SELECT nro_documento, rut, razon_social, neto_total, iva_total, total_final, fecha_emision 
             FROM ventas 
             WHERE DATE(fecha_emision) = $1 
             ORDER BY nro_documento DESC`,
            [fecha]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener reporte:', error);
        res.status(500).json({ error: 'Error al cargar el reporte' });
    }
});

// Obtener detalle de una venta específica
router.get('/ventas/detalle/:nro', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT vd.*, p.nombre 
             FROM venta_detalles vd
             JOIN productos p ON vd.producto_codigo = p.codigo
             JOIN ventas v ON vd.venta_id = v.id
             WHERE v.nro_documento = $1`,
            [req.params.nro]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalle' });
    }
});

// Asegúrate que esté escrito exactamente así
router.get('/ventas/proximo/:tipo', async (req, res) => {
    const { tipo } = req.params;
    try {
        const result = await pool.query(
            'SELECT MAX(nro_documento) as ultimo FROM ventas WHERE tipo_documento = $1',
            [tipo]
        );
        const proximo = (parseInt(result.rows[0].ultimo) || 0) + 1;
        res.json({ proximo });
    } catch (error) {
        console.error('Error al generar correlativo:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router; // Esta línea siempre al final

module.exports = router;