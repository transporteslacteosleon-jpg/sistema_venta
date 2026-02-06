require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080; // Clever Cloud usa el 8080 por defecto
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
//const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (index.html, styles.css, frontend.js)
// Asumiendo que están en la misma carpeta que server.js
app.use(express.static(__dirname));
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

app.listen(port, () => { 
  console.log(`✅ API corriendo en http://localhost:${process.env.PORT}`);
});

console.log('DB HOST:', process.env.DB_HOST);
