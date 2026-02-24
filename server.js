//require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Middlewares iniciales
app.use(cors());
app.use(express.json());

// 2. Servir archivos estáticos
// Asegúrate de que tus archivos .css y .js estén dentro de una carpeta llamada 'public'
app.use(express.static(path.join(__dirname, '../public_html')));


// 3. Rutas de la API (Asegúrate de que las carpetas y archivos existan con estos nombres exactos)
app.use('/api', require('/home/lacteosl/sistema/routes/auth')); 
app.use('/api', require('./routes/dashboard'));
app.use('/api', require('./routes/listas'));
app.use('/api', require('./routes/productos'));
app.use('/api', require('./routes/movimientos'));
app.use('/api', require('./routes/stock'));
app.use('/api', require('./routes/reportes'));
app.use('/api', require('./routes/ventas'));
app.use('/api', require('./routes/clientes'));

// 4. Redirección al Index (Catch-all)
// Si tu index.html está en la RAÍZ, usa la línea de abajo:
// La expresión (.*) le dice a Express que acepte cualquier cadena de texto sin excepciones
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html/index.html'));
});
// NOTA: Si tu index.html está DENTRO de 'public', cámbialo a:
// res.sendFile(path.join(__dirname, 'public', 'index.html'));

// 5. Iniciar el servidor (AL FINAL)
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    res.sendFile(path.join(__dirname, '../public_html/index.html'));
});

console.log('DB HOST:', process.env.DB_HOST);