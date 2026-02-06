require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
// El hosting asigna el puerto automáticamente
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});


app.use(cors());
app.use(express.json());

// Servir archivos estáticos (index.html, styles.css, frontend.js)
// Asumiendo que están en la misma carpeta que server.js
app.use(express.static(path.join(__dirname, 'public')));

// ... otras importaciones
app.use('/api', require('./routes/auth')); 
app.use('/api', require('./routes/dashboard'));
app.use('/api', require('./routes/listas'));
app.use('/api', require('./routes/productos'));
app.use('/api', require('./routes/movimientos'));
app.use('/api', require('./routes/stock'));
app.use('/api', require('./routes/reportes'));
app.use('/api', require('./routes/ventas'));
app.use('/api', require('./routes/clientes'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


console.log('DB HOST:', process.env.DB_HOST);
