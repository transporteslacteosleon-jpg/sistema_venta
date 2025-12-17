const router = require('express').Router();
const pool = require('../db');
const db = require('../db');

router.post('/movimientos', async (req, res) => {
  const { codigo, tipo, cantidad, fecha, observaciones } = req.body;

  const signo = ['SALIDA','AJUSTE_NEGATIVO'].includes(tipo) ? -1 : 1;

  await pool.query(
    `INSERT INTO movimientos (codigo,tipo,cantidad,fecha,observaciones)
     VALUES ($1,$2,$3,$4,$5)`,
    [codigo, tipo, cantidad * signo, fecha, observaciones]
  );

  res.json('Movimiento registrado correctamente');
});

router.get('/historial', async (req, res) => {
  const { desde, hasta, tipo } = req.query;

  let sql = `
    SELECT fecha,codigo,tipo,cantidad,observaciones
    FROM movimientos
    WHERE fecha BETWEEN $1 AND $2
  `;
  const params = [desde, hasta];

  if (tipo) {
    sql += ' AND tipo=$3';
    params.push(tipo);
  }

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

module.exports = router;
