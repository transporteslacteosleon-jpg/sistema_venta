const API = 'http://localhost:3000/api';

/* ================= DASHBOARD ================= */
function loadDashboard() {
  fetch(`${API}/dashboard`)
    .then(r => r.json())
    .then(data => {
      const statsGrid = document.getElementById('statsGrid');
      statsGrid.innerHTML = `
        <div class="stat-card"><div class="stat-value">${data.totalProductos}</div><div>Total Productos</div></div>
        <div class="stat-card"><div class="stat-value">${data.totalMovimientos}</div><div>Total Movimientos</div></div>
        <div class="stat-card"><div class="stat-value">${data.sinStock}</div><div>Sin Stock</div></div>
        <div class="stat-card"><div class="stat-value">${data.stockBajo}</div><div>Stock Bajo</div></div>
      `;
    })
    .catch(() => showMessage('statsGrid','Error dashboard','error'));
}

function showStockAlerts() {
  fetch(`${API}/stock`)
    .then(res => {
      if (!res.ok) throw new Error('Error al obtener stock');
      return res.json();
    })
    .then(data => {
      const alertProducts = data.filter(
        p => p.cantidad <= 0 || (p.cantidad <= p.stockMin && p.stockMin > 0)
      );

      const container = document.getElementById('alertsContainer');

      if (!container) {
        console.error('alertsContainer no existe');
        return;
      }

      if (alertProducts.length === 0) {
        container.innerHTML =
          '<div class="message success">No hay productos con alertas de stock</div>';
        return;
      }

      let html = `
        <div class="message warning">
          <strong>${alertProducts.length} producto(s) requieren atención</strong>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Stock Actual</th>
              <th>Stock Mín.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
      `;

      alertProducts.forEach(p => {
        const estado = p.cantidad <= 0 ? 'Sin Stock' : 'Stock Bajo';
        const statusClass = p.cantidad <= 0 ? 'status-zero' : 'status-low';

        html += `
          <tr class="${statusClass}">
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.stock_min}</td>
            <td>${estado}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      document.getElementById('alertsContainer').innerHTML =
        '<div class="message error">Error al cargar alertas</div>';
    });
}

/* ================= LISTAS ================= */
function loadListas() {
  fetch(`${API}/listas`)
    .then(res => res.json())
    .then(data => {
      const unidad = document.getElementById('unidadProd');
      const grupo = document.getElementById('grupoProd');

      unidad.innerHTML = '';
      grupo.innerHTML = '';

      data.unidades.forEach(u =>
        unidad.innerHTML += `<option value="${u}">${u}</option>`
      );

      data.grupos.forEach(g =>
        grupo.innerHTML += `<option value="${g}">${g}</option>`
      );
    })
    .catch(err => {
      console.error(err);
      alert('Error cargando listas');
    });
}

/* ================= PRODUCTOS ================= */
function registrarProducto(e) {
  e.preventDefault();

  const producto = {
    codigo: codigoProd.value.trim().toUpperCase(),
    nombre: nombreProd.value.trim(),
    unidad: unidadProd.value,
    grupo: grupoProd.value,
    stockMin: Number(stockMinProd.value)||0
  };

  fetch(`${API}/productos`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(producto)
  })
  .then(r=>r.json())
  .then(msg=>showMessage('msgProd',msg,'success'))
  .catch(()=>showMessage('msgProd','Error','error'));
}

function buscarProducto(texto) {
  fetch(`${API}/productos/buscar?q=${texto}`)
    .then(r=>r.json())
    .then(displaySearchResults);
}

/* ================= MOVIMIENTOS ================= */
function registrarMovimiento(e) {
  e.preventDefault();

  const mov = {
    codigo: codigoMov.value.trim().toUpperCase(),
    tipo: tipoMov.value,
    cantidad: Number(cantMov.value),
    fecha: fechaMov.value,
    observaciones: obsMov.value
  };

  fetch(`${API}/movimientos`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(mov)
  })
  .then(r=>r.json())
  .then(msg=>showMessage('msgMov',msg,'success'))
  .catch(()=>showMessage('msgMov','Error','error'));
}

/* ================= INVENTARIO ================= */
function mostrarStock() {
  fetch(`${API}/stock`)
    .then(r=>r.json())
    .then(data=>displayStockTable(data,document.getElementById('stockTable')));
}

/* ================= REPORTES ================= */
function mostrarHistorial() {
  const desde = fechaDesde.value;
  const hasta = fechaHasta.value;
  const tipo = filtroTipo.value;

  let url = `${API}/movimientos/historial?desde=${desde}&hasta=${hasta}`;
  if(tipo) url += `&tipo=${tipo}`;

  fetch(url)
    .then(r=>r.json())
    .then(displayHistorialTable);
}

/* ================= UI ================= */
function showTab(tab,event){
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
}

function showMessage(id,msg,type){
  document.getElementById(id).innerHTML=`<div class="message ${type}">${msg}</div>`;
}

/* INIT */
document.addEventListener('DOMContentLoaded',()=>{
  loadListas();
  loadDashboard();
});
/* ================= LIMPIAR FORMULARIOS ================= */

function limpiarFormProducto() {
  const form = document.getElementById('formProducto');
  if (!form) return;

  form.reset();
  document.getElementById('stockMinProd').value = 0;
  document.getElementById('msgProd').innerHTML = '';
  
}

function limpiarFormMovimiento() {
  const form = document.getElementById('formMovimiento');
  if (!form) return;

  form.reset();
  document.getElementById('fechaMov').valueAsDate = new Date();
  document.getElementById('msgMov').innerHTML = '';

  const dropdown = document.getElementById('autocompleteDropdown');
  if (dropdown) dropdown.style.display = 'none';
}
