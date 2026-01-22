const API = 'http://localhost:3000/api';
let listaVenta = []; // Array para almacenar los productos agregados
let clienteSeleccionado = null

/* ================= logearme ================= */

function handleLogin() {
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;

  fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // 1. Ocultar login y mostrar app
      document.getElementById('login-overlay').style.display = 'none';
      document.getElementById('main-app').style.display = 'flex';
      
      // 2. 🟢 CARGAR DATOS SOLO AHORA
      loadDashboard(); 
      loadListas();
      obtenerProximoNumeroDocumento();
    } else {
      document.getElementById('login-msg').innerHTML = `<p style="color:red">${data.message}</p>`;
    }
  })
  .catch(() => alert('Error de conexión'));
}
/* ================= alertas ================= */
function showStockAlerts() {
  fetch(`${API}/stock`)
    .then(res => {
      if (!res.ok) throw new Error('Error al obtener stock');
      return res.json();
    })
    .then(data => {
      const alertProducts = data.filter(
        p => p.cantidad <= 0 || (p.cantidad <= p.stock_min && p.stock_min > 0)
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

/* ================= LISTAS CON REINTENTO AUTOMÁTICO ================= */
function loadListas() {
  fetch(`${API}/listas`)
    .then(res => {
      if (!res.ok) throw new Error('Error en red');
      return res.json();
    })
    .then(data => {
      const unidad = document.getElementById('unidadProd');
      const grupo = document.getElementById('grupoProd');

      // Limpiar y cargar opciones
      unidad.innerHTML = '';
      grupo.innerHTML = '';

      data.unidades.forEach(u =>
        unidad.innerHTML += `<option value="${u}">${u}</option>`
      );

      data.grupos.forEach(g =>
        grupo.innerHTML += `<option value="${g}">${g}</option>`
      );
      
      console.log("Listas cargadas exitosamente");
    })
    .catch(err => {
      // En lugar de alert('Error cargando listas'), reintentamos en 2 segundos
      console.warn("Fallo al cargar listas, reintentando en 2 segundos...");
      setTimeout(() => {
        loadListas();
      }, 2000);
    });
}

/* ================= PRODUCTOS ================= */
function registrarProducto(e) {
  
  e.preventDefault();

  // 1. CAPTURAS LOS VALORES DE LOS NUEVOS INPUTS
  const costo = document.getElementById('prod-costo').value;
  const venta = document.getElementById('prod-venta').value;

  const producto = {
    codigo: codigoProd.value.trim().toUpperCase(),
    nombre: nombreProd.value.trim(),
    unidad: unidadProd.value,
    grupo: grupoProd.value,
    stock_min: Number(stockMinProd.value)||0,
    // 2. LOS AGREGAS AL OBJETO QUE SE ENVÍA AL BACKEND
    precio_costo: Number(costo) || 0,
    precio_venta: Number(venta) || 0
  };

  fetch(`${API}/productos`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(producto)
  })
  .then(r=>r.json())
  .then(msg=>showMessage('msgProd',msg,'success',limpiarFormProducto()))
  .catch(()=>showMessage('msgProd','Error','error'));
}

async function buscarProducto(texto) {
    if (texto.length < 2) return []; // No buscar si hay menos de 2 letras

    try {
        // La URL debe coincidir con la del backend: /api/productos/buscar?q=...
        const response = await fetch(`${API}/productos/buscar?q=${texto}`);
        
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const productos = await response.json();
        return productos; // Retorna el array de productos encontrados
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
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
  .then(data => {
    const mensajeTexto = data.message || data.msg || "Movimiento registrado";
    showMessage('msgMov', mensajeTexto, 'success');
    limpiarFormMovimiento();
  })

   .catch(()=>showMessage('msgMov','Error','error'));
}
/* ================= registrar venta ================= */
    async function grabarVenta() {
    if (listaVenta.length === 0) {
        alert("La lista de productos está vacía");
        return;
    }

    // Recolectar datos corregidos
    const datosVenta = {
        nro_documento: document.getElementById('txt-nro-boleta').value,
        condiciones: document.getElementById('v-tipo').value,
        forma_pago:document.getElementById('venta-condicion').value,
        cliente: {
            rut: document.getElementById('v-cliente').value, // ID Corregido
            razon_social: document.getElementById('v-razon_social').value // ID Corregido
        },
            // Quitamos puntos y convertimos a número
         productos: listaVenta,
         totales: {
        
         neto: limpiarMonto('total-final-neto'),
         iva: limpiarMonto('total-final-iva'),
         total: limpiarMonto('total-final-total')
    }
        
    };

    try {
        const response = await fetch(`${API}/ventas/grabar`, {
            method: 'POST', // Aseguramos que sea POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });

        const result = await response.json();

        if (result.success) {
            alert("¡Éxito! Venta registrada.");
            LimpiarCamposFormVentas();
            quitarElemento();
            await obtenerProximoNumeroDocumento();
            
        } else {
            alert("Error: " + (result.error || result.message));
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    }
}

function buscarClienteVenta(termino) {
    const lista = document.getElementById('sugerencias-clientes');
    if (termino.length < 2) {
        lista.style.display = 'none';
        return;
    }

    fetch(`${API}/clientes/buscar?q=${termino}`)
        .then(r => r.json())
        .then(data => {
            if (data.length > 0) {
                lista.innerHTML = '';
                data.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'sugerencia-item';
                    div.innerHTML = `<strong>${c.rut}</strong> - ${c.razon_social}`;
                    div.onclick = () => seleccionarCliente(c);
                    lista.appendChild(div);
                });
                lista.style.display = 'block';
            } else {
                lista.style.display = 'none';
            }
        });
}


function buscarProductoVenta(termino) {
    const lista = document.getElementById('sugerencias-productos');
    if (termino.length < 2) {
        lista.style.display = 'none';
        return;
    }

    fetch(`${API}/productos/buscar?q=${termino}`)
        .then(r => r.json())
        .then(data => {
            if (data.length > 0) {
                lista.innerHTML = '';
                data.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'sugerencia-item';
                    div.innerHTML = `<strong>${c.codigo}</strong> - ${c.nombre}`;
                    div.onclick = () => seleccionarProducto(c);
                    lista.appendChild(div);
                });
                lista.style.display = 'block';
            } else {
                lista.style.display = 'none';
            }
        });
}

function seleccionarCliente(cliente) {
    // Rellenamos el campo con el nombre y guardamos el objeto
    document.getElementById('v-cliente').value = cliente.rut;
    document.getElementById('v-razon_social').value = cliente.razon_social;
    document.getElementById('sugerencias-clientes').style.display = 'none';
    
    // Guardamos el cliente seleccionado para usarlo al procesar la venta
    clienteSeleccionado = cliente; 
    console.log("Cliente cargado:", clienteSeleccionado);
}
function seleccionarProducto(cliente) {
    // Rellenamos el campo con el nombre y guardamos el objeto
    document.getElementById('v-codigo').value = cliente.codigo;
    document.getElementById('v-producto').value = cliente.nombre;
    document.getElementById('v-total').value = cliente.precio_venta;
    document.getElementById('sugerencias-productos').style.display = 'none';
    
    // Guardamos el cliente seleccionado para usarlo al procesar la venta
    productoSeleccionado = cliente; 
    console.log("Producto cargado:", productoSeleccionado);
}
/*  ================clientes=====================*/
function guardarCliente() {
    const data = {
        rut: document.getElementById('c-rut').value,
        razon_social: document.getElementById('c-razon_social').value,
        giro: document.getElementById('c-giro').value,
        direccion: document.getElementById('c-dir').value,
        telefono: document.getElementById('c-tel').value
    };

    if (!data.rut || !data.telefono) return alert("RUT y telefono son obligatorios");

    fetch(`${API}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            document.getElementById('c-msg').innerHTML = `<p style="color:green">Cliente guardado con éxito</p>`;
            // Limpiar campos
            ['c-rut', 'c-razon_social', 'c-giro', 'c-dir', 'c-tel'].forEach(id => document.getElementById(id).value = '');
            listarClientes();
        } else {
            alert(res.error);
        }
    });

    
}
/* ================= lista de clientes ================= */
function listarClientes() {
    fetch(`${API}/clientes`)
    .then(r => r.json())
    .then(data => {
      const tablaContainer = document.getElementById('lista-clientes-tabla');
        
        // VALIDACIÓN CRÍTICA:
        if (!Array.isArray(data)) {
            console.error("Los datos recibidos no son una lista:", data);
            tablaContainer.innerHTML = `<p style="color:red">Error: No se pudieron cargar los datos.</p>`;
            return;
        }

        let html = `<table class="table">
            <thead><tr><th>RUT</th><th>Razon social</th><th>Giro</th><th>Direccion</th><th>Telefono</th></tr></thead>
            <tbody>`;
        data.forEach(c => {
            html += `<tr><td>${c.rut}</td><td>${c.razon_social}</td><td>${c.giro || '-'}</td><td>${c.direccion || '-'}</td><td>${c.telefono || '-'}</td></tr>`;
        });
        html += `</tbody></table>`;
        document.getElementById('lista-clientes-tabla').innerHTML = html;
    });
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

  let url = `${API}/movimientos/historial`;
  if(tipo) url += `?tipo=${tipo}`;


     const tablaCuerpo = document.getElementById('tabla-movimientos');
    tablaCuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center;">Buscando...</td></tr>';

    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error('Error en la respuesta del servidor');
            return r.json();
        })
        .then(data => {
            tablaCuerpo.innerHTML = ''; 

            if (!data || data.length === 0) {
                tablaCuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron movimientos.</td></tr>';
                return;
            }

            data.forEach(mov => {
                const fila = document.createElement('tr');
                const fecha = new Date(mov.fecha).toLocaleString();
                const color = (mov.tipo === 'INGRESO' || mov.tipo === 'AJUSTE_POSITIVO') ? '#27ae60' : '#c0392b';

                fila.innerHTML = `
                    <td>${fecha}</td>
                    <td><strong>${mov.codigo}</strong></td>
                    <td style="color: ${color}; font-weight: bold;">${mov.tipo}</td>
                    <td style="color: ${color}; text-align: right; font-family: monospace;">${mov.cantidad}</td>
                    <td><small>${mov.observaciones || '-'}</small></td>
                `;
                tablaCuerpo.appendChild(fila);
            });
        })
        .catch(err => {
            console.error(err);
            tablaCuerpo.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar el historial.</td></tr>';
        });
}


/* ================= UI ================= */
function showTab(tabId, event) {
    // 1. Ocultar todas las secciones de contenido
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.style.display = 'none');

    // 2. Mostrar la sección que corresponde al ID
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';

    // 3. --- LÓGICA PARA MOVER EL COLOR AZUL ---
    // Seleccionamos todos los enlaces del menú
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Removemos la clase 'active' de TODOS
    navLinks.forEach(link => link.classList.remove('active'));

    // Agregamos la clase 'active' al que clickeamos
    // Usamos 'event.currentTarget' para referirnos al <a> presionado
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function showMessage(id,msg,type){
  document.getElementById(id).innerHTML=`<div class="message ${type}">${msg}</div>`;
}

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
  // Ya no llamamos a loadListas() ni loadDashboard() aquí 
  // para evitar peticiones innecesarias antes del login.
  console.log("Esperando inicio de sesión...");
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
/* ================= Mostrar stock ================= */
function displayStockTable(data) {
  const container = document.getElementById('stockTable');
  let html = `<table class="table">
    <thead>
      <tr><th>Código</th><th>Producto</th><th>Stock Actual</th><th>Mínimo</th></tr>
    </thead>
    <tbody>`;
  
  data.forEach(item => {
    const claseAlerta = item.cantidad <= item.stock_min ? 'text-danger' : '';
    html += `<tr class="${claseAlerta}">
      <td>${item.codigo}</td>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${item.stock_min}</td>
    </tr>`;
  });
      html += `</tbody></table>`;
      container.innerHTML = html;
}



/* ================= impresion ================= */
  function imprimirDocumento(data, idVenta) {
    // 1. Llenar datos
    document.getElementById('t-fecha').innerText = new Date().toLocaleString();
    document.getElementById('t-tipo').innerText = data.tipo;
    document.getElementById('t-id').innerText = idVenta;
    document.getElementById('t-cliente').innerText = data.cliente || 'Consumidor Final';
    document.getElementById('t-codigo').innerText = data.codigo;
    document.getElementById('t-cantidad').innerText = data.cantidad;
    document.getElementById('t-total').innerText = `$${parseFloat(data.total).toFixed(2)}`;

    // 2. Obtener el HTML del ticket
    const contenidoTicket = document.getElementById('ticket-impresion').innerHTML;

    // 3. Abrir ventana de impresión
    const ventanaImpresion = window.open('', '', 'height=600,width=450');
    
    ventanaImpresion.document.write('<html><head><title>Imprimir Comprobante</title>');
    // Añadimos un pequeño estilo global para la ventana de impresión
    ventanaImpresion.document.write('<style>body { margin: 0; padding: 0; } @media print { @page { margin: 0; } }</style>');
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenidoTicket);
    ventanaImpresion.document.write('</body></html>');
    
    ventanaImpresion.document.close();
    
    // Esperar a que cargue el contenido antes de imprimir
    setTimeout(() => {
        ventanaImpresion.focus();
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 500);
}

function agregarALaLista() {
    // 1. Capturar datos de los campos superiores
    const codigo = document.getElementById('v-codigo').value;
    const nombre = document.getElementById('v-producto').value;
    const cantidad = parseFloat(document.getElementById('v-cantidad').value) || 0;
    const precioDescuento = document.getElementById('v-descuento').value;
    const precioUnitario = parseFloat(document.getElementById('v-total').value) || 0;

    if (!codigo || cantidad < 1) {
        alert("La cantidad mínima es 1");
        return;
    }

    // 2. BUSCAR SI EL PRODUCTO YA ESTÁ EN LA LISTA
    const indiceExistente = listaVenta.findIndex(item => item.codigo === codigo);

    if (indiceExistente !== -1) {
        // --- CASO: EL PRODUCTO YA EXISTE ---
        // Sumamos la nueva cantidad a la anterior
        listaVenta[indiceExistente].cantidad += cantidad;
        
        // Recalculamos los valores para la nueva cantidad acumulada
        const nuevaCantidad = listaVenta[indiceExistente].cantidad;
        const precioFinal = Math.round(precioUnitario-((precioUnitario * precioDescuento)/100));
        const netoCalculado = Number(((precioFinal / 1.19).toFixed(1)) * nuevaCantidad);
        
        listaVenta[indiceExistente].neto = netoCalculado;
        listaVenta[indiceExistente].iva = Math.round(netoCalculado * 0.19);
        listaVenta[indiceExistente].total = listaVenta[indiceExistente].neto + listaVenta[indiceExistente].iva;
        
        console.log("Producto actualizado:", codigo);
    } else if (precioDescuento > 0 || precioDescuento <=10) {

         
        // --- CASO: PRODUCTO NUEVO con descuento---
        const precioFinal = Math.round(precioUnitario-((precioUnitario * precioDescuento)/100));
        const netoLinea = Math.round(cantidad * (precioFinal / 1.19));
        const ivaLinea = Math.round(netoLinea * 0.19);
        const totalLinea = Math.round(netoLinea + ivaLinea);
        

      listaVenta.push({
            codigo,
            nombre,
            cantidad,
            precioDescuento: precioDescuento, // Verificado
            precioUnitario: precioFinal,
            neto: netoLinea,
            iva: ivaLinea,
            total: totalLinea
        });
        console.log("Producto nuevo agregado:", codigo);
    }else if (precioDescuento == 0 || precioDescuento == ''){
         // --- CASO: PRODUCTO NUEVO sin descuento---
       
        const netoLinea = Number(cantidad * ((precioUnitario / 1.19).toFixed(1)));
        const ivaLinea = Math.round(netoLinea * 0.19);
        const totalLinea = Math.round(netoLinea + ivaLinea);
        

        listaVenta.push({
        codigo,
        nombre,
        cantidad,
        precioDescuento: 0, // <--- AGREGA ESTO PARA QUE NO LLEGUE VACÍO
        precioUnitario: precioUnitario,
        neto: netoLinea,
        iva: ivaLinea,
        total: totalLinea
    });
        console.log("Producto nuevo agregado:", codigo);

    }

    // 3. Actualizar interfaz y limpiar
    actualizarTablaYTotales();
    limpiarCamposProducto(); 
    
}

// Función auxiliar para limpiar solo los campos del producto después de agregar
function limpiarCamposProducto() {
    document.getElementById('v-codigo').value = '';
    document.getElementById('v-producto').value = '';
    document.getElementById('v-cantidad').value = 1 ;
    document.getElementById('v-total').value = '';
    document.getElementById('v-descuento').value = 1 ;

     // 1. Limpiar datos del Cliente
   // document.getElementById('v-cliente').value = '';
    //document.getElementById('v-razon_social').value = '';

    // Ponemos el foco de nuevo en el código para el siguiente producto
    document.getElementById('v-codigo').focus();
}
function LimpiarCamposFormVentas(){
    
    // 1. Vaciar el arreglo que contiene los productos
    listaVenta = []; 
    document.getElementById('v-cliente').value = '';
    document.getElementById('v-razon_social').value = '';
    document.getElementById('total-final-neto').value = 0;
    document.getElementById('total-final-iva').value = 0;
    document.getElementById('total-final-total').value = 0;
}

function actualizarTablaYTotales() {
    const tbody = document.getElementById('cuerpo-venta-lista');
    tbody.innerHTML = '';

    let netoGlobal = 0;
    let ivaGlobal = 0;
    let totalGlobal = 0;

    listaVenta.forEach((item, index) => {
        netoGlobal += item.neto;
        ivaGlobal += item.iva;
        totalGlobal += item.total;

        // Crear fila con el mismo orden de tu imagen
        const fila = `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>${item.precioDescuento}</td>
                <td>$${item.neto.toLocaleString()}</td>
                <td>$${item.iva.toLocaleString()}</td>
                <td>$${item.total.toLocaleString()}</td>
                <td><button onclick="quitarElemento(${index})">❌</button></td>
            </tr>`;
        tbody.innerHTML += fila;
    });

    // 4. Actualizar el cuadro de "Totales" inferior
    document.getElementById('total-final-neto').value = netoGlobal;
    document.getElementById('total-final-iva').value = ivaGlobal;
    document.getElementById('total-final-total').value = totalGlobal;
}

function quitarElemento(index) {
    listaVenta.splice(index, 1);
    actualizarTablaYTotales();
}

async function obtenerProximoNumeroDocumento() {
    // 1. El ID correcto en tu HTML es 'v-tipo' (Línea 102 de index.html)
    const selector = document.getElementById('v-tipo');
    if (!selector) return;
    const tipo = selector.value; 

    try {
        // 2. IMPORTANTE: Verifica que API no tenga una '/' al final para evitar //api//ventas
        const res = await fetch(`${API}/ventas/proximo/${tipo}`);
        
        if (!res.ok) throw new Error("Ruta no encontrada en el servidor");
        
        const data = await res.json();
        
        // 3. El ID del campo donde se muestra el número es 'txt-nro-boleta'
        const inputNro = document.getElementById('txt-nro-boleta');
        if (inputNro) {
            inputNro.value = data.proximo;
        }
    } catch (err) {
        console.error("Error obteniendo correlativo:", err);
    }
}

async function consultarReporteVentas() {
    const fecha = document.getElementById('fecha-reporte-ventas').value;
    if (!fecha) return alert("Selecciona una fecha");

    const res = await fetch(`${API}/ventas/reporte?fecha=${fecha}`);
    const ventas = await res.json();
    
    const tabla = document.getElementById('tabla-reporte-ventas');
    tabla.innerHTML = '';

    ventas.forEach(v => {
        tabla.innerHTML += `
            <tr>
                <td>${v.nro_documento}</td>
                <td>${v.rut}</td>
                <td>${v.razon_social}</td>
                <td>$${Number(v.neto_total).toLocaleString()}</td>
                <td>$${Number(v.iva_total).toLocaleString()}</td>
                <td>$${Number(v.total_final).toLocaleString()}</td>
                <td>
                    <button class="btn btn-secondary" onclick="verDetalleVenta('${v.nro_documento}')">
                        👁️ Ver Detalle
                    </button>
                </td>
            </tr>`;
    });
}

async function verDetalleVenta(nro) {
    const res = await fetch(`${API}/ventas/detalle/${nro}`);
    const detalles = await res.json();
    
    let contenido = `<h4>Documento N° ${nro}</h4><table class="table">
        <thead><tr><th>Producto</th><th>Cant.</th><th>Total</th></tr></thead><tbody>`;
    
    detalles.forEach(d => {
        contenido += `<tr><td>${d.nombre}</td><td>${d.cantidad}</td><td>$${Number(d.total).toLocaleString()}</td></tr>`;
    });
    
    contenido += `</tbody></table>`;
    
    // Usamos tu modal existente
    document.getElementById('modal-titulo').innerText = "Detalle de Venta";
    document.getElementById('modal-mensaje').innerHTML = contenido;
    document.getElementById('modal-notificacion').style.display = 'flex';
}

// validar cliente antes de la venta
async function validarDeudaCliente(rut) {
    const res = await fetch(`${API}/clientes/deuda/${rut}`);
    const data = await res.json();
    
    // Si la condición es crédito, verificamos si excede su límite
    const condicion = document.getElementById('venta-condicion').value;
    const totalVentaActual = calcularTotalVenta(); // Tu función que suma el carrito

    if (condicion === 'CREDITO') {
        const saldoDisponible = data.limite_credito - data.deuda_actual;
        if (totalVentaActual > saldoDisponible) {
            alert(`¡Alerta! El cliente excede su límite de crédito. 
                   Saldo disponible: $${saldoDisponible.toLocaleString()}`);
            return false;
        }
    }
    return true;
}

function limpiarMonto(id) {
    let rawValue = document.getElementById(id).value.toString();
    // Solo reemplazamos la coma por punto si existe, 
    // pero NO eliminamos los puntos porque son el decimal en JS.
    let limpio = rawValue.replace(',', '.'); 
    return parseFloat(limpio) || 0;
}