const express = require('express');
const router = express.Router();
const pool = require('../db'); // conexión PostgreSQL

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND password = $2',
      [username, password]);

    if (rows.length > 0) {
      res.json({ success: true, user: rows[0].username });
    } else {
      res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error("ERROR EN LOGIN:", error);
    // Cambia el mensaje temporalmente para ver el error en el navegador
    res.status(500).json({ success: false, message: error.message }); 
}
});

module.exports = router;