require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());

// 2. Servir estáticos (CSS, JS del frontend)
app.use(express.static(path.join(__dirname, '../public_html')));

// 3. Rutas de la API
// Si alguna de estas rutas falla, comenta de a una para encontrar el archivo roto
app.use('/api', require('./routes/auth')); 
app.use('/api', require('./routes/dashboard'));
app.use('/api', require('./routes/listas'));
app.use('/api', require('./routes/productos'));
app.use('/api', require('./routes/movimientos'));
app.use('/api', require('./routes/stock'));
app.use('/api', require('./routes/reportes'));
app.use('/api', require('./routes/ventas'));
app.use('/api', require('./routes/clientes'));

// 4. Ruta Catch-all (Simplificada al máximo para Express 5)
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html', 'index.html'));
});


// 5. Iniciar
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});