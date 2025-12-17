require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/dashboard'));
app.use('/api', require('./routes/listas'));
app.use('/api', require('./routes/productos'));
app.use('/api', require('./routes/movimientos'));
app.use('/api', require('./routes/stock'));
app.use('/api', require('./routes/reportes'));

app.listen(port, () => { 
  console.log(`✅ API corriendo en http://localhost:${process.env.PORT}`);
});

console.log('DB HOST:', process.env.DB_HOST);
